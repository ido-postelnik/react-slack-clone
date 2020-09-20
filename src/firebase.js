import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

var firebaseConfig = {
	apiKey: "AIzaSyCj6PIiFKXK8cZGsoiSsKlt-nK-YqCry0A",
	authDomain: "react-firebase-slack-clo-1d1f2.firebaseapp.com",
	databaseURL: "https://react-firebase-slack-clo-1d1f2.firebaseio.com",
	projectId: "react-firebase-slack-clo-1d1f2",
  storageBucket: "react-firebase-slack-clo-1d1f2.appspot.com",
	messagingSenderId: "242670400035",
	appId: "1:242670400035:web:c4bfd228f6280875503796",
	measurementId: "G-L7P5XBY7PT",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase;
