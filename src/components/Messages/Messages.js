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
		numUniqueUsers: "",
		searchTerm: "",
		searchLoading: false,
		searchResults: [],
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
			this.countUniqueUsers(loadedMessages);
		});
	};

	displayMessages = (messages) =>
		messages.length > 0 &&
		messages.map((m) => (
			<Message key={m.timestamp} message={m} user={this.state.user} />
		));

	countUniqueUsers = (messages) => {
		const uniqueUsers = messages.reduce((acc, message) => {
			if (!acc.includes(message.user.name)) {
				acc.push(message.user.name);
			}
			return acc;
		}, []);

		const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
		const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
		this.setState({
			numUniqueUsers,
		});
	};

	isProgressBarVisible = (uploadState) => {
		if (uploadState === "uploading") {
			this.setState({
				shouldShowProgressBar: true,
			});
		} else {
			this.setState({
				shouldShowProgressBar: false,
			});
		}
	};

	displayChannelName = (channel) => (channel ? `#${channel.name}` : "");

	handleSearchChange = (event) => {
		this.setState(
			{
				searchTerm: event.target.value,
				searchLoading: true,
			},
			() => this.handleSearchMessages()
		);
	};

	handleSearchMessages = () => {
		const channelMessages = [...this.state.messages]; // to not mutate the original array
		const regex = new RegExp(this.state.searchTerm, "gi"); // Globaly and Case senstevly
		const searchResults = channelMessages.reduce((acc, message) => {
			if (
				(message.content && message.content.match(regex)) ||
				(message.user.name && message.user.name.match(regex))
			) {
				acc.push(message);
			}

			return acc;
		}, []);

		this.setState({searchResults});
		setTimeout(() => {
			this.setState({ searchLoading: false });
		}, 1000);
	};

	render() {
		const {
			messagesRef,
			channel,
			user,
			messages,
			shouldShowProgressBar,
			numUniqueUsers,
			searchTerm,
			searchResults,
			searchLoading,
		} = this.state;

		return (
			<React.Fragment>
				<MessagesHeader
					channelName={this.displayChannelName(channel)}
					numUniqueUsers={numUniqueUsers}
					handleSearchChange={this.handleSearchChange}
					searchLoading={searchLoading}
				/>

				<Segment>
					<Comment.Group
						className={`messages ${
							shouldShowProgressBar ? "messages__progress" : ""
						}`}
					>
						{searchTerm
							? this.displayMessages(searchResults)
							: this.displayMessages(messages)}
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
