import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyMockKeyForFirebaseConfigHere",
  authDomain: "gestarian2.firebaseapp.com",
  projectId: "gestarian2",
  storageBucket: "gestarian2.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
