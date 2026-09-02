import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAzStFCeODQmVbydsq1yxPHryz-cqM8lrU",
  authDomain: "hello4211.firebaseapp.com",
  databaseURL: "https://hello4211-default-rtdb.firebaseio.com",
  projectId: "hello4211",
  storageBucket: "hello4211.firebasestorage.app",
  messagingSenderId: "11131576643",
  appId: "1:11131576643:web:64e4153cee7cb7847e4ff6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
