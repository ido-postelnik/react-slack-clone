import React, { Component } from "react";
import { Segment, Comment } from "semantic-ui-react";
import firebase from '../../firebase';

import MessagesHeader from "./MessagesHeader";
import MessagesForm from "./MessagesForm";
import Message from './Message';

class Messages extends Component {
	state = {
		messagesRef: firebase.database().ref("messages"),
		channel: this.props.currentChannel,
		user: this.props.currentUser,
		messages: [],
		messagesLoading: true,
		shouldShowProgressBar: false,
	};

	componentDidMount() {
		const { channel, user } = this.state;

		if (channel && user) {
			this.addListeners(channel.id);
		}
	}

	addListeners = (channelId) => {
		this.addMessageListener(channelId);
	};

	addMessageListener = (channelId) => {
		let loadedMessages = [];

		this.state.messagesRef.child(channelId).on("child_added", (snap) => {
			loadedMessages.push(snap.val());
			this.setState({
				messages: loadedMessages,
				messagesLoading: false,
			});
		});
	};

	displayMessages = (messages) =>
		messages.length > 0 &&
		messages.map((m) => (
			<Message key={m.timestamp} message={m} user={this.state.user} />
		));

	isProgressBarVisible = (uploadState) => {
		if (uploadState === 'uploading') {
			this.setState({
				shouldShowProgressBar: true,
			});
		} else {
			this.setState({
				shouldShowProgressBar: false,
			});
		}
	};

	render() {
		const {
			messagesRef,
			channel,
			user,
			messages,
			shouldShowProgressBar,
		} = this.state;

		return (
			<React.Fragment>
				<MessagesHeader />

				<Segment>
					<Comment.Group
						className={`messages ${
							shouldShowProgressBar ? "messages__progress" : ""
						}`}
					>
						{this.displayMessages(messages)}
					</Comment.Group>
				</Segment>

				<MessagesForm
					messagesRef={messagesRef}
					currentChannel={channel}
					currentUser={user}
					isProgressBarVisible={this.isProgressBarVisible}
				/>
			</React.Fragment>
		);
	}
}

export default Messages;
