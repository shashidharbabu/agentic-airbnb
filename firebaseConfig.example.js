// Firebase Client Configuration Example
// Get your configuration from: https://console.firebase.google.com/
// Project Settings > General > Your apps > Firebase SDK snippet > Config

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

