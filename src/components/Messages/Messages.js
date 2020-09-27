import React, { Component } from "react";
import { connect } from 'react-redux';
import { Segment, Comment } from "semantic-ui-react";
import firebase from '../../firebase';
import { setUserPosts } from "../../actions";

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
		privateChannel: this.props.isPrivateChannel,
		privateMessagesRef: firebase.database().ref("privateMessages"),
		isChannelStarred: false,
		usersRef: firebase.database().ref("users"),
	};

	componentDidMount() {
		const { channel, user } = this.state;

		if (channel && user) {
			this.addListeners(channel.id);
			this.addUserStarsListeners(channel.id, user.uid);
		}
	}

	addUserStarsListeners = (channelId, userId) => {
		this.state.usersRef
			.child(userId)
			.child("starred")
			.once("value")
			.then((data) => {
				if (data.val() !== null) {
					const channelIds = Object.keys(data.val());
					const prevStarred = channelIds.includes(channelId.toString());
					this.setState({
						isChannelStarred: prevStarred,
					});
				}
			});
	};

	addListeners = (channelId) => {
		this.addMessageListener(channelId);
	};

	addMessageListener = (channelId) => {
		let loadedMessages = [];
		let ref = this.getMessagesRef();

		ref.child(channelId).on("child_added", (snap) => {
			loadedMessages.push(snap.val());
			this.setState({
				messages: loadedMessages,
				messagesLoading: false,
			});
			this.countUniqueUsers(loadedMessages);
			this.countUserPosts(loadedMessages);
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

	countUserPosts = (messages) => {
		let userPosts = messages.reduce((acc, message) => {
			if(message.user.name in acc) {
				acc[message.user.name].count += 1;
			} else {
				acc[message.user.name] = {
					avatar: message.user.avatar,
					count: 1
				};
			}

			return acc;
		}, {});

		this.props.setUserPosts(userPosts);
	}

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

	displayChannelName = (channel) => {
		return channel
			? `${this.state.privateChannel ? "@" : "#"}${channel.name}`
			: "";
	};

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

		this.setState({ searchResults });
		setTimeout(() => {
			this.setState({ searchLoading: false });
		}, 1000);
	};

	getMessagesRef = () => {
		const { messagesRef, privateMessagesRef, privateChannel } = this.state;
		return privateChannel ? privateMessagesRef : messagesRef;
	};

	handleStar = () => {
		this.setState(
			(prevState) => ({
				isChannelStarred: !prevState.isChannelStarred,
			}),
			() => {
				this.starChannel();
			}
		);
	};

	starChannel = () => {
		if (this.state.isChannelStarred) {
			this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
				[this.state.channel.id]: {
					name: this.state.channel.name,
					details: this.state.channel.details,
					createdBy: {
						name: this.state.channel.createdBy.name,
						avatar: this.state.channel.createdBy.avatar,
					},
				},
			});
		} else {
			this.state.usersRef
				.child(`${this.state.user.uid}/starred`)
				.child(this.state.channel.id)
				.remove((err) => {
					if (err !== null) {
						console.error(err);
					}
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
			numUniqueUsers,
			searchTerm,
			searchResults,
			searchLoading,
			privateChannel,
			isChannelStarred,
		} = this.state;

		return (
			<React.Fragment>
				<MessagesHeader
					channelName={this.displayChannelName(channel)}
					numUniqueUsers={numUniqueUsers}
					handleSearchChange={this.handleSearchChange}
					searchLoading={searchLoading}
					isPrivateChannel={privateChannel}
					handleStar={this.handleStar}
					isChannelStarred={isChannelStarred}
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
					isPrivateChannel={privateChannel}
					getMessagesRef={this.getMessagesRef}
				/>
			</React.Fragment>
		);
	}
}

export default connect(null, { setUserPosts })(Messages);
