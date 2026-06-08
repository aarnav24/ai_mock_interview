import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "interview-agent-6b9cc.firebaseapp.com",
    projectId: "interview-agent-6b9cc",
    storageBucket: "interview-agent-6b9cc.firebasestorage.app",
    messagingSenderId: "234324350513",
    appId: "1:234324350513:web:bffc9b0aa6ae792a9ae710"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export { auth, provider }