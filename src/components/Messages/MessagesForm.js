import React, { Component } from "react";
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import FileModal from "./FileModal";
import ProgressBar from "./ProgressBar";

import { Segment, Button, Input } from "semantic-ui-react";

class MessagesForm extends Component {
	state = {
		message: "",
		loading: false,
		channel: this.props.currentChannel,
		user: this.props.currentUser,
		errors: [],
		modal: false,
		uploadState: "",
		uploadTask: null,
		storageRef: firebase.storage().ref(),
		precentUploaded: 0,
	};

	openModal = () => {
		this.setState({ modal: true });
	};

	closeModal = () => {
		this.setState({ modal: false });
	};

	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value,
			errors: [],
		});
	};

	createMessageObj = (fileUrl = null) => {
		const message = {
			timestamp: firebase.database.ServerValue.TIMESTAMP,
			user: {
				id: this.state.user.uid,
				name: this.state.user.displayName,
				avatar: this.state.user.photoURL,
			},
		};

		if(fileUrl !== null) {
			message.image = fileUrl;
		} else {
			message.content = this.state.message;
		}

		console.log('Created message: ', message);

		return message;
	};

	sendTextMessage = async () => {
		const { messagesRef } = this.props;
		const { message, channel } = this.state;

		if (message) {
			try {
				this.setState({ loading: true });
				await messagesRef.child(channel.id).push().set(this.createMessageObj());
				this.setState({ loading: false, message: "", errors: [] });
			} catch (err) {
				console.error(err);
				this.setState({
					loading: false,
					errors: this.state.errors.concat(err),
				});
			}
		} else {
			this.setState({
				errors: this.state.errors.concat({ message: "Add a message" }),
			});
		}
	};

	uploadFile = async (file, metadata) => {
		const pathToUpload = this.state.channel.id;
		const ref = this.props.messagesRef;
		const filePath = `chat/public/${uuidv4()}.jpg`;

		this.setState({
			uploadState: "uploading",
			uploadTask: this.state.storageRef.child(filePath).put(file, metadata),
		},
			() => {
				this.state.uploadTask.on("state_changed", (snap) => {
					console.log("uploadTask snap: ", snap);
					const precentUploaded = Math.round(
						(snap.bytesTransferred / snap.totalBytes) * 100
					);
					console.log('precentUploaded: ', precentUploaded);
					this.setState({precentUploaded});
				},
				// Handle error of "state_changed"
				(err) => {
				console.error(err);
				this.set({
					errors: this.state.errors.concat(err),
					uploadState: "error",
					uploadTask: null,
				})
			},
			// After "state_changed" finished = uploading the image to firebase storage is done, 
			// We'll get the url for it, and store in the message table in the DB
			// It is the callback of the "on(state_changed)"
			() => {
				this.state.uploadTask.snapshot.ref
					.getDownloadURL()
					.then((downloadUrl) => {
						this.sendFileMessage(downloadUrl, ref, pathToUpload);
					})
					.catch((err) => {
						console.error(err);
						this.set({
							errors: this.state.errors.concat(err),
							uploadState: "error",
							uploadTask: null,
						});
					});
				} // Ends the "state_changed" callback
				) // Ends the "state_changed" on listener
			} // Ends the setState function callback
		)
	};

	sendFileMessage = async (fileUrl, ref, pathToUpload) => {
		try{
			await ref.child(pathToUpload).push().set(this.createMessageObj(fileUrl));

			this.setState({
				uploadState: "done",
			});
		}
		catch(err) {
			console.error(err);
			this.set({
				errors: this.state.errors.concat(err),
			});
		}

	};

	render() {
		const {
			errors,
			message,
			loading,
			modal,
			uploadState,
			precentUploaded,
		} = this.state;
		const isErrorExists = () => {
			const isError = errors.some((e) => {
				return e.message.includes("message");
			});
			return isError ? "error" : "";
		};

		return (
			<Segment className='message__form'>
				<Input
					fluid
					name='message'
					onChange={this.handleChange}
					value={message}
					style={{ marginBottom: "0.7em" }}
					label={<Button icon='add' />}
					labelPosition='left'
					placeholder='Write Your message'
					className={isErrorExists()}
				/>

				<Button.Group icon widths='2'>
					<Button
						onClick={this.sendTextMessage}
						color='orange'
						content='Add Reply'
						labelPosition='left'
						icon='edit'
						disabled={loading}
					/>
					<Button
						onClick={this.openModal}
						color='teal'
						content='Upload Media'
						labelPosition='right'
						icon='cloud upload'
					/>
				</Button.Group>
				<FileModal
					modal={modal}
					closeModal={this.closeModal}
					uploadFile={this.uploadFile}
				/>
				<ProgressBar
					uploadState={uploadState}
					precentUploaded={precentUploaded}
				/>
			</Segment>
		);
	}
}

export default MessagesForm;
