import React, { Component } from 'react';
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import firebase from '../../firebase';

class Register extends Component {
	state = {
		username: "",
		email: "",
		password: "",
		passwordConformation: "",
		errors: [],
		loading: false,
	};

	isFormValid = () => {
		let errors = [];
		let error;

		if (this.isFormEmpty(this.state)) {
			error = {
				message: "Fill in all fields",
			};
			this.setState({ errors: errors.concat(error) });
			return false;
		} else if (!this.isPasswordValid(this.state)) {
			error = {
				message: "Password is invalid",
			};
			this.setState({ errors: errors.concat(error) });
			return false;
		} else {
			return true;
		}
	};

	isPasswordValid = ({ password, passwordConformation }) => {
		if (password.length < 6 || passwordConformation.length < 6) {
			return false;
		} else if (password !== passwordConformation) {
			return false;
		} else {
			return true;
		}
	};

	isFormEmpty = ({ username, email, password, passwordConformation }) => {
		return (
			!username.length ||
			!email.length ||
			!password.length ||
			!passwordConformation.length
		);
	};

	displayErrors = (errors) =>
		errors.map((error, i) => <p key={i}>{error.message}</p>);

	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value,
		});
	};

	handleSubmit = (event) => {
		event.preventDefault();
		if (this.isFormValid()) {
			// console.log("Register submit: ", this.state);
			this.setState({
				errors: [],
				loading: true,
			});

			firebase
				.auth()
				.createUserWithEmailAndPassword(this.state.email, this.state.password)
				.then((createdUser) => {
          console.log("createdUser: ", createdUser);
          this.setState({ 
            loading : false
          });
				})
				.catch((err) => {
          console.error(err);
          this.setState({ 
            errors: this.state.errors.concat(err), 
            loading: false 
          });
				});
		}
  };
  
  handleInputError = (errors, inputName) => {
    return errors.some((error) =>
			error.message.toLowerCase().includes(inputName)
		)
			? "error"
			: "";
  };

	render() {
		const {
			username,
			email,
			password,
			passwordConformation,
      errors,
      loading
		} = this.state;
		return (
			<Grid textAlign='center' verticalAlign='middle' className='app'>
				<Grid.Column style={{ maxWidth: 450 }}>
					<Header as='h2' icon color='orange' textAlign='center'>
						<Icon name='puzzle piece' color='orange' />
						Register for DevChat
					</Header>
					<Form onSubmit={this.handleSubmit} size='large'>
						<Segment stacked>
							<Form.Input
								fluid
								name='username'
								icon='user'
								iconPosition='left'
								placeholder='Username'
								onChange={this.handleChange}
								value={username}
								type='text'
								className={this.handleInputError(errors, "username")}
							/>

							<Form.Input
								fluid
								name='email'
								icon='mail'
								iconPosition='left'
								placeholder='Email Address'
								onChange={this.handleChange}
								value={email}
								type='email'
								className={this.handleInputError(errors, "email")}
							/>

							<Form.Input
								fluid
								name='password'
								icon='lock'
								iconPosition='left'
								placeholder='Password'
								onChange={this.handleChange}
								value={password}
								type='password'
								className={this.handleInputError(errors, "password")}
							/>

							<Form.Input
								fluid
								name='passwordConformation'
								icon='repeat'
								iconPosition='left'
								placeholder='Password Conformation'
								onChange={this.handleChange}
								value={passwordConformation}
								type='password'
								className={this.handleInputError}
								className={this.handleInputError(errors, "password")}
							/>

							<Button
								fluid
								size='large'
								color='orange'
								className={loading ? "loading" : ""}
								disabled={loading}
							>
								Submit
							</Button>
						</Segment>
					</Form>

					{errors.length > 0 && (
						<Message error>
							<h3>Error</h3>
							{this.displayErrors(errors)}
						</Message>
					)}

					<Message>
						Already a user? <Link to='/login'>Login</Link>
					</Message>
				</Grid.Column>
			</Grid>
		);
	}
}

export default Register;