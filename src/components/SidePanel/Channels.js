import React, { Component } from "react";
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setCurrentChannel } from '../../actions/index';
import { Menu, Icon, Modal, Form, Input, Button } from "semantic-ui-react";

class Channels extends Component {
	state = {
    user: this.props.currentUser,
    activeChannel: '',
		channels: [],
		channelName: "",
		channelDetails: "",
		channelsRef: firebase.database().ref("channels"),
		modal: false,
		firstLoad: true,
	};

	componentDidMount() {
		this.addListeners();
  }
  
  componentWillUnmount() {
    this.removeListeners();
  }

  removeListeners = () => {
    this.state.channelsRef.off();
  }

	addListeners = () => {
		let loadedChannels = [];

		this.state.channelsRef.on("child_added", (snap) => {
			loadedChannels.push(snap.val());
			console.log("loadedChannels: ", loadedChannels);
			this.setState(
				{
					channels: loadedChannels,
				},
				() => {
					this.setFirstChannel();
				}
			);
		});
	};

	closeModal = () => {
		this.setState({
			modal: false,
		});
	};

	openModal = () => {
		this.setState({
			modal: true,
		});
	};

	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value,
		});
	};

	handleSubmit = (event) => {
		event.preventDefault();
		if (this.isFormValid(this.state)) {
			this.addChannel();
		}
	};

	isFormValid = ({ channelName, channelDetails }) => {
		return channelName && channelDetails;
	};

	addChannel = async () => {
		const {
			channels,
			channelsRef,
			channelName,
			channelDetails,
			user,
		} = this.state;
		const key = channelsRef.push().key; // Wr are getting uniq id for every channel added

		const newChannel = {
			id: key,
			name: channelName,
			details: channelDetails,
			createdBy: {
				name: user.displayName,
				avatar: user.photoURL,
			},
		};

		try {
			await channelsRef.child(key).update(newChannel);
			this.setState({
				channelName: "",
				channelDetails: "",
			});

			this.closeModal();
			console.log("Channel added");
		} catch (err) {
			console.error(err);
		}
	};

	setFirstChannel = () => {
		const firstChannel = this.state.channels[0];

		if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel);
		}

		this.setState({
			firstLoad: false,
		});
	};

	changeChannel = (channel) => {
		this.setActiveChannel(channel);
		this.props.setCurrentChannel(channel);
	};

	setActiveChannel = (channel) => {
    this.setState({
			activeChannel: channel.id,
		});
  };

	displayChannels = (channels) => {
		return (
			channels.length > 0 &&
			channels.map((channel) => {
				return (
					<Menu.Item
						key={channel.id}
						onClick={() => this.changeChannel(channel)}
						name={channel.name}
						style={{ opacity: 0.7 }}
						active={channel.id === this.state.activeChannel}
					>
						# {channel.name}
					</Menu.Item>
				);
			})
		);
	};

	render() {
		const { channels, modal } = this.state;

		return (
			<React.Fragment>
				<Menu.Menu style={{ paddingNottom: "2em" }}>
					<Menu.Item>
						<span>
							<Icon name='exchange' /> Channels
						</span>{" "}
						({channels.length}) <Icon name='add' onClick={this.openModal} />
					</Menu.Item>

					{this.displayChannels(channels)}
				</Menu.Menu>

				{/* Add Channel Modal */}
				<Modal basic open={modal} onClose={this.closeModal}>
					<Modal.Header>Add a Channel</Modal.Header>
					<Modal.Content>
						<Form onSubmit={this.handleSubmit}>
							<Form.Field>
								<Input
									fluid
									label='Name of Chanel'
									name='channelName'
									onChange={this.handleChange}
								/>
							</Form.Field>

							<Form.Field>
								<Input
									fluid
									label='About the Channel'
									name='channelDetails'
									onChange={this.handleChange}
								/>
							</Form.Field>
						</Form>
					</Modal.Content>

					<Modal.Actions>
						<Button color='green' inverted onClick={this.handleSubmit}>
							<Icon name='checkmark' /> Add
						</Button>
						<Button color='red' inverted onClick={this.closeModal}>
							<Icon name='remove' /> Cancel
						</Button>
					</Modal.Actions>
				</Modal>
			</React.Fragment>
		);
	}
}

export default connect(null, {setCurrentChannel})(Channels);