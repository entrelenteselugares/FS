import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDM8v62ByvXss5ooCf8rv1tJiFRsYWc6JM",
  authDomain: "foto-segundo-5d919.firebaseapp.com",
  projectId: "foto-segundo-5d919",
  storageBucket: "foto-segundo-5d919.firebasestorage.app",
  messagingSenderId: "85045262838",
  appId: "1:85045262838:web:8a33337e53d21e78db6fd7",
  measurementId: "G-LFXKPMSV1H"
};

const app = initializeApp(firebaseConfig);

// Inicializa o Analytics apenas no browser (evita quebrar caso seja renderizado no lado do servidor/worker)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export default app;
