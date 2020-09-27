import React, { Component } from "react";
import firebase from '../../firebase';
import { Grid, Header, Icon, Dropdown, Image} from "semantic-ui-react";

class UserPanel extends Component {
	state = {
		user: this.props.currentUser,
	};

	dropdownOptions = () => [
		{
			key: "user",
			text: (
				<span>
					Signed in as{" "}
					<strong>{this.state.user.displayName}</strong>
				</span>
			),
			disabled: true,
		},
		{
			key: "avatar",
			text: <span>Change Avatar</span>,
		},
		{
			key: "signout",
			text: <span onClick={this.handleSignout}>Sign Out</span>,
		},
	];

	handleSignout = async () => {
		await firebase.auth().signOut();
		console.log("Sign out!");
	};

	render() {
		const { user } = this.state;
		const { primaryColor } = this.props;

		return (
			<Grid style={{ backgroundColor: primaryColor }}>
				<Grid.Column>
					<Grid.Row style={{ padding: "1.2rem", margin: 0 }}>
						{/* App Header */}
						<Header inverted floated='left' as='h2'>
							<Icon name='code' />
							<Header.Content>DevChat</Header.Content>
						</Header>
					</Grid.Row>

					{/* User Options */}
					<Header style={{ padding: "0.25em" }} as='h4' inverted>
						<Dropdown
							trigger={
								<span>
									<Image src={user.photoURL} space='right' avatar />
									{user.displayName}
								</span>
							}
							options={this.dropdownOptions()}
						/>
					</Header>
				</Grid.Column>
			</Grid>
		);
	}
}


export default UserPanel;
