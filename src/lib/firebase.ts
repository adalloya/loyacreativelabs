
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQwphedX_dPE4VcD_QSMsoDmHqvNfesOA",
  authDomain: "loya-creative-labs.firebaseapp.com",
  projectId: "loya-creative-labs",
  storageBucket: "loya-creative-labs.firebasestorage.app",
  messagingSenderId: "771038601658",
  appId: "1:771038601658:web:5c6fdd67022dfd8f3efd83",
  measurementId: "G-J3TTF6HV4D"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics only on client side
let analytics;
if (typeof window !== 'undefined') {
  // dynamically import analytics to avoid SSR issues
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(err => console.log("Analytics init failed (optional)", err));
}

export { db, analytics };
