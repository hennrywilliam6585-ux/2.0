
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// WARNING: The configuration below uses placeholder or generated values.
// You MUST replace these values with your own Firebase Project configuration.
// 1. Go to console.firebase.google.com
// 2. Create a new project or select an existing one.
// 3. Register a web app.
// 4. Copy the "firebaseConfig" object and paste it below.
// 5. IMPORTANT: Go to "Authentication" > "Sign-in method" and enable "Email/Password".
// 6. Create a Firestore Database in "test mode" or "production mode" with appropriate rules.

const firebaseConfig = {
  apiKey: "AIzaSyDMp_KCNEp8xYYmQWcxLA8bgTIs6Utm9aA",
  authDomain: "cryptotradingapp-ab34e.firebaseapp.com",
  projectId: "cryptotradingapp-ab34e",
  storageBucket: "cryptotradingapp-ab34e.firebasestorage.app",
  messagingSenderId: "542651495060",
  appId: "1:542651495060:web:a6024628f2061367a8ba81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
