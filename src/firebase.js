import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
 
const firebaseConfig = {
  apiKey: "AIzaSyDus792KN36WJbzhbniqT0u6SSm2TdAuyY",
  authDomain: "pelusa-store.firebaseapp.com",
  projectId: "pelusa-store",
  storageBucket: "pelusa-store.firebasestorage.app",
  messagingSenderId: "781312313250",
  appId: "1:781312313250:web:a763afc2269bfdc45814fb"
};
 
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
 