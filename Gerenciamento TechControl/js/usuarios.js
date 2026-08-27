// ============================================================
// TECHCONTROL
// USUÁRIOS
// ============================================================

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "./firebase.js";

import {
    getEquipes,
    carregarEquipes
} from "./equipes.js";


// ============================================================
// ELEMENTOS
// ============================================================

const usersTableBody =
    document.getElementById("usersTableBody");

const membersTableBody =
    document.getElementById("membersTableBody");

const totalMembers =
    document.getElementById("totalMembers");

const adminNewUserButton =
    document.getElementById("adminNewUserButton");

const newMemberButton =
    document.getElementById("newMemberButton");

const memberSearch =
    document.getElementById("memberSearch");

const memberTeamFilter =
    document.getElementById("memberTeamFilter");

const globalModal =
    document.getElementById("globalModal");

const globalModalTitle =
    document.getElementById("globalModalTitle");

const globalModalBody =
    document.getElementById("globalModalBody");


// ============================================================
// ESTADO
// ============================================================

let usuarios = [];

let usuarioAtual = null;

let eventosConfigurados = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export async function initUsuarios(userData) {

    usuarioAtual = userData;

    configurarEventos();

    await carregarUsuarios();

}


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

    if (eventosConfigurados) {

        return;

    }


    adminNewUserButton?.addEventListener(
        "click",
        abrirModalNovoUsuario
    );


    newMemberButton?.addEventListener(
        "click",
        abrirModalNovoUsuario
    );


    memberSearch?.addEventListener(
        "input",
        renderizarIntegrantes
    );


    memberTeamFilter?.addEventListener(
        "change",
        renderizarIntegrantes
    );


    eventosConfigurados = true;

}


// ============================================================
// CARREGAR USUÁRIOS
// ============================================================

export async function carregarUsuarios() {

    try {

        const usuariosQuery =
            query(
                collection(
                    db,
                    "usuarios"
                ),
                orderBy(
                    "nome",
                    "asc"
                )
            );


        const snapshot =
            await getDocs(
                usuariosQuery
            );


        usuarios = [];


        snapshot.forEach(
            documento => {

                usuarios.push({

                    uid:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        renderizarTabelaAdmin();

        renderizarIntegrantes();

        atualizarTotalIntegrantes();

    }

    catch (error) {

        console.error(
            "Erro ao carregar usuários:",
            error
        );


        if (usersTableBody) {

            usersTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="table-empty"
                    >
                        Não foi possível carregar os usuários.
                    </td>

                </tr>

            `;

        }

    }

}


// ============================================================
// TOTAL DE INTEGRANTES
// ============================================================

function atualizarTotalIntegrantes() {

    if (!totalMembers) return;


    const ativos =
        usuarios.filter(
            usuario =>
                usuario.ativo !== false
        );


    totalMembers.textContent =
        ativos.length;

}


// ============================================================
// MODAL NOVO USUÁRIO
// ============================================================

function abrirModalNovoUsuario() {

    if (
        !usuarioAtual ||
        usuarioAtual.perfil !== "admin"
    ) {

        mostrarToast(
            "Somente administradores podem cadastrar usuários."
        );

        return;

    }


    const equipes =
        getEquipes();


    globalModalTitle.textContent =
        "Cadastrar usuário";


    globalModalBody.innerHTML = `

        <div
            style="
                padding: 12px;
                margin-bottom: 17px;
                border: 1px solid #bfdbfe;
                border-radius: 9px;
                background: #eff6ff;
                font-size: 9px;
                line-height: 1.6;
                color: #1e40af;
            "
        >

            <strong>
                Antes de cadastrar:
            </strong>

            <br>

            Crie primeiro a conta em
            Firebase Authentication → Users
            e copie o UID gerado.

            O TechControl não armazena senhas
            no Firestore.

        </div>


        <form
            id="newUserForm"
            class="dashboard-form"
        >


            <!-- UID -->

            <div class="dashboard-form-group full">

                <label for="newUserUid">
                    UID do Firebase Authentication
                </label>

                <input
                    type="text"
                    id="newUserUid"
                    placeholder="Cole aqui o UID gerado pelo Firebase"
                    required
                >

            </div>


            <!-- NOME -->

            <div class="dashboard-form-group">

                <label for="newUserName">
                    Nome completo
                </label>

                <input
                    type="text"
                    id="newUserName"
                    placeholder="Ex: Maria Silva"
                    maxlength="100"
                    required
                >

            </div>


            <!-- MATRÍCULA -->

            <div class="dashboard-form-group">

                <label for="newUserRegistration">
                    Matrícula
                </label>

                <input
                    type="text"
                    id="newUserRegistration"
                    placeholder="Ex: 20261234"
                    maxlength="30"
                    required
                >

            </div>


            <!-- EMAIL -->

            <div class="dashboard-form-group full">

                <label for="newUserEmail">
                    E-mail
                </label>

                <input
                    type="email"
                    id="newUserEmail"
                    placeholder="aluno@email.com"
                    maxlength="120"
                    required
                >

            </div>


            <!-- PERFIL -->

            <div class="dashboard-form-group">

                <label for="newUserRole">
                    Perfil
                </label>

                <select
                    id="newUserRole"
                    required
                >

                    <option value="integrante">
                        Integrante
                    </option>

                    <option value="lider">
                        Líder
                    </option>

                    <option value="admin">
                        Administrador
                    </option>

                </select>

            </div>


            <!-- EQUIPE -->

            <div class="dashboard-form-group">

                <label for="newUserTeam">
                    Equipe
                </label>

                <select id="newUserTeam">

                    <option value="">
                        Sem equipe
                    </option>

                    ${equipes.map(
                        equipe => `

                            <option value="${equipe.id}">

                                Equipe ${formatarNumero(
                                    equipe.numero
                                )} - ${escaparHTML(
                                    equipe.nome
                                )}

                            </option>

                        `
                    ).join("")}

                </select>

            </div>


            <!-- ATIVO -->

            <div class="dashboard-form-group full">

                <label for="newUserStatus">
                    Status
                </label>

                <select
                    id="newUserStatus"
                    required
                >

                    <option value="ativo">
                        Ativo
                    </option>

                    <option value="inativo">
                        Inativo
                    </option>

                </select>

            </div>


            <!-- BOTÕES -->

            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelNewUserButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveNewUserButton"
                >

                    <i class="fa-solid fa-user-plus"></i>

                    Cadastrar usuário

                </button>

            </div>

        </form>

    `;


    globalModal.hidden =
        false;


    document
        .getElementById(
            "cancelNewUserButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "newUserForm"
        )
        ?.addEventListener(
            "submit",
            salvarNovoUsuario
        );

}


// ============================================================
// SALVAR NOVO USUÁRIO
// ============================================================

async function salvarNovoUsuario(event) {

    event.preventDefault();


    const uid =
        document
            .getElementById("newUserUid")
            .value
            .trim();


    const nome =
        document
            .getElementById("newUserName")
            .value
            .trim();


    const matricula =
        document
            .getElementById("newUserRegistration")
            .value
            .trim();


    const email =
        document
            .getElementById("newUserEmail")
            .value
            .trim()
            .toLowerCase();


    const perfil =
        document
            .getElementById("newUserRole")
            .value;


    const equipeId =
        document
            .getElementById("newUserTeam")
            .value;


    const ativo =
        document
            .getElementById("newUserStatus")
            .value === "ativo";


    const saveButton =
        document.getElementById(
            "saveNewUserButton"
        );


    // ========================================================
    // VALIDAÇÕES
    // ========================================================

    if (
        !uid ||
        !nome ||
        !matricula ||
        !email
    ) {

        mostrarToast(
            "Preencha todos os campos obrigatórios."
        );

        return;

    }


    if (uid.length < 10) {

        mostrarToast(
            "O UID informado parece inválido."
        );

        return;

    }


    const emailExiste =
        usuarios.some(
            usuario =>
                String(
                    usuario.email
                )
                    .toLowerCase() ===
                email
        );


    if (emailExiste) {

        mostrarToast(
            "Já existe um perfil com esse e-mail."
        );

        return;

    }


    const matriculaExiste =
        usuarios.some(
            usuario =>
                String(
                    usuario.matricula
                )
                    .toLowerCase() ===
                matricula.toLowerCase()
        );


    if (matriculaExiste) {

        mostrarToast(
            "Essa matrícula já está cadastrada."
        );

        return;

    }


    try {

        // Verifica se já existe documento com esse UID

        const userRef =
            doc(
                db,
                "usuarios",
                uid
            );


        const existente =
            await getDoc(
                userRef
            );


        if (existente.exists()) {

            mostrarToast(
                "Já existe um usuário cadastrado com esse UID."
            );

            return;

        }


        setButtonLoading(
            saveButton,
            "Cadastrando..."
        );


        // ====================================================
        // DESCOBRIR EQUIPE
        // ====================================================

        const equipe =
            equipeId
                ? getEquipes().find(
                    item =>
                        item.id === equipeId
                )
                : null;


        // ====================================================
        // CRIAR PERFIL NO FIRESTORE
        // ====================================================

        await setDoc(
            userRef,
            {

                nome,
                email,
                matricula,
                perfil,

                equipe:
                    equipeId || null,

                equipeNumero:
                    equipe?.numero ?? null,

                equipeNome:
                    equipe?.nome ?? null,

                ativo,

                criadoPor:
                    usuarioAtual.uid,

                criadoPorNome:
                    usuarioAtual.nome || "Administrador",

                criadoEm:
                    serverTimestamp(),

                atualizadoEm:
                    serverTimestamp()

            }
        );


        // ====================================================
        // SE FOR LÍDER, VINCULAR À EQUIPE
        // ====================================================

        if (
            perfil === "lider" &&
            equipeId
        ) {

            await definirLiderDaEquipe(
                equipeId,
                uid,
                nome
            );

        }


        fecharModal();


        mostrarToast(
            "Usuário cadastrado com sucesso!"
        );


        await carregarUsuarios();

        await carregarEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao cadastrar usuário:",
            error
        );


        mostrarToast(
            "Não foi possível cadastrar o usuário."
        );


        restaurarBotao(
            saveButton,
            "Cadastrar usuário",
            "fa-user-plus"
        );

    }

}


// ============================================================
// TABELA ADMIN
// ============================================================

function renderizarTabelaAdmin() {

    if (!usersTableBody) return;


    if (usuarios.length === 0) {

        usersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="table-empty"
                >
                    Nenhum usuário cadastrado.
                </td>

            </tr>

        `;

        return;

    }


    usersTableBody.innerHTML =
        "";


    usuarios.forEach(
        usuario => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <div
                        style="
                            display: flex;
                            align-items: center;
                            gap: 9px;
                        "
                    >

                        <div class="profile-avatar">

                            ${obterIniciais(
                                usuario.nome
                            )}

                        </div>


                        <strong>

                            ${escaparHTML(
                                usuario.nome ||
                                "Usuário"
                            )}

                        </strong>

                    </div>

                </td>


                <td>

                    ${escaparHTML(
                        usuario.email || "-"
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        usuario.matricula || "-"
                    )}

                </td>


                <td>

                    ${
                        usuario.equipeNome
                            ? escaparHTML(
                                usuario.equipeNome
                            )
                            : "-"
                    }

                </td>


                <td>

                    <span class="
                        badge
                        ${getRoleBadge(
                            usuario.perfil
                        )}
                    ">

                        ${getRoleLabel(
                            usuario.perfil
                        )}

                    </span>

                </td>


                <td>

                    <div
                        style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 8px;
                        "
                    >

                        <span class="
                            badge
                            ${
                                usuario.ativo !== false
                                    ? "badge-success"
                                    : "badge-danger"
                            }
                        ">

                            ${
                                usuario.ativo !== false
                                    ? "Ativo"
                                    : "Inativo"
                            }

                        </span>


                        <button
                            type="button"
                            class="btn btn-secondary edit-user-button"
                            data-id="${usuario.uid}"
                            style="
                                padding: 6px 9px;
                                font-size: 8px;
                            "
                        >

                            <i class="fa-solid fa-pen"></i>

                        </button>

                    </div>

                </td>

            `;


            usersTableBody.appendChild(
                row
            );

        }
    );


    document
        .querySelectorAll(
            ".edit-user-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        abrirModalEditarUsuario(
                            button.dataset.id
                        )
                );

            }
        );

}


// ============================================================
// INTEGRANTES
// ============================================================

function renderizarIntegrantes() {

    if (!membersTableBody) return;


    const pesquisa =
        memberSearch?.value
            .trim()
            .toLowerCase() || "";


    const equipeFiltro =
        memberTeamFilter?.value || "";


    let filtrados =
        [...usuarios];


    // ========================================================
    // LÍDER NÃO VÊ OUTRAS EQUIPES
    // ========================================================

    if (
        usuarioAtual?.perfil === "lider"
    ) {

        filtrados =
            filtrados.filter(
                usuario =>
                    usuario.equipe ===
                    usuarioAtual.equipe
            );

    }


    // ========================================================
    // INTEGRANTE
    // ========================================================

    if (
        usuarioAtual?.perfil === "integrante"
    ) {

        filtrados =
            filtrados.filter(
                usuario =>
                    usuario.equipe ===
                    usuarioAtual.equipe
            );

    }


    // ========================================================
    // PESQUISA
    // ========================================================

    if (pesquisa) {

        filtrados =
            filtrados.filter(
                usuario => {

                    const dados = `
                        ${usuario.nome || ""}
                        ${usuario.email || ""}
                        ${usuario.matricula || ""}
                    `
                        .toLowerCase();


                    return dados.includes(
                        pesquisa
                    );

                }
            );

    }


    // ========================================================
    // FILTRO DA EQUIPE
    // ========================================================

    if (equipeFiltro) {

        filtrados =
            filtrados.filter(
                usuario =>
                    usuario.equipe ===
                    equipeFiltro
            );

    }


    if (filtrados.length === 0) {

        membersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="table-empty"
                >
                    Nenhum integrante encontrado.
                </td>

            </tr>

        `;

        return;

    }


    membersTableBody.innerHTML =
        "";


    filtrados.forEach(
        usuario => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <div
                        style="
                            display: flex;
                            align-items: center;
                            gap: 9px;
                        "
                    >

                        <div class="profile-avatar">

                            ${obterIniciais(
                                usuario.nome
                            )}

                        </div>


                        <div>

                            <strong>

                                ${escaparHTML(
                                    usuario.nome
                                )}

                            </strong>

                            <div
                                style="
                                    color: #94a3b8;
                                    font-size: 7px;
                                    margin-top: 2px;
                                "
                            >

                                ${escaparHTML(
                                    usuario.email || ""
                                )}

                            </div>

                        </div>

                    </div>

                </td>


                <td>

                    ${escaparHTML(
                        usuario.matricula || "-"
                    )}

                </td>


                <td>

                    ${
                        usuario.equipeNome
                            ? escaparHTML(
                                usuario.equipeNome
                            )
                            : "Sem equipe"
                    }

                </td>


                <td>

                    ${getRoleLabel(
                        usuario.perfil
                    )}

                </td>


                <td>

                    <span class="
                        badge
                        ${
                            usuario.ativo !== false
                                ? "badge-success"
                                : "badge-danger"
                        }
                    ">

                        ${
                            usuario.ativo !== false
                                ? "Ativo"
                                : "Inativo"
                        }

                    </span>

                </td>


                <td>

                    ${
                        usuarioAtual?.perfil === "admin"
                            ? `

                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-secondary
                                        member-edit-button
                                    "
                                    data-id="${usuario.uid}"
                                    style="
                                        padding: 6px 9px;
                                        font-size: 8px;
                                    "
                                >

                                    Editar

                                </button>

                            `
                            : "-"
                    }

                </td>

            `;


            membersTableBody.appendChild(
                row
            );

        }
    );


    document
        .querySelectorAll(
            ".member-edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        abrirModalEditarUsuario(
                            button.dataset.id
                        )
                );

            }
        );

}


// ============================================================
// EDITAR USUÁRIO
// ============================================================

function abrirModalEditarUsuario(uid) {

    if (
        usuarioAtual?.perfil !== "admin"
    ) {

        mostrarToast(
            "Somente administradores podem editar usuários."
        );

        return;

    }


    const usuario =
        usuarios.find(
            item =>
                item.uid === uid
        );


    if (!usuario) {

        mostrarToast(
            "Usuário não encontrado."
        );

        return;

    }


    const equipes =
        getEquipes();


    globalModalTitle.textContent =
        "Editar usuário";


    globalModalBody.innerHTML = `

        <form
            id="editUserForm"
            class="dashboard-form"
        >


            <div class="dashboard-form-group full">

                <label>
                    UID
                </label>

                <input
                    type="text"
                    value="${escaparAtributo(
                        usuario.uid
                    )}"
                    disabled
                >

            </div>


            <div class="dashboard-form-group">

                <label for="editUserName">
                    Nome
                </label>

                <input
                    type="text"
                    id="editUserName"
                    value="${escaparAtributo(
                        usuario.nome || ""
                    )}"
                    required
                >

            </div>


            <div class="dashboard-form-group">

                <label for="editUserRegistration">
                    Matrícula
                </label>

                <input
                    type="text"
                    id="editUserRegistration"
                    value="${escaparAtributo(
                        usuario.matricula || ""
                    )}"
                    required
                >

            </div>


            <div class="dashboard-form-group full">

                <label for="editUserEmail">
                    E-mail
                </label>

                <input
                    type="email"
                    id="editUserEmail"
                    value="${escaparAtributo(
                        usuario.email || ""
                    )}"
                    required
                >

            </div>


            <div class="dashboard-form-group">

                <label for="editUserRole">
                    Perfil
                </label>

                <select
                    id="editUserRole"
                    required
                >

                    <option
                        value="integrante"
                        ${
                            usuario.perfil === "integrante"
                                ? "selected"
                                : ""
                        }
                    >
                        Integrante
                    </option>

                    <option
                        value="lider"
                        ${
                            usuario.perfil === "lider"
                                ? "selected"
                                : ""
                        }
                    >
                        Líder
                    </option>

                    <option
                        value="admin"
                        ${
                            usuario.perfil === "admin"
                                ? "selected"
                                : ""
                        }
                    >
                        Administrador
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group">

                <label for="editUserTeam">
                    Equipe
                </label>

                <select id="editUserTeam">

                    <option value="">
                        Sem equipe
                    </option>

                    ${equipes.map(
                        equipe => `

                            <option
                                value="${equipe.id}"
                                ${
                                    usuario.equipe === equipe.id
                                        ? "selected"
                                        : ""
                                }
                            >

                                Equipe ${formatarNumero(
                                    equipe.numero
                                )} - ${escaparHTML(
                                    equipe.nome
                                )}

                            </option>

                        `
                    ).join("")}

                </select>

            </div>


            <div class="dashboard-form-group full">

                <label for="editUserStatus">
                    Status
                </label>

                <select
                    id="editUserStatus"
                >

                    <option
                        value="ativo"
                        ${
                            usuario.ativo !== false
                                ? "selected"
                                : ""
                        }
                    >
                        Ativo
                    </option>

                    <option
                        value="inativo"
                        ${
                            usuario.ativo === false
                                ? "selected"
                                : ""
                        }
                    >
                        Inativo
                    </option>

                </select>

            </div>


            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelEditUserButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="updateUserButton"
                >

                    <i class="fa-solid fa-floppy-disk"></i>

                    Salvar alterações

                </button>

            </div>

        </form>

    `;


    globalModal.hidden =
        false;


    document
        .getElementById(
            "cancelEditUserButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "editUserForm"
        )
        ?.addEventListener(
            "submit",
            event =>
                atualizarUsuario(
                    event,
                    usuario
                )
        );

}


// ============================================================
// ATUALIZAR USUÁRIO
// ============================================================

async function atualizarUsuario(
    event,
    usuarioOriginal
) {

    event.preventDefault();


    const nome =
        document
            .getElementById("editUserName")
            .value
            .trim();


    const matricula =
        document
            .getElementById("editUserRegistration")
            .value
            .trim();


    const email =
        document
            .getElementById("editUserEmail")
            .value
            .trim()
            .toLowerCase();


    const perfil =
        document
            .getElementById("editUserRole")
            .value;


    const equipeId =
        document
            .getElementById("editUserTeam")
            .value;


    const ativo =
        document
            .getElementById("editUserStatus")
            .value === "ativo";


    const updateButton =
        document.getElementById(
            "updateUserButton"
        );


    if (
        !nome ||
        !matricula ||
        !email
    ) {

        mostrarToast(
            "Preencha todos os campos obrigatórios."
        );

        return;

    }


    // Evita remover o próprio admin por acidente

    if (
        usuarioOriginal.uid ===
            usuarioAtual.uid &&
        (
            perfil !== "admin" ||
            ativo === false
        )
    ) {

        mostrarToast(
            "Você não pode remover seu próprio acesso de administrador."
        );

        return;

    }


    const equipe =
        equipeId
            ? getEquipes().find(
                item =>
                    item.id === equipeId
            )
            : null;


    try {

        setButtonLoading(
            updateButton,
            "Salvando..."
        );


        await updateDoc(
            doc(
                db,
                "usuarios",
                usuarioOriginal.uid
            ),
            {

                nome,
                email,
                matricula,
                perfil,

                equipe:
                    equipeId || null,

                equipeNumero:
                    equipe?.numero ?? null,

                equipeNome:
                    equipe?.nome ?? null,

                ativo,

                atualizadoPor:
                    usuarioAtual.uid,

                atualizadoPorNome:
                    usuarioAtual.nome || "Administrador",

                atualizadoEm:
                    serverTimestamp()

            }
        );


        // Se agora for líder, vincular equipe

        if (
            perfil === "lider" &&
            equipeId
        ) {

            await definirLiderDaEquipe(
                equipeId,
                usuarioOriginal.uid,
                nome
            );

        }


        // Se deixou de ser líder, limpar liderança antiga

        if (
            usuarioOriginal.perfil === "lider" &&
            (
                perfil !== "lider" ||
                usuarioOriginal.equipe !== equipeId
            )
        ) {

            await removerLiderAnterior(
                usuarioOriginal.uid,
                equipeId
            );

        }


        fecharModal();


        mostrarToast(
            "Usuário atualizado com sucesso!"
        );


        await carregarUsuarios();

        await carregarEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao atualizar usuário:",
            error
        );


        mostrarToast(
            "Não foi possível atualizar o usuário."
        );


        restaurarBotao(
            updateButton,
            "Salvar alterações",
            "fa-floppy-disk"
        );

    }

}


// ============================================================
// DEFINIR LÍDER DA EQUIPE
// ============================================================

async function definirLiderDaEquipe(
    equipeId,
    uid,
    nome
) {

    const equipe =
        getEquipes().find(
            item =>
                item.id === equipeId
        );


    if (!equipe) return;


    // Se a equipe já tinha outro líder,
    // o antigo vira integrante.

    if (
        equipe.liderId &&
        equipe.liderId !== uid
    ) {

        try {

            await updateDoc(
                doc(
                    db,
                    "usuarios",
                    equipe.liderId
                ),
                {

                    perfil:
                        "integrante",

                    atualizadoEm:
                        serverTimestamp()

                }
            );

        }

        catch (error) {

            console.warn(
                "Não foi possível atualizar o líder anterior:",
                error
            );

        }

    }


    await updateDoc(
        doc(
            db,
            "equipes",
            equipeId
        ),
        {

            liderId:
                uid,

            liderNome:
                nome,

            atualizadoEm:
                serverTimestamp()

        }
    );

}


// ============================================================
// REMOVER LÍDER ANTIGO
// ============================================================

async function removerLiderAnterior(
    uid,
    novaEquipeId
) {

    const equipeAntiga =
        getEquipes().find(
            equipe =>
                equipe.liderId === uid &&
                equipe.id !== novaEquipeId
        );


    if (!equipeAntiga) return;


    await updateDoc(
        doc(
            db,
            "equipes",
            equipeAntiga.id
        ),
        {

            liderId:
                null,

            liderNome:
                null,

            atualizadoEm:
                serverTimestamp()

        }
    );

}


// ============================================================
// UTILITÁRIOS
// ============================================================

function getRoleLabel(perfil) {

    switch (perfil) {

        case "admin":
            return "Administrador";

        case "lider":
            return "Líder";

        default:
            return "Integrante";

    }

}


function getRoleBadge(perfil) {

    switch (perfil) {

        case "admin":
            return "badge-primary";

        case "lider":
            return "badge-warning";

        default:
            return "badge-info";

    }

}


function obterIniciais(nome) {

    if (!nome) return "TC";


    const partes =
        nome
            .trim()
            .split(/\s+/);


    if (partes.length === 1) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        partes[0][0] +
        partes[partes.length - 1][0]
    ).toUpperCase();

}


function formatarNumero(numero) {

    return String(
        numero
    ).padStart(
        2,
        "0"
    );

}


function fecharModal() {

    globalModal.hidden =
        true;


    globalModalBody.innerHTML =
        "";

}


function mostrarToast(mensagem) {

    const toast =
        document.getElementById(
            "dashboardToast"
        );


    if (!toast) return;


    toast.textContent =
        mensagem;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        mostrarToast.timeout
    );


    mostrarToast.timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


function setButtonLoading(
    button,
    texto
) {

    if (!button) return;


    button.disabled =
        true;


    button.innerHTML = `

        <span class="loader"></span>

        ${texto}

    `;

}


function restaurarBotao(
    button,
    texto,
    icone = "fa-check"
) {

    if (!button) return;


    button.disabled =
        false;


    button.innerHTML = `

        <i class="fa-solid ${icone}"></i>

        ${texto}

    `;

}


function escaparHTML(valor) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        valor ?? "";


    return div.innerHTML;

}


function escaparAtributo(valor) {

    return String(
        valor ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

}


// ============================================================
// EXPORTAR
// ============================================================

export function getUsuarios() {

    return usuarios;

}