// ============================================================
// TECHCONTROL
// AUTENTICAÇÃO
// ============================================================

// Firebase
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase.js";


// ============================================================
// ELEMENTOS DA PÁGINA
// ============================================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginButtonIcon = document.getElementById("loginButtonIcon");
const loginLoader = document.getElementById("loginLoader");

const loginMessage = document.getElementById("loginMessage");

const togglePassword = document.getElementById("togglePassword");

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const passwordModal =
    document.getElementById("passwordModal");

const closePasswordModal =
    document.getElementById("closePasswordModal");

const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const resetEmail =
    document.getElementById("resetEmail");

const resetMessage =
    document.getElementById("resetMessage");

const resetButton =
    document.getElementById("resetButton");


// ============================================================
// FUNÇÃO — MOSTRAR MENSAGEM
// ============================================================

function showLoginMessage(message, type = "error") {

    if (!loginMessage) return;

    loginMessage.textContent = message;

    loginMessage.className =
        `login-message show ${type}`;

}


// ============================================================
// FUNÇÃO — LIMPAR MENSAGEM
// ============================================================

function clearLoginMessage() {

    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.className =
        "login-message";

}


// ============================================================
// FUNÇÃO — MENSAGEM DE RECUPERAÇÃO
// ============================================================

function showResetMessage(message, type = "error") {

    if (!resetMessage) return;

    resetMessage.textContent = message;

    resetMessage.className =
        `login-message show ${type}`;

}


// ============================================================
// FUNÇÃO — LOADING DO LOGIN
// ============================================================

function setLoginLoading(loading) {

    if (!loginButton) return;

    loginButton.disabled = loading;

    if (loading) {

        loginButtonText.textContent =
            "Entrando...";

        loginButtonIcon.hidden = true;

        loginLoader.hidden = false;

    } else {

        loginButtonText.textContent =
            "Entrar";

        loginButtonIcon.hidden = false;

        loginLoader.hidden = true;

    }

}


// ============================================================
// MOSTRAR / OCULTAR SENHA
// ============================================================

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        const icon =
            togglePassword.querySelector("i");

        if (!icon) return;

        if (isPassword) {

            icon.classList.remove("fa-eye");

            icon.classList.add("fa-eye-slash");

            togglePassword.setAttribute(
                "aria-label",
                "Ocultar senha"
            );

        } else {

            icon.classList.remove("fa-eye-slash");

            icon.classList.add("fa-eye");

            togglePassword.setAttribute(
                "aria-label",
                "Mostrar senha"
            );

        }

    });

}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearLoginMessage();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // ----------------------------------------------------
        // VALIDAÇÃO
        // ----------------------------------------------------

        if (!email || !password) {

            showLoginMessage(
                "Preencha o e-mail e a senha."
            );

            return;
        }


        setLoginLoading(true);


        try {

            // ------------------------------------------------
            // AUTENTICAÇÃO
            // ------------------------------------------------

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;


            // ------------------------------------------------
            // BUSCAR PERFIL NO FIRESTORE
            // ------------------------------------------------

            const userRef =
                doc(db, "usuarios", user.uid);

            const userSnapshot =
                await getDoc(userRef);


            // ------------------------------------------------
            // USUÁRIO NÃO CADASTRADO NO FIRESTORE
            // ------------------------------------------------

            if (!userSnapshot.exists()) {

                showLoginMessage(
                    "Sua conta foi autenticada, mas seu perfil ainda não foi cadastrado no TechControl."
                );

                setLoginLoading(false);

                return;
            }


            const userData =
                userSnapshot.data();


            // ------------------------------------------------
            // VERIFICAR USUÁRIO ATIVO
            // ------------------------------------------------

            if (userData.ativo === false) {

                showLoginMessage(
                    "Sua conta está desativada. Entre em contato com a administração."
                );

                setLoginLoading(false);

                return;
            }


            // ------------------------------------------------
            // SALVAR DADOS TEMPORÁRIOS
            // ------------------------------------------------

            sessionStorage.setItem(
                "techcontrolUser",
                JSON.stringify({
                    uid: user.uid,
                    nome: userData.nome || "",
                    email: user.email || "",
                    matricula: userData.matricula || "",
                    perfil: userData.perfil || "integrante",
                    equipe: userData.equipe ?? null
                })
            );


            // ------------------------------------------------
            // REDIRECIONAR
            // ------------------------------------------------

            showLoginMessage(
                "Login realizado! Redirecionando...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 500);


        } catch (error) {

            console.error(
                "Erro no login:",
                error
            );


            // ----------------------------------------------
            // TRATAMENTO DE ERROS
            // ----------------------------------------------

            let message =
                "Não foi possível realizar o login.";


            switch (error.code) {

                case "auth/invalid-email":

                    message =
                        "Digite um e-mail válido.";

                    break;


                case "auth/user-not-found":

                    message =
                        "Não encontramos uma conta com esse e-mail.";

                    break;


                case "auth/wrong-password":

                    message =
                        "Senha incorreta.";

                    break;


                case "auth/invalid-credential":

                    message =
                        "E-mail ou senha incorretos.";

                    break;


                case "auth/user-disabled":

                    message =
                        "Esta conta foi desativada.";

                    break;


                case "auth/too-many-requests":

                    message =
                        "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Problema de conexão. Verifique sua internet.";

                    break;


                default:

                    message =
                        "Não foi possível realizar o login. Tente novamente.";

                    break;

            }


            showLoginMessage(message);

            setLoginLoading(false);

        }

    });

}


// ============================================================
// ABRIR MODAL DE RECUPERAÇÃO
// ============================================================

if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener("click", () => {

        clearLoginMessage();

        resetMessage.className =
            "login-message";

        resetMessage.textContent =
            "";

        // Preencher automaticamente com o e-mail
        if (emailInput.value.trim()) {

            resetEmail.value =
                emailInput.value.trim();

        }

        passwordModal.hidden = false;

        setTimeout(() => {

            resetEmail.focus();

        }, 100);

    });

}


// ============================================================
// FECHAR MODAL
// ============================================================

if (closePasswordModal) {

    closePasswordModal.addEventListener(
        "click",
        () => {

            passwordModal.hidden = true;

        }
    );

}


// ============================================================
// FECHAR CLICANDO FORA DO MODAL
// ============================================================

if (passwordModal) {

    passwordModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                passwordModal
            ) {

                passwordModal.hidden = true;

            }

        }
    );

}


// ============================================================
// FECHAR MODAL COM ESC
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            passwordModal &&
            !passwordModal.hidden
        ) {

            passwordModal.hidden = true;

        }

    }
);


// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================

if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                resetEmail.value.trim();


            if (!email) {

                showResetMessage(
                    "Digite seu e-mail."
                );

                return;
            }


            resetButton.disabled = true;


            const originalText =
                resetButton.innerHTML;


            resetButton.innerHTML = `
                <span>Enviando...</span>
                <span class="loader"></span>
            `;


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showResetMessage(
                    "Link de recuperação enviado! Verifique seu e-mail.",
                    "success"
                );


                resetEmail.value = "";


                setTimeout(() => {

                    passwordModal.hidden = true;

                }, 2500);


            } catch (error) {

                console.error(
                    "Erro ao recuperar senha:",
                    error
                );


                let message =
                    "Não foi possível enviar o e-mail de recuperação.";


                switch (error.code) {

                    case "auth/invalid-email":

                        message =
                            "Digite um e-mail válido.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "Não encontramos uma conta com esse e-mail.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "Muitas solicitações. Tente novamente mais tarde.";

                        break;

                }


                showResetMessage(message);

            }


            resetButton.disabled = false;

            resetButton.innerHTML =
                originalText;

        }
    );

}


// ============================================================
// VERIFICAR SESSÃO
// ============================================================
//
// Se alguém já estiver autenticado e abrir o index.html,
// podemos mandar diretamente para o dashboard.
//
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) return;


        try {

            const userRef =
                doc(db, "usuarios", user.uid);

            const userSnapshot =
                await getDoc(userRef);


            if (!userSnapshot.exists()) {

                return;

            }


            const userData =
                userSnapshot.data();


            if (userData.ativo === false) {

                return;

            }


            // Não redirecionar se já estiver no dashboard
            if (
                window.location.pathname.endsWith(
                    "dashboard.html"
                )
            ) {

                return;

            }


            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Erro ao verificar sessão:",
                error
            );

        }

    }
);