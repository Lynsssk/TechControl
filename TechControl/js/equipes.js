// ============================================================
// TECHCONTROL
// EQUIPES
// ============================================================

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "./firebase.js";


// ============================================================
// ELEMENTOS
// ============================================================

const teamsGrid =
    document.getElementById("teamsGrid");

const totalTeams =
    document.getElementById("totalTeams");

const dashboardTeamProgress =
    document.getElementById("dashboardTeamProgress");

const newTeamButton =
    document.getElementById("newTeamButton");

const globalModal =
    document.getElementById("globalModal");

const globalModalTitle =
    document.getElementById("globalModalTitle");

const globalModalBody =
    document.getElementById("globalModalBody");

const taskTeamFilter =
    document.getElementById("taskTeamFilter");

const memberTeamFilter =
    document.getElementById("memberTeamFilter");


// ============================================================
// VARIÁVEIS
// ============================================================

let equipes = [];

let usuarioAtual = null;

let eventosConfigurados = false;


// ============================================================
// INICIALIZAR
// ============================================================

export async function initEquipes(userData) {

    usuarioAtual = userData;

    configurarEventos();

    await carregarEquipes();

}


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

    if (eventosConfigurados) {

        return;

    }


    if (newTeamButton) {

        newTeamButton.addEventListener(
            "click",
            abrirModalNovaEquipe
        );

    }


    eventosConfigurados = true;

}


// ============================================================
// ABRIR MODAL NOVA EQUIPE
// ============================================================

function abrirModalNovaEquipe() {

    if (!usuarioAtual) return;


    if (usuarioAtual.perfil !== "admin") {

        mostrarToast(
            "Você não possui permissão para criar equipes."
        );

        return;

    }


    globalModalTitle.textContent =
        "Nova equipe";


    globalModalBody.innerHTML = `

        <form
            id="teamForm"
            class="dashboard-form"
        >

            <div class="dashboard-form-group">

                <label for="teamNumber">
                    Número da equipe
                </label>

                <input
                    type="number"
                    id="teamNumber"
                    min="1"
                    max="8"
                    placeholder="Ex: 1"
                    required
                >

            </div>


            <div class="dashboard-form-group">

                <label for="teamName">
                    Nome
                </label>

                <input
                    type="text"
                    id="teamName"
                    placeholder="Ex: Coordenação e Requisitos"
                    maxlength="80"
                    required
                >

            </div>


            <div class="dashboard-form-group full">

                <label for="teamDescription">
                    Descrição
                </label>

                <textarea
                    id="teamDescription"
                    placeholder="Descreva a responsabilidade da equipe..."
                    maxlength="300"
                    required
                ></textarea>

            </div>


            <div class="dashboard-form-group full">

                <label>
                    Líder
                </label>

                <input
                    type="text"
                    value="Ainda não definido"
                    disabled
                >

                <small style="
                    color: #94a3b8;
                    font-size: 8px;
                ">
                    O líder será vinculado posteriormente.
                </small>

            </div>


            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelTeamButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveTeamButton"
                >

                    <i class="fa-solid fa-check"></i>

                    Criar equipe

                </button>

            </div>

        </form>

    `;


    globalModal.hidden = false;


    const form =
        document.getElementById("teamForm");

    const cancelButton =
        document.getElementById("cancelTeamButton");


    cancelButton?.addEventListener(
        "click",
        fecharModal
    );


    form?.addEventListener(
        "submit",
        salvarNovaEquipe
    );

}


// ============================================================
// SALVAR NOVA EQUIPE
// ============================================================

async function salvarNovaEquipe(event) {

    event.preventDefault();


    const numero =
        Number(
            document
                .getElementById("teamNumber")
                .value
        );


    const nome =
        document
            .getElementById("teamName")
            .value
            .trim();


    const descricao =
        document
            .getElementById("teamDescription")
            .value
            .trim();


    const saveButton =
        document.getElementById("saveTeamButton");


    if (!validarDadosEquipe(numero, nome, descricao)) {

        return;

    }


    const numeroExiste =
        equipes.some(
            equipe =>
                Number(equipe.numero) === numero
        );


    if (numeroExiste) {

        mostrarToast(
            `A Equipe ${numero} já está cadastrada.`
        );

        return;

    }


    setButtonLoading(
        saveButton,
        "Criando..."
    );


    try {

        await addDoc(
            collection(
                db,
                "equipes"
            ),
            {

                numero,
                nome,
                descricao,

                liderId: null,

                liderNome: null,

                ativa: true,

                progresso: 0,

                criadoPor:
                    usuarioAtual.uid || null,

                criadoPorNome:
                    usuarioAtual.nome || "Administrador",

                criadoEm:
                    serverTimestamp(),

                atualizadoEm:
                    serverTimestamp()

            }
        );


        fecharModal();


        mostrarToast(
            "Equipe criada com sucesso!"
        );


        await carregarEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao criar equipe:",
            error
        );


        mostrarToast(
            "Não foi possível criar a equipe."
        );


        restaurarBotaoSalvar(
            saveButton,
            "Criar equipe"
        );

    }

}


// ============================================================
// ABRIR MODAL EDITAR EQUIPE
// ============================================================

function abrirModalEditarEquipe(equipeId) {

    if (
        !usuarioAtual ||
        usuarioAtual.perfil !== "admin"
    ) {

        mostrarToast(
            "Você não possui permissão para editar equipes."
        );

        return;

    }


    const equipe =
        equipes.find(
            item =>
                item.id === equipeId
        );


    if (!equipe) {

        mostrarToast(
            "Equipe não encontrada."
        );

        return;

    }


    globalModalTitle.textContent =
        "Editar equipe";


    globalModalBody.innerHTML = `

        <form
            id="editTeamForm"
            class="dashboard-form"
        >

            <div class="dashboard-form-group">

                <label for="editTeamNumber">
                    Número da equipe
                </label>

                <input
                    type="number"
                    id="editTeamNumber"
                    min="1"
                    max="8"
                    value="${Number(equipe.numero)}"
                    required
                >

            </div>


            <div class="dashboard-form-group">

                <label for="editTeamName">
                    Nome
                </label>

                <input
                    type="text"
                    id="editTeamName"
                    value="${escaparAtributo(equipe.nome)}"
                    maxlength="80"
                    required
                >

            </div>


            <div class="dashboard-form-group full">

                <label for="editTeamDescription">
                    Descrição
                </label>

                <textarea
                    id="editTeamDescription"
                    maxlength="300"
                    required
                >${escaparHTML(equipe.descricao)}</textarea>

            </div>


            <div class="dashboard-form-group">

                <label for="editTeamStatus">
                    Status
                </label>

                <select
                    id="editTeamStatus"
                    required
                >

                    <option
                        value="ativa"
                        ${
                            equipe.ativa !== false
                                ? "selected"
                                : ""
                        }
                    >
                        Ativa
                    </option>

                    <option
                        value="inativa"
                        ${
                            equipe.ativa === false
                                ? "selected"
                                : ""
                        }
                    >
                        Inativa
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group">

                <label>
                    Líder atual
                </label>

                <input
                    type="text"
                    value="${
                        equipe.liderNome
                            ? escaparAtributo(
                                equipe.liderNome
                            )
                            : "Ainda não definido"
                    }"
                    disabled
                >

            </div>


            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelEditTeamButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="updateTeamButton"
                >

                    <i class="fa-solid fa-floppy-disk"></i>

                    Salvar alterações

                </button>

            </div>

        </form>

    `;


    globalModal.hidden = false;


    document
        .getElementById(
            "cancelEditTeamButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "editTeamForm"
        )
        ?.addEventListener(
            "submit",
            event =>
                atualizarEquipe(
                    event,
                    equipeId
                )
        );

}


// ============================================================
// ATUALIZAR EQUIPE
// ============================================================

async function atualizarEquipe(
    event,
    equipeId
) {

    event.preventDefault();


    const numero =
        Number(
            document
                .getElementById(
                    "editTeamNumber"
                )
                .value
        );


    const nome =
        document
            .getElementById(
                "editTeamName"
            )
            .value
            .trim();


    const descricao =
        document
            .getElementById(
                "editTeamDescription"
            )
            .value
            .trim();


    const ativa =
        document
            .getElementById(
                "editTeamStatus"
            )
            .value === "ativa";


    const updateButton =
        document.getElementById(
            "updateTeamButton"
        );


    if (
        !validarDadosEquipe(
            numero,
            nome,
            descricao
        )
    ) {

        return;

    }


    const numeroExiste =
        equipes.some(
            equipe =>
                equipe.id !== equipeId &&
                Number(equipe.numero) === numero
        );


    if (numeroExiste) {

        mostrarToast(
            `A Equipe ${numero} já está cadastrada.`
        );

        return;

    }


    setButtonLoading(
        updateButton,
        "Salvando..."
    );


    try {

        const equipeRef =
            doc(
                db,
                "equipes",
                equipeId
            );


        await updateDoc(
            equipeRef,
            {

                numero,
                nome,
                descricao,
                ativa,

                atualizadoPor:
                    usuarioAtual.uid || null,

                atualizadoPorNome:
                    usuarioAtual.nome || "Administrador",

                atualizadoEm:
                    serverTimestamp()

            }
        );


        fecharModal();


        mostrarToast(
            "Equipe atualizada com sucesso!"
        );


        await carregarEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao atualizar equipe:",
            error
        );


        mostrarToast(
            "Não foi possível atualizar a equipe."
        );


        restaurarBotaoSalvar(
            updateButton,
            "Salvar alterações",
            "fa-floppy-disk"
        );

    }

}


// ============================================================
// EXCLUIR EQUIPE
// ============================================================

async function excluirEquipe(
    equipeId
) {

    if (
        !usuarioAtual ||
        usuarioAtual.perfil !== "admin"
    ) {

        mostrarToast(
            "Você não possui permissão para excluir equipes."
        );

        return;

    }


    const equipe =
        equipes.find(
            item =>
                item.id === equipeId
        );


    if (!equipe) {

        mostrarToast(
            "Equipe não encontrada."
        );

        return;

    }


    const confirmar =
        window.confirm(
            `Tem certeza que deseja excluir a Equipe ${formatarNumero(
                equipe.numero
            )} - ${equipe.nome}?\n\nEssa ação não poderá ser desfeita.`
        );


    if (!confirmar) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "equipes",
                equipeId
            )
        );


        mostrarToast(
            "Equipe excluída com sucesso."
        );


        await carregarEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao excluir equipe:",
            error
        );


        mostrarToast(
            "Não foi possível excluir a equipe."
        );

    }

}


// ============================================================
// VALIDAR DADOS
// ============================================================

function validarDadosEquipe(
    numero,
    nome,
    descricao
) {

    if (
        !numero ||
        !nome ||
        !descricao
    ) {

        mostrarToast(
            "Preencha todos os campos."
        );

        return false;

    }


    if (
        numero < 1 ||
        numero > 8
    ) {

        mostrarToast(
            "O número da equipe deve ser entre 1 e 8."
        );

        return false;

    }


    if (nome.length < 3) {

        mostrarToast(
            "Digite um nome válido para a equipe."
        );

        return false;

    }


    return true;

}


// ============================================================
// CARREGAR EQUIPES
// ============================================================

export async function carregarEquipes() {

    try {

        const equipesQuery =
            query(
                collection(
                    db,
                    "equipes"
                ),

                orderBy(
                    "numero",
                    "asc"
                )
            );


        const snapshot =
            await getDocs(
                equipesQuery
            );


        equipes = [];


        snapshot.forEach(
            documento => {

                equipes.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        renderizarEquipes();

        renderizarResumoDashboard();

        atualizarFiltros();

    }

    catch (error) {

        console.error(
            "Erro ao carregar equipes:",
            error
        );


        if (teamsGrid) {

            teamsGrid.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <span>
                        Não foi possível carregar as equipes.
                    </span>

                </div>

            `;

        }

    }

}


// ============================================================
// RENDERIZAR EQUIPES
// ============================================================

function renderizarEquipes() {

    if (!teamsGrid) {

        return;

    }


    if (equipes.length === 0) {

        teamsGrid.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-people-group"></i>

                <span>
                    Nenhuma equipe cadastrada.
                </span>

            </div>

        `;


        if (totalTeams) {

            totalTeams.textContent =
                "0";

        }


        return;

    }


    teamsGrid.innerHTML =
        "";


    equipes.forEach(
        equipe => {

            const progresso =
                limitarProgresso(
                    equipe.progresso || 0
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "team-card";


            card.innerHTML = `

                <div class="team-card-top">

                    <div>

                        <span class="team-card-number">

                            EQUIPE ${formatarNumero(
                                equipe.numero
                            )}

                        </span>


                        <h3>

                            ${escaparHTML(
                                equipe.nome
                            )}

                        </h3>


                        <p>

                            ${escaparHTML(
                                equipe.descricao
                            )}

                        </p>

                    </div>


                    <span class="
                        badge
                        ${
                            equipe.ativa !== false
                                ? "badge-success"
                                : "badge-danger"
                        }
                    ">

                        ${
                            equipe.ativa !== false
                                ? "Ativa"
                                : "Inativa"
                        }

                    </span>

                </div>


                <div class="team-card-info">

                    <div>

                        <span>
                            Líder
                        </span>

                        <strong>

                            ${
                                equipe.liderNome
                                    ? escaparHTML(
                                        equipe.liderNome
                                    )
                                    : "Não definido"
                            }

                        </strong>

                    </div>


                    <div>

                        <span>
                            Progresso
                        </span>

                        <strong>
                            ${progresso}%
                        </strong>

                    </div>

                </div>


                <div class="team-card-progress-header">

                    <span>
                        Desenvolvimento
                    </span>

                    <strong>
                        ${progresso}%
                    </strong>

                </div>


                <div class="team-card-progress">

                    <div
                        style="width: ${progresso}%"
                    ></div>

                </div>


                ${
                    usuarioAtual?.perfil === "admin"
                    ? `

                        <div
                            style="
                                display: flex;
                                gap: 8px;
                                margin-top: 14px;
                            "
                        >

                            <button
                                type="button"
                                class="btn btn-secondary edit-team-button"
                                data-id="${equipe.id}"
                                style="
                                    flex: 1;
                                    font-size: 9px;
                                "
                            >

                                <i class="fa-solid fa-pen"></i>

                                Editar

                            </button>


                            <button
                                type="button"
                                class="btn delete-team-button"
                                data-id="${equipe.id}"
                                style="
                                    flex: 1;
                                    font-size: 9px;
                                    background: #fef2f2;
                                    color: #dc2626;
                                    border: 1px solid #fecaca;
                                "
                            >

                                <i class="fa-solid fa-trash"></i>

                                Excluir

                            </button>

                        </div>

                    `
                    : ""
                }

            `;


            teamsGrid.appendChild(
                card
            );

        }
    );


    configurarBotoesEquipe();


    if (totalTeams) {

        totalTeams.textContent =
            equipes.length;

    }

}


// ============================================================
// CONFIGURAR BOTÕES DOS CARDS
// ============================================================

function configurarBotoesEquipe() {

    const editButtons =
        document.querySelectorAll(
            ".edit-team-button"
        );


    const deleteButtons =
        document.querySelectorAll(
            ".delete-team-button"
        );


    editButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    abrirModalEditarEquipe(
                        button.dataset.id
                    );

                }
            );

        }
    );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    excluirEquipe(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


// ============================================================
// RESUMO DAS EQUIPES NO DASHBOARD
// ============================================================

function renderizarResumoDashboard() {

    if (!dashboardTeamProgress) {

        return;

    }


    if (equipes.length === 0) {

        dashboardTeamProgress.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-chart-line"></i>

                <span>
                    Nenhuma equipe carregada.
                </span>

            </div>

        `;

        return;

    }


    dashboardTeamProgress.innerHTML =
        "";


    equipes.forEach(
        equipe => {

            const progresso =
                limitarProgresso(
                    equipe.progresso || 0
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "team-progress-item";


            item.innerHTML = `

                <strong
                    title="${escaparAtributo(
                        equipe.nome
                    )}"
                >

                    Equipe ${formatarNumero(
                        equipe.numero
                    )}

                </strong>


                <div class="team-progress-track">

                    <div
                        class="team-progress-fill"
                        style="width: ${progresso}%"
                    >
                    </div>

                </div>


                <span>

                    ${progresso}%

                </span>

            `;


            dashboardTeamProgress.appendChild(
                item
            );

        }
    );

}


// ============================================================
// ATUALIZAR FILTROS
// ============================================================

function atualizarFiltros() {

    preencherFiltroEquipes(
        taskTeamFilter,
        "Todas as equipes"
    );


    preencherFiltroEquipes(
        memberTeamFilter,
        "Todas as equipes"
    );

}


// ============================================================
// PREENCHER FILTRO
// ============================================================

function preencherFiltroEquipes(
    select,
    primeiraOpcao
) {

    if (!select) {

        return;

    }


    const valorAtual =
        select.value;


    select.innerHTML = `

        <option value="">

            ${primeiraOpcao}

        </option>

    `;


    equipes.forEach(
        equipe => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                equipe.id;


            option.textContent =
                `Equipe ${formatarNumero(
                    equipe.numero
                )} - ${equipe.nome}`;


            select.appendChild(
                option
            );

        }
    );


    const valorAindaExiste =
        [...select.options]
            .some(
                option =>
                    option.value ===
                    valorAtual
            );


    if (valorAindaExiste) {

        select.value =
            valorAtual;

    }

}


// ============================================================
// FECHAR MODAL
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
// BOTÃO LOADING
// ============================================================

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


// ============================================================
// RESTAURAR BOTÃO
// ============================================================

function restaurarBotaoSalvar(
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
// LIMITAR PROGRESSO
// ============================================================

function limitarProgresso(
    valor
) {

    const numero =
        Number(valor) || 0;


    return Math.min(
        100,
        Math.max(
            0,
            Math.round(numero)
        )
    );

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


// ============================================================
// ESCAPAR ATRIBUTO HTML
// ============================================================

function escaparAtributo(
    valor
) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );

}


// ============================================================
// EXPORTAR EQUIPES
// ============================================================

export function getEquipes() {

    return equipes;

}