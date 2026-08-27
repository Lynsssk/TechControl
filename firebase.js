// ============================================
// TECHCONTROL - CONFIGURAÇÃO DO FIREBASE
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// Configuração do projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBtLHdtZGS2Pvt_rOHxm6gfS_FKzjyxLnk",
    authDomain: "techcontrol-9e474.firebaseapp.com",
    projectId: "techcontrol-9e474",
    storageBucket: "techcontrol-9e474.firebasestorage.app",
    messagingSenderId: "438267021870",
    appId: "1:438267021870:web:abd894867fdd5066906dbf",
    measurementId: "G-LMH7B3R3ZK"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
const auth = getAuth(app);

// Firestore Database
const db = getFirestore(app);

// Firebase Storage
const storage = getStorage(app);

// Exporta para os outros arquivos JS
export {
    app,
    auth,
    db,
    storage
};