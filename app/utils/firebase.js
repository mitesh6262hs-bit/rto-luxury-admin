
// app/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyAzStFCeODQmVbydsq1yxPHryz-cqM8lrU",
    authDomain: "hello4211.firebaseapp.com",
    databaseURL: "https://hello4211-default-rtdb.firebaseio.com",
    projectId: "hello4211",
    storageBucket: "hello4211.firebasestorage.app",
    messagingSenderId: "11131576643",
    appId: "1:11131576643:web:64e4153cee7cb7847e4ff6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
    isSupported().then(yes => {
        if (yes) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, database, analytics };
