// ============================================================
// TECHCONTROL
// DASHBOARD
// ============================================================


// ============================================================
// FIREBASE AUTH
// ============================================================

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ============================================================
// FIRESTORE
// ============================================================

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

import {
    auth,
    db
} from "./firebase.js";


// ============================================================
// MÓDULOS
// ============================================================

import {
    initEquipes
} from "./equipes.js";

import {
    initUsuarios
} from "./usuarios.js";

import {
    initTarefas
} from "./tarefas.js";

import {
    initDocumentos
} from "./documentos.js";

import {
    initAvisos
} from "./avisos.js";


// ============================================================
// ELEMENTOS PRINCIPAIS
// ============================================================

const pageLoader =
    document.getElementById("pageLoader");

const dashboardApp =
    document.getElementById("dashboardApp");

const logoutButton =
    document.getElementById("logoutButton");

const sidebar =
    document.getElementById("sidebar");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");


// ============================================================
// DADOS DO USUÁRIO
// ============================================================

const sidebarUserName =
    document.getElementById("sidebarUserName");

const sidebarUserRole =
    document.getElementById("sidebarUserRole");

const sidebarUserAvatar =
    document.getElementById("sidebarUserAvatar");

const topUserName =
    document.getElementById("topUserName");

const topUserRole =
    document.getElementById("topUserRole");

const topUserAvatar =
    document.getElementById("topUserAvatar");

const currentTeamName =
    document.getElementById("currentTeamName");

const welcomeTitle =
    document.getElementById("welcomeTitle");

const welcomeDescription =
    document.getElementById("welcomeDescription");


// ============================================================
// NAVEGAÇÃO
// ============================================================

const menuItems =
    document.querySelectorAll(".menu-item");

const dashboardPages =
    document.querySelectorAll(".dashboard-page");

const currentPageTitle =
    document.getElementById("currentPageTitle");

const openPageButtons =
    document.querySelectorAll("[data-open-page]");


// ============================================================
// MODAL
// ============================================================

const globalModal =
    document.getElementById("globalModal");

const closeGlobalModal =
    document.getElementById("closeGlobalModal");


// ============================================================
// ESTADO
// ============================================================

let currentUser = null;

let currentUserData = null;


// ============================================================
// LOADER
// ============================================================

function hidePageLoader() {

    if (pageLoader) {

        pageLoader.style.display =
            "none";

    }

}


function showDashboard() {

    hidePageLoader();


    if (dashboardApp) {

        dashboardApp.hidden =
            false;

    }

}


// ============================================================
// INICIAIS
// ============================================================

function getInitials(name) {

    if (!name) {

        return "TC";

    }


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    ).toUpperCase();

}


// ============================================================
// NOME DO PERFIL
// ============================================================

function getRoleLabel(role) {

    switch (role) {

        case "admin":

            return "Administrador";


        case "lider":

            return "Líder";


        case "integrante":

            return "Integrante";


        default:

            return "Usuário";

    }

}


// ============================================================
// RENDERIZAR PERFIL
// ============================================================

function renderUserProfile(
    user,
    userData
) {

    const nome =
        userData.nome ||
        user.email ||
        "Usuário";


    const perfil =
        userData.perfil ||
        "integrante";


    const roleLabel =
        getRoleLabel(
            perfil
        );


    const initials =
        getInitials(
            nome
        );


    // ========================================================
    // SIDEBAR
    // ========================================================

    if (sidebarUserName) {

        sidebarUserName.textContent =
            nome;

    }


    if (sidebarUserRole) {

        sidebarUserRole.textContent =
            roleLabel;

    }


    if (sidebarUserAvatar) {

        sidebarUserAvatar.textContent =
            initials;

    }


    // ========================================================
    // TOPBAR
    // ========================================================

    if (topUserName) {

        topUserName.textContent =
            nome;

    }


    if (topUserRole) {

        topUserRole.textContent =
            roleLabel;

    }


    if (topUserAvatar) {

        topUserAvatar.textContent =
            initials;

    }


    // ========================================================
    // BOAS-VINDAS
    // ========================================================

    const firstName =
        nome
            .split(" ")[0];


    if (welcomeTitle) {

        welcomeTitle.textContent =
            `Olá, ${firstName}!`;

    }


    if (welcomeDescription) {

        if (
            perfil === "admin"
        ) {

            welcomeDescription.textContent =
                "Acompanhe o desenvolvimento geral das equipes e do projeto.";

        }

        else if (
            perfil === "lider"
        ) {

            welcomeDescription.textContent =
                "Gerencie sua equipe, tarefas e acompanhe o progresso do módulo.";

        }

        else {

            welcomeDescription.textContent =
                "Acompanhe suas tarefas, documentos e atividades da equipe.";

        }

    }

}


// ============================================================
// RENDERIZAR EQUIPE
// ============================================================

function renderUserTeam(
    userData
) {

    const perfil =
        userData.perfil;


    if (
        perfil === "admin"
    ) {

        if (currentTeamName) {

            currentTeamName.textContent =
                "Todas as equipes";

        }

        return;

    }


    if (
        !userData.equipe
    ) {

        if (currentTeamName) {

            currentTeamName.textContent =
                "Sem equipe";

        }

        return;

    }


    const equipeNumero =
        userData.equipeNumero;


    const equipeNome =
        userData.equipeNome;


    if (currentTeamName) {

        if (
            equipeNumero &&
            equipeNome
        ) {

            currentTeamName.textContent =
                `Equipe ${String(
                    equipeNumero
                ).padStart(
                    2,
                    "0"
                )} - ${equipeNome}`;

        }

        else {

            currentTeamName.textContent =
                "Minha equipe";

        }

    }

}


// ============================================================
// PERMISSÕES
// ============================================================

function applyRolePermissions(
    role
) {

    const protectedElements =
        document.querySelectorAll(
            "[data-role]"
        );


    protectedElements.forEach(
        element => {

            const allowedRoles =
                element
                    .dataset
                    .role
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    );


            if (
                allowedRoles.includes(
                    role
                )
            ) {

                element.classList.add(
                    "role-visible"
                );

            }

            else {

                element.classList.remove(
                    "role-visible"
                );

            }

        }
    );

}


// ============================================================
// ABRIR PÁGINA
// ============================================================

function openPage(
    pageName
) {

    const targetPage =
        document.getElementById(
            `page-${pageName}`
        );


    if (!targetPage) {

        console.warn(
            `Página não encontrada: ${pageName}`
        );

        return;

    }


    // ========================================================
    // VERIFICAR PERMISSÃO
    // ========================================================

    if (
        targetPage.dataset.role &&
        !targetPage.classList.contains(
            "role-visible"
        )
    ) {

        console.warn(
            "Usuário sem permissão para acessar esta página."
        );


        if (
            pageName !== "home"
        ) {

            openPage(
                "home"
            );

        }

        return;

    }


    // ========================================================
    // DESATIVAR PÁGINAS
    // ========================================================

    dashboardPages.forEach(
        page => {

            page.classList.remove(
                "active"
            );

        }
    );


    // ========================================================
    // DESATIVAR MENU
    // ========================================================

    menuItems.forEach(
        item => {

            item.classList.remove(
                "active"
            );

        }
    );


    // ========================================================
    // ATIVAR PÁGINA
    // ========================================================

    targetPage.classList.add(
        "active"
    );


    // ========================================================
    // ATIVAR MENU
    // ========================================================

    const menuButton =
        document.querySelector(
            `.menu-item[data-page="${pageName}"]`
        );


    if (menuButton) {

        menuButton.classList.add(
            "active"
        );

    }


    // ========================================================
    // TÍTULOS
    // ========================================================

    const pageTitles = {

        home:
            "Dashboard",

        equipes:
            "Equipes",

        integrantes:
            "Integrantes",

        tarefas:
            "Tarefas",

        documentos:
            "Documentos",

        avisos:
            "Avisos",

        usuarios:
            "Usuários",

        configuracoes:
            "Configurações"

    };


    if (currentPageTitle) {

        currentPageTitle.textContent =
            pageTitles[pageName] ||
            "TechControl";

    }


    // ========================================================
    // MOBILE
    // ========================================================

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

}


// ============================================================
// MENU
// ============================================================

menuItems.forEach(
    menuItem => {

        menuItem.addEventListener(
            "click",
            () => {

                const page =
                    menuItem
                        .dataset
                        .page;


                if (!page) {

                    return;

                }


                openPage(
                    page
                );

            }
        );

    }
);


// ============================================================
// LINKS INTERNOS
// ============================================================

openPageButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button
                        .dataset
                        .openPage;


                if (page) {

                    openPage(
                        page
                    );

                }

            }
        );

    }
);


// ============================================================
// MENU MOBILE
// ============================================================

if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            if (sidebar) {

                sidebar.classList.toggle(
                    "open"
                );

            }

        }
    );

}


// ============================================================
// FECHAR SIDEBAR CLICANDO FORA
// ============================================================

document.addEventListener(
    "click",
    event => {

        if (
            window.innerWidth > 950
        ) {

            return;

        }


        if (
            !sidebar ||
            !mobileMenuButton
        ) {

            return;

        }


        const clickedSidebar =
            sidebar.contains(
                event.target
            );


        const clickedButton =
            mobileMenuButton.contains(
                event.target
            );


        if (
            !clickedSidebar &&
            !clickedButton
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                logoutButton.disabled =
                    true;


                await signOut(
                    auth
                );


                sessionStorage.removeItem(
                    "techcontrolUser"
                );


                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Erro ao sair:",
                    error
                );


                logoutButton.disabled =
                    false;

            }

        }
    );

}


// ============================================================
// MODAL - X
// ============================================================

if (closeGlobalModal) {

    closeGlobalModal.addEventListener(
        "click",
        () => {

            if (globalModal) {

                globalModal.hidden =
                    true;

            }

        }
    );

}


// ============================================================
// MODAL - CLIQUE FORA
// ============================================================

if (globalModal) {

    globalModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                globalModal
            ) {

                globalModal.hidden =
                    true;

            }

        }
    );

}


// ============================================================
// MODAL - ESC
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            globalModal &&
            !globalModal.hidden
        ) {

            globalModal.hidden =
                true;

        }

    }
);


// ============================================================
// AUTENTICAÇÃO
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        // ====================================================
        // NÃO ESTÁ LOGADO
        // ====================================================

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        try {

            currentUser =
                user;


            // =================================================
            // BUSCAR PERFIL
            // =================================================

            const userReference =
                doc(
                    db,
                    "usuarios",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userReference
                );


            // =================================================
            // PERFIL NÃO EXISTE
            // =================================================

            if (
                !userSnapshot.exists()
            ) {

                console.error(
                    "Perfil do usuário não encontrado no Firestore."
                );


                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";

                return;

            }


            currentUserData =
                userSnapshot.data();


            // =================================================
            // USUÁRIO INATIVO
            // =================================================

            if (
                currentUserData.ativo === false
            ) {

                console.warn(
                    "Usuário desativado."
                );


                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";

                return;

            }


            // =================================================
            // VALIDAR PERFIL
            // =================================================

            const allowedRoles = [

                "admin",
                "lider",
                "integrante"

            ];


            if (
                !allowedRoles.includes(
                    currentUserData.perfil
                )
            ) {

                console.error(
                    "Perfil de usuário inválido."
                );


                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";

                return;

            }


            // =================================================
            // INTERFACE
            // =================================================

            renderUserProfile(
                user,
                currentUserData
            );


            renderUserTeam(
                currentUserData
            );


            applyRolePermissions(
                currentUserData.perfil
            );


            // =================================================
            // INICIALIZAR EQUIPES
            // =================================================

            await initEquipes({

                uid:
                    user.uid,

                ...currentUserData

            });


            // =================================================
            // INICIALIZAR USUÁRIOS
            // =================================================

            await initUsuarios({

                uid:
                    user.uid,

                ...currentUserData

            });


            // =================================================
            // INICIALIZAR TAREFAS
            // =================================================

            await initTarefas({

                uid:
                    user.uid,

                ...currentUserData

            });


            // =================================================
            // INICIALIZAR DOCUMENTOS
            // =================================================

            await initDocumentos({

                uid:
                    user.uid,

                ...currentUserData

            });


            // =================================================
            // INICIALIZAR AVISOS
            // =================================================

            await initAvisos({

                uid:
                    user.uid,

                ...currentUserData

            });


            // =================================================
            // SESSION STORAGE
            // =================================================

            sessionStorage.setItem(
                "techcontrolUser",
                JSON.stringify({

                    uid:
                        user.uid,

                    nome:
                        currentUserData.nome || "",

                    email:
                        user.email || "",

                    matricula:
                        currentUserData.matricula || "",

                    perfil:
                        currentUserData.perfil,

                    equipe:
                        currentUserData.equipe ?? null,

                    equipeNumero:
                        currentUserData.equipeNumero ?? null,

                    equipeNome:
                        currentUserData.equipeNome ?? null

                })
            );


            // =================================================
            // ABRIR HOME
            // =================================================

            openPage(
                "home"
            );


            // =================================================
            // MOSTRAR DASHBOARD
            // =================================================

            showDashboard();


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "================================"
            );

            console.log(
                "TECHCONTROL INICIADO"
            );

            console.log(
                "Usuário:",
                currentUserData.nome
            );

            console.log(
                "Perfil:",
                currentUserData.perfil
            );

            console.log(
                "Equipe:",
                currentUserData.equipe
            );

            console.log(
                "UID:",
                user.uid
            );

            console.log(
                "MÓDULOS CARREGADOS:"
            );

            console.log(
                "Equipes ✅"
            );

            console.log(
                "Usuários ✅"
            );

            console.log(
                "Tarefas ✅"
            );

            console.log(
                "Documentos ✅"
            );

            console.log(
                "Avisos ✅"
            );

            console.log(
                "================================"
            );

        }

        catch (error) {

            console.error(
                "Erro ao carregar dashboard:",
                error
            );


            try {

                await signOut(
                    auth
                );

            }

            catch (logoutError) {

                console.error(
                    "Erro ao encerrar sessão:",
                    logoutError
                );

            }


            window.location.href =
                "index.html";

        }

    }
);