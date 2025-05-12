
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For demo purposes, we're using placeholder values - in a real app, these would be env variables
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with actual Firebase API key in production
  authDomain: "pomodoro-app.firebaseapp.com",
  projectId: "pomodoro-app",
  storageBucket: "pomodoro-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
