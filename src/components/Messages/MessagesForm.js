import React, { Component } from "react";
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import FileModal from "./FileModal";
import ProgressBar from "./ProgressBar";
import { Picker, emojiIndex } from 'emoji-mart'
import "emoji-mart/css/emoji-mart.css";

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
		isPrivateChannel: this.props.isPrivateChannel,
		typingRef: firebase.database().ref("typing"),
		emojiPicker: false,
	};

	componentWillUnmount() {
		if(this.state.uploadTask !== null) {
			this.state.uploadTask.cancel();
			this.setState({ uploadTask: null })
		}
	}

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

	handleKeyDown = (event) => {
		if (event.ctrlKey && event.keyCode === 13) {
			this.sendTextMessage();
		}

		const { message, typingRef, channel, user } = this.state;

		if (message) {
			typingRef.child(channel.id).child(user.uid).set(user.displayName);
		} else {
			typingRef.child(channel.id).child(user.uid).remove();
		}
	};

	handleTooglePicker = () => {
		this.setState({ emojiPicker: !this.state.emojiPicker });
	};

	handleAddEmoji = (emoji) => {
		const oldMessage = this.state.message;
		const newMessage = this.colonToUnicode(` ${oldMessage} ${emoji.colons} `);
		this.setState({
			message: newMessage,
			emojiPicker: false,
		});
		setTimeout(() => {
			this.messageInputRef.focus();
		}, 0);
	};

	colonToUnicode = (message) => {
		return message.replace(/:[A-Za-z0-9_+-]+:/g, (x) => {
			x = x.replace(/:/g, "");
			let emoji = emojiIndex.emojis[x];
			if (typeof emoji !== "undefined") {
				let unicode = emoji.native;
				if (typeof unicode !== "undefined") {
					return unicode;
				}
			}
			x = ":" + x + ":";
			return x;
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

		if (fileUrl !== null) {
			message.image = fileUrl;
		} else {
			message.content = this.state.message;
		}

		console.log("Created message: ", message);

		return message;
	};

	sendTextMessage = async () => {
		const { getMessagesRef } = this.props;
		const { message, channel, typingRef, user } = this.state;

		if (message) {
			try {
				this.setState({ loading: true });
				await getMessagesRef()
					.child(channel.id)
					.push()
					.set(this.createMessageObj());
				this.setState({ loading: false, message: "", errors: [] });
				typingRef.child(channel.id).child(user.uid).remove();
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

	getPathForSavedFile = () => {
		if (this.state.isPrivateChannel) {
			return `chat/private-${this.state.channel.id}`;
		} else {
			return "chat/public";
		}
	};

	uploadFile = async (file, metadata) => {
		const pathToUpload = this.state.channel.id;
		const ref = this.props.getMessagesRef();
		const filePath = `${this.getPathForSavedFile()}/${uuidv4()}.jpg`;

		this.props.isProgressBarVisible("uploading");
		this.setState(
			{
				uploadState: "uploading",
				uploadTask: this.state.storageRef.child(filePath).put(file, metadata),
			},
			() => {
				this.state.uploadTask.on(
					"state_changed",
					(snap) => {
						// console.log("uploadTask snap: ", snap);
						const precentUploaded = Math.round(
							(snap.bytesTransferred / snap.totalBytes) * 100
						);
						this.setState({ precentUploaded });
					},
					// Handle error of "state_changed"
					(err) => {
						console.error(err);
						this.setState({
							errors: this.state.errors.concat(err),
							uploadState: "error",
							uploadTask: null,
						});
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
				); // Ends the "state_changed" on listener
			} // Ends the setState function callback
		);
	};

	sendFileMessage = async (fileUrl, ref, pathToUpload) => {
		try {
			await ref.child(pathToUpload).push().set(this.createMessageObj(fileUrl));

			this.props.isProgressBarVisible("done");
			this.setState({
				uploadState: "done",
			});
		} catch (err) {
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
			emojiPicker,
		} = this.state;
		const isErrorExists = () => {
			const isError = errors.some((e) => {
				return e.message.includes("message");
			});
			return isError ? "error" : "";
		};

		return (
			<Segment className='message__form'>
				{emojiPicker && (
					<Picker
						set='apple'
						onSelect={this.handleAddEmoji}
						className='emojipicker'
						title='Pick your emoji'
						emoji='point_up'
					/>
				)}
				<Input
					fluid
					name='message'
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
					value={message}
					ref={(node) => (this.messageInputRef = node)}
					style={{ marginBottom: "0.7em" }}
					label={
						<Button
							icon={emojiPicker ? "close" : "add"}
							content={emojiPicker ? "close" : null}
							onClick={this.handleTooglePicker}
						/>
					}
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
						disabled={uploadState === "uploading"}
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
