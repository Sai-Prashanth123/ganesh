// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZBl0xU0vTww89dnVrpKMU5cq24m-rdQ8",
  authDomain: "jobspring-57bac.firebaseapp.com",
  projectId: "jobspring-57bac",
  storageBucket: "jobspring-57bac.firebasestorage.app",
  messagingSenderId: "447496589353",
  appId: "1:447496589353:web:371ee8811513eb700bcc38",
  measurementId: "G-7E89NNH3GQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 