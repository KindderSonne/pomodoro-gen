import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For demo purposes, we're using placeholder values - in a real app, these would be env variables
const firebaseConfig = {
  apiKey: "AIzaSyAqLGnoPlqor1rXJ65_pSZRaMiAn-7pcNw",
  authDomain: "pomo-gen-hust.firebaseapp.com",
  projectId: "pomo-gen-hust",
  storageBucket: "pomo-gen-hust.appspot.com",
  messagingSenderId: "986878524205",
  appId: "1:986878524205:web:0192e7f178d3674998f1a4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
