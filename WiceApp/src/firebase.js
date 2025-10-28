// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC721FuVfUazrMyq0AJDo9E2TBGL-Q8kuk",
    authDomain: "wice-ebdc7.firebaseapp.com",
    projectId: "wice-ebdc7",
    storageBucket: "wice-ebdc7.firebasestorage.app",
    messagingSenderId: "819082040419",
    appId: "1:819082040419:web:c6971070aa053e6c0e1456",
    measurementId: "G-DP91GGX92L",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);