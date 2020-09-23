import React, { Component } from "react";
import firebase from '../../firebase';
import { Grid, Header, Icon, Dropdown} from "semantic-ui-react";

class UserPanel extends Component {
	dropdownOptions = () => [
		{
			key: "user",
			text: (
				<span>
					Signed in as <strong>User</strong>
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
    console.log('Sign out!');
  };

	render() {
		return (
			<Grid style={{ backgroundColor: "#4c3c4c" }}>
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
							trigger={<span>User</span>}
							options={this.dropdownOptions()}
						/>
					</Header>
				</Grid.Column>
			</Grid>
		);
	}
}

export default UserPanel;