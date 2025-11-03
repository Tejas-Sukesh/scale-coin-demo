import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_nLs1gXNmPnbsTwwRsfjLvUNru7aP3VM",
  authDomain: "start-up-scale.firebaseapp.com",
  projectId: "start-up-scale",
  storageBucket: "start-up-scale.firebasestorage.app",
  messagingSenderId: "1048435279426",
  appId: "1:1048435279426:web:27f5895e2d15a52ab94fdb",
  measurementId: "G-Q4DB5YKW8Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
