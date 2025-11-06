// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyBYjBKuMuyq5heokeZ8WuZ2JCDAWLRhH4I",
//   authDomain: "fir-auth-test-62148.firebaseapp.com",
//   projectId: "fir-auth-test-62148",
//   storageBucket: "fir-auth-test-62148.firebasestorage.app",
//   messagingSenderId: "771621178853",
//   appId: "1:771621178853:web:35292e27208a9dbcd1730c",
// };

// Initialize Firebase

const firebaseConfig = {
  apiKey: "AIzaSyB2whEG363Yd2SzhL9MviwooGw46Ce9LP0",
  authDomain: "instagram-clone-kaustav.firebaseapp.com",
  projectId: "instagram-clone-kaustav",
  storageBucket: "instagram-clone-kaustav.appspot.com",
  messagingSenderId: "870544466421",
  appId: "1:870544466421:web:05afaff447fd79d0ea80bc",
  measurementId: "G-NJD8WEW8P7"
};
export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
auth.languageCode = auth.useDeviceLanguage();
export const db = getFirestore(app);
export const userRef = collection(db, "users");
export const roomRef = collection(db, "rooms");
export const storage = getStorage(app);