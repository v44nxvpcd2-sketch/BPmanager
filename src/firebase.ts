
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVvKI4XfWiGP5L3-SmZCba3k89t0FzE-o",
  authDomain: "bpmenage-5f063.firebaseapp.com",
  databaseURL: "https://bpmenage-5f063-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bpmenage-5f063",
  storageBucket: "bpmenage-5f063.firebasestorage.app",
  messagingSenderId: "280459818552",
  appId: "1:280459818552:web:1e5ee27dd980ee5cbe98cd",
  measurementId: "G-PFZ9P7VW90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const database = getDatabase(app);
