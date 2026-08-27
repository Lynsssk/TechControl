// ============================================================
// TECHCONTROL
// AVISOS
// ============================================================

import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "./firebase.js";

import {
    getEquipes
} from "./equipes.js";


// ============================================================
// ELEMENTOS
// ============================================================

const newNoticeButton =
    document.getElementById("newNoticeButton");

const noticesList =
    document.getElementById("noticesList");

const globalModal =
    document.getElementById("globalModal");

const globalModalTitle =
    document.getElementById("globalModalTitle");

const globalModalBody =
    document.getElementById("globalModalBody");


// ============================================================
// ESTADO
// ============================================================

let avisos = [];

let usuarioAtual = null;

let eventosConfigurados = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export async function initAvisos(userData) {

    usuarioAtual = userData;

    configurarEventos();

    await carregarAvisos();

}


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

    if (eventosConfigurados) {

        return;

    }


    newNoticeButton?.addEventListener(
        "click",
        abrirModalNovoAviso
    );


    eventosConfigurados = true;

}


// ============================================================
// NOVO AVISO
// ============================================================

function abrirModalNovoAviso() {

    if (!usuarioAtual) {

        return;

    }


    if (
        usuarioAtual.perfil !== "admin" &&
        usuarioAtual.perfil !== "lider"
    ) {

        mostrarToast(
            "Você não possui permissão para publicar avisos."
        );

        return;

    }


    let equipes =
        getEquipes();


    if (
        usuarioAtual.perfil === "lider"
    ) {

        equipes =
            equipes.filter(
                equipe =>
                    equipe.id ===
                    usuarioAtual.equipe
            );

    }


    globalModalTitle.textContent =
        "Novo aviso";


    globalModalBody.innerHTML = `

        <form
            id="newNoticeForm"
            class="dashboard-form"
        >

            <!-- TÍTULO -->

            <div class="dashboard-form-group full">

                <label for="noticeTitle">
                    Título
                </label>

                <input
                    type="text"
                    id="noticeTitle"
                    placeholder="Ex: Reunião geral do projeto"
                    maxlength="120"
                    required
                >

            </div>


            <!-- MENSAGEM -->

            <div class="dashboard-form-group full">

                <label for="noticeMessage">
                    Mensagem
                </label>

                <textarea
                    id="noticeMessage"
                    placeholder="Digite o comunicado..."
                    maxlength="800"
                    required
                ></textarea>

            </div>


            <!-- DESTINO -->

            <div class="dashboard-form-group">

                <label for="noticeTarget">
                    Destino
                </label>

                <select
                    id="noticeTarget"
                    required
                >

                    ${
                        usuarioAtual.perfil === "admin"
                        ? `
                            <option value="geral">
                                Toda a turma
                            </option>
                        `
                        : ""
                    }

                    <option value="equipe">
                        Uma equipe
                    </option>

                </select>

            </div>


            <!-- EQUIPE -->

            <div class="dashboard-form-group">

                <label for="noticeTeam">
                    Equipe
                </label>

                <select id="noticeTeam">

                    <option value="">
                        Selecione
                    </option>

                    ${equipes.map(
                        equipe => `

                            <option
                                value="${equipe.id}"
                                ${
                                    usuarioAtual.perfil === "lider"
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


            <!-- IMPORTÂNCIA -->

            <div class="dashboard-form-group full">

                <label for="noticePriority">
                    Importância
                </label>

                <select
                    id="noticePriority"
                    required
                >

                    <option value="normal">
                        Normal
                    </option>

                    <option value="importante">
                        Importante
                    </option>

                    <option value="urgente">
                        Urgente
                    </option>

                </select>

            </div>


            <!-- AÇÕES -->

            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelNoticeButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveNoticeButton"
                >

                    <i class="fa-solid fa-bullhorn"></i>

                    Publicar aviso

                </button>

            </div>

        </form>

    `;


    globalModal.hidden =
        false;


    const targetSelect =
        document.getElementById(
            "noticeTarget"
        );


    const teamSelect =
        document.getElementById(
            "noticeTeam"
        );


    // ========================================================
    // CONTROLAR EQUIPE
    // ========================================================

    function atualizarDestino() {

        if (
            targetSelect.value === "geral"
        ) {

            teamSelect.disabled =
                true;

            teamSelect.value =
                "";

        }

        else {

            teamSelect.disabled =
                false;


            if (
                usuarioAtual.perfil === "lider"
            ) {

                teamSelect.value =
                    usuarioAtual.equipe;

            }

        }

    }


    targetSelect?.addEventListener(
        "change",
        atualizarDestino
    );


    atualizarDestino();


    document
        .getElementById(
            "cancelNoticeButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "newNoticeForm"
        )
        ?.addEventListener(
            "submit",
            salvarAviso
        );

}


// ============================================================
// SALVAR AVISO
// ============================================================

async function salvarAviso(event) {

    event.preventDefault();


    const titulo =
        document
            .getElementById(
                "noticeTitle"
            )
            .value
            .trim();


    const mensagem =
        document
            .getElementById(
                "noticeMessage"
            )
            .value
            .trim();


    const destino =
        document
            .getElementById(
                "noticeTarget"
            )
            .value;


    const equipeId =
        document
            .getElementById(
                "noticeTeam"
            )
            .value || null;


    const prioridade =
        document
            .getElementById(
                "noticePriority"
            )
            .value;


    const saveButton =
        document.getElementById(
            "saveNoticeButton"
        );


    // ========================================================
    // VALIDAÇÕES
    // ========================================================

    if (
        !titulo ||
        !mensagem
    ) {

        mostrarToast(
            "Preencha o título e a mensagem."
        );

        return;

    }


    if (
        destino === "equipe" &&
        !equipeId
    ) {

        mostrarToast(
            "Selecione uma equipe."
        );

        return;

    }


    if (
        usuarioAtual.perfil === "lider" &&
        equipeId !== usuarioAtual.equipe
    ) {

        mostrarToast(
            "Você só pode publicar avisos para sua própria equipe."
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


    setButtonLoading(
        saveButton,
        "Publicando..."
    );


    try {

        await addDoc(
            collection(
                db,
                "avisos"
            ),
            {

                titulo,

                mensagem,

                prioridade,

                destino,

                equipeId:
                    equipe?.id || null,

                equipeNumero:
                    equipe?.numero ?? null,

                equipeNome:
                    equipe?.nome || null,

                autorId:
                    usuarioAtual.uid,

                autorNome:
                    usuarioAtual.nome,

                autorPerfil:
                    usuarioAtual.perfil,

                criadoEm:
                    serverTimestamp()

            }
        );


        fecharModal();


        mostrarToast(
            "Aviso publicado com sucesso!"
        );


        await carregarAvisos();

    }

    catch (error) {

        console.error(
            "Erro ao publicar aviso:",
            error
        );


        mostrarToast(
            "Não foi possível publicar o aviso."
        );


        restaurarBotao(
            saveButton,
            "Publicar aviso",
            "fa-bullhorn"
        );

    }

}


// ============================================================
// CARREGAR AVISOS
// ============================================================

export async function carregarAvisos() {

    try {

        const avisosQuery =
            query(
                collection(
                    db,
                    "avisos"
                ),
                orderBy(
                    "criadoEm",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                avisosQuery
            );


        avisos =
            [];


        snapshot.forEach(
            documento => {

                avisos.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        renderizarAvisos();

    }

    catch (error) {

        console.error(
            "Erro ao carregar avisos:",
            error
        );


        if (noticesList) {

            noticesList.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <span>
                        Não foi possível carregar os avisos.
                    </span>

                </div>

            `;

        }

    }

}


// ============================================================
// AVISOS PERMITIDOS
// ============================================================

function getAvisosPermitidos() {

    if (
        usuarioAtual.perfil === "admin"
    ) {

        return [...avisos];

    }


    return avisos.filter(
        aviso => {

            if (
                aviso.destino === "geral"
            ) {

                return true;

            }


            return (
                aviso.equipeId ===
                usuarioAtual.equipe
            );

        }
    );

}


// ============================================================
// RENDERIZAR
// ============================================================

function renderizarAvisos() {

    if (!noticesList) {

        return;

    }


    const lista =
        getAvisosPermitidos();


    if (
        lista.length === 0
    ) {

        noticesList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-bullhorn"></i>

                <span>
                    Nenhum aviso cadastrado.
                </span>

            </div>

        `;

        return;

    }


    noticesList.innerHTML =
        "";


    lista.forEach(
        aviso => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "notice-card";


            const podeExcluir =
                usuarioAtual.perfil === "admin" ||
                aviso.autorId === usuarioAtual.uid;


            card.innerHTML = `

                <div
                    class="notice-card-icon"
                    style="${getPriorityStyle(
                        aviso.prioridade
                    )}"
                >

                    <i class="${getPriorityIcon(
                        aviso.prioridade
                    )}"></i>

                </div>


                <div
                    style="
                        flex: 1;
                        min-width: 0;
                    "
                >

                    <div
                        style="
                            display: flex;
                            align-items: flex-start;
                            justify-content: space-between;
                            gap: 10px;
                        "
                    >

                        <div>

                            <h4>

                                ${escaparHTML(
                                    aviso.titulo
                                )}

                            </h4>


                            <span
                                class="
                                    badge
                                    ${getPriorityBadge(
                                        aviso.prioridade
                                    )}
                                "
                                style="
                                    margin-top: 7px;
                                "
                            >

                                ${getPriorityLabel(
                                    aviso.prioridade
                                )}

                            </span>

                        </div>


                        ${
                            podeExcluir
                                ? `

                                    <button
                                        type="button"
                                        class="delete-notice-button"
                                        data-id="${aviso.id}"
                                        style="
                                            border: 0;
                                            background: transparent;
                                            color: #dc2626;
                                            cursor: pointer;
                                            font-size: 10px;
                                        "
                                        title="Excluir aviso"
                                    >

                                        <i class="fa-solid fa-trash"></i>

                                    </button>

                                `
                                : ""
                        }

                    </div>


                    <p>

                        ${escaparHTML(
                            aviso.mensagem
                        )}

                    </p>


                    <time>

                        <i class="fa-regular fa-user"></i>

                        ${escaparHTML(
                            aviso.autorNome ||
                            "Usuário"
                        )}

                        •

                        ${
                            aviso.destino === "geral"
                                ? "Toda a turma"
                                : escaparHTML(
                                    aviso.equipeNome ||
                                    "Equipe"
                                )
                        }

                        ${
                            formatarTimestamp(
                                aviso.criadoEm
                            )
                                ? ` • ${formatarTimestamp(
                                    aviso.criadoEm
                                )}`
                                : ""
                        }

                    </time>

                </div>

            `;


            noticesList.appendChild(
                card
            );

        }
    );


    noticesList
        .querySelectorAll(
            ".delete-notice-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        excluirAviso(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ============================================================
// EXCLUIR AVISO
// ============================================================

async function excluirAviso(
    avisoId
) {

    const aviso =
        avisos.find(
            item =>
                item.id === avisoId
        );


    if (!aviso) {

        return;

    }


    const autorizado =
        usuarioAtual.perfil === "admin" ||
        aviso.autorId ===
            usuarioAtual.uid;


    if (!autorizado) {

        mostrarToast(
            "Você não pode excluir este aviso."
        );

        return;

    }


    const confirmar =
        window.confirm(
            `Deseja excluir o aviso "${aviso.titulo}"?`
        );


    if (!confirmar) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "avisos",
                avisoId
            )
        );


        mostrarToast(
            "Aviso excluído."
        );


        await carregarAvisos();

    }

    catch (error) {

        console.error(
            "Erro ao excluir aviso:",
            error
        );


        mostrarToast(
            "Não foi possível excluir o aviso."
        );

    }

}


// ============================================================
// PRIORIDADE
// ============================================================

function getPriorityLabel(
    prioridade
) {

    switch (prioridade) {

        case "urgente":
            return "Urgente";

        case "importante":
            return "Importante";

        default:
            return "Normal";

    }

}


function getPriorityBadge(
    prioridade
) {

    switch (prioridade) {

        case "urgente":
            return "badge-danger";

        case "importante":
            return "badge-warning";

        default:
            return "badge-info";

    }

}


function getPriorityIcon(
    prioridade
) {

    switch (prioridade) {

        case "urgente":

            return "fa-solid fa-triangle-exclamation";


        case "importante":

            return "fa-solid fa-circle-exclamation";


        default:

            return "fa-solid fa-bullhorn";

    }

}


function getPriorityStyle(
    prioridade
) {

    switch (prioridade) {

        case "urgente":

            return `
                background: #fef2f2;
                color: #dc2626;
            `;


        case "importante":

            return `
                background: #fffbeb;
                color: #d97706;
            `;


        default:

            return "";

    }

}


// ============================================================
// DATA
// ============================================================

function formatarTimestamp(
    timestamp
) {

    if (
        !timestamp ||
        typeof timestamp.toDate !== "function"
    ) {

        return "";

    }


    const data =
        timestamp.toDate();


    return data.toLocaleString(
        "pt-BR",
        {

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


// ============================================================
// MODAL
// ============================================================

function fecharModal() {

    if (!globalModal) {

        return;

    }


    globalModal.hidden =
        true;


    if (globalModalBody) {

        globalModalBody.innerHTML =
            "";

    }

}


// ============================================================
// TOAST
// ============================================================

function mostrarToast(
    mensagem
) {

    const toast =
        document.getElementById(
            "dashboardToast"
        );


    if (!toast) {

        console.log(
            mensagem
        );

        return;

    }


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


// ============================================================
// BOTÃO LOADING
// ============================================================

function setButtonLoading(
    button,
    texto
) {

    if (!button) {

        return;

    }


    button.disabled =
        true;


    button.innerHTML = `

        <span class="loader"></span>

        ${texto}

    `;

}


// ============================================================
// RESTAURAR BOTÃO
// ============================================================

function restaurarBotao(
    button,
    texto,
    icone
) {

    if (!button) {

        return;

    }


    button.disabled =
        false;


    button.innerHTML = `

        <i class="fa-solid ${icone}"></i>

        ${texto}

    `;

}


// ============================================================
// FORMATAR NÚMERO
// ============================================================

function formatarNumero(
    numero
) {

    return String(
        numero
    ).padStart(
        2,
        "0"
    );

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(
    valor
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        valor ?? "";


    return div.innerHTML;

}