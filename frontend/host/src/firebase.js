import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAToO5fEazdW4aTzznpJbIde9lqheb3fjc",
  authDomain: "airbnb-host-auth-5bdc1.firebaseapp.com",
  projectId: "airbnb-host-auth-5bdc1",
  storageBucket: "airbnb-host-auth-5bdc1.firebasestorage.app",
  messagingSenderId: "970206014453",
  appId: "1:970206014453:web:43c0b8fc844c0c924d0ebc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Use browser language for reCAPTCHA and SMS
try { auth.useDeviceLanguage(); } catch {}

export { auth, RecaptchaVerifier, signInWithPhoneNumber };

