import React, { Component } from "react";
import firebase from '../../firebase';
import { Segment, Button, Input } from "semantic-ui-react";

class MessagesForm extends Component {
	state = {
		message: "",
		loading: false,
		channel: this.props.currentChannel,
		user: this.props.currentUser,
		errors: []
	};

	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value,
		});
	};

	createMessage = () => {
		return {
			content: this.state.message,
			timestamp: firebase.database.ServerValue.TIMESTAMP,
			user: {
				id: this.state.user.uid,
				name: this.state.user.displayName,
				avatar: this.state.user.photoURL
			},
		};
	};

	sendMessage = async () => {
		const { messagesRef } = this.props;
		const { message, channel } = this.state;

		if (message) {
			try{
				this.setState({ loading: true });
				await messagesRef.child(channel.id).push().set(this.createMessage());
				this.setState({ loading: false, message: "", errors: [] });
			}
			catch(err) {
				console.error(err);
				this.setState({
					loading: false,
					errors: this.state.errors.concat(err)
				})
			}
		} else {
			this.setState({
				errors: this.state.errors.concat({message: 'Add a message'}),
			});
		}
	};

	render() {
		const { errors, message, loading } = this.state;
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
						onClick={this.sendMessage}
						color='orange'
						content='Add Reply'
						labelPosition='left'
						icon='edit'
						disabled={loading}
					/>
					<Button
						color='green'
						content='Upload Media'
						labelPosition='right'
						icon='cloud upload'
					/>
				</Button.Group>
			</Segment>
		);
	}
}

export default MessagesForm;
