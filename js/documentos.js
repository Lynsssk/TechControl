// ============================================================
// TECHCONTROL
// DOCUMENTOS
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

import {
    getTarefas
} from "./tarefas.js";


// ============================================================
// ELEMENTOS
// ============================================================

const newDocumentButton =
    document.getElementById("newDocumentButton");

const documentsGrid =
    document.getElementById("documentsGrid");

const recentDocuments =
    document.getElementById("recentDocuments");

const totalDocuments =
    document.getElementById("totalDocuments");

const documentSearch =
    document.getElementById("documentSearch");

const documentTypeFilter =
    document.getElementById("documentTypeFilter");

const globalModal =
    document.getElementById("globalModal");

const globalModalTitle =
    document.getElementById("globalModalTitle");

const globalModalBody =
    document.getElementById("globalModalBody");


// ============================================================
// ESTADO
// ============================================================

let documentos = [];

let usuarioAtual = null;

let eventosConfigurados = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export async function initDocumentos(userData) {

    usuarioAtual = userData;

    configurarEventos();

    await carregarDocumentos();

}


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

    if (eventosConfigurados) {

        return;

    }


    newDocumentButton?.addEventListener(
        "click",
        abrirModalNovoDocumento
    );


    documentSearch?.addEventListener(
        "input",
        renderizarDocumentos
    );


    documentTypeFilter?.addEventListener(
        "change",
        renderizarDocumentos
    );


    eventosConfigurados = true;

}


// ============================================================
// NOVO DOCUMENTO
// ============================================================

function abrirModalNovoDocumento() {

    if (!usuarioAtual) {

        return;

    }


    let equipes =
        getEquipes();


    if (
        usuarioAtual.perfil === "lider" ||
        usuarioAtual.perfil === "integrante"
    ) {

        equipes =
            equipes.filter(
                equipe =>
                    equipe.id === usuarioAtual.equipe
            );

    }


    globalModalTitle.textContent =
        "Adicionar documento";


    globalModalBody.innerHTML = `

        <form
            id="newDocumentForm"
            class="dashboard-form"
        >

            <div class="dashboard-form-group">

                <label for="newDocumentName">
                    Nome
                </label>

                <input
                    type="text"
                    id="newDocumentName"
                    placeholder="Ex: estrutura_equipamentos.c"
                    maxlength="120"
                    required
                >

            </div>


            <div class="dashboard-form-group">

                <label for="newDocumentType">
                    Tipo
                </label>

                <select
                    id="newDocumentType"
                    required
                >

                    <option value="codigo">
                        Código
                    </option>

                    <option value="documentacao">
                        Documentação
                    </option>

                    <option value="teste">
                        Teste
                    </option>

                    <option value="diagrama">
                        Diagrama
                    </option>

                    <option value="apresentacao">
                        Apresentação
                    </option>

                    <option value="outro">
                        Outro
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group full">

                <label for="newDocumentDescription">
                    Descrição
                </label>

                <textarea
                    id="newDocumentDescription"
                    placeholder="Explique brevemente o conteúdo deste documento..."
                    maxlength="400"
                    required
                ></textarea>

            </div>


            <div class="dashboard-form-group full">

                <label for="newDocumentLink">
                    Link
                </label>

                <input
                    type="url"
                    id="newDocumentLink"
                    placeholder="https://drive.google.com/..."
                    required
                >

            </div>


            <div class="dashboard-form-group">

                <label for="newDocumentTeam">
                    Equipe
                </label>

                <select
                    id="newDocumentTeam"
                    required
                >

                    <option value="">
                        Selecione
                    </option>

                    ${equipes.map(
                        equipe => `

                            <option
                                value="${equipe.id}"
                                ${
                                    usuarioAtual.equipe === equipe.id
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


            <div class="dashboard-form-group">

                <label for="newDocumentTask">
                    Tarefa relacionada
                </label>

                <select id="newDocumentTask">

                    <option value="">
                        Nenhuma tarefa
                    </option>

                </select>

            </div>


            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelDocumentButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveDocumentButton"
                >

                    <i class="fa-solid fa-link"></i>

                    Adicionar documento

                </button>

            </div>

        </form>

    `;


    globalModal.hidden =
        false;


    const teamSelect =
        document.getElementById(
            "newDocumentTeam"
        );


    const taskSelect =
        document.getElementById(
            "newDocumentTask"
        );


    function atualizarTarefas() {

        const equipeId =
            teamSelect.value;


        taskSelect.innerHTML = `

            <option value="">
                Nenhuma tarefa
            </option>

        `;


        if (!equipeId) {

            return;

        }


        const tarefasEquipe =
            getTarefas().filter(
                tarefa =>
                    tarefa.equipeId === equipeId
            );


        tarefasEquipe.forEach(
            tarefa => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    tarefa.id;


                option.textContent =
                    tarefa.titulo;


                taskSelect.appendChild(
                    option
                );

            }
        );

    }


    teamSelect?.addEventListener(
        "change",
        atualizarTarefas
    );


    atualizarTarefas();


    document
        .getElementById(
            "cancelDocumentButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "newDocumentForm"
        )
        ?.addEventListener(
            "submit",
            salvarDocumento
        );

}


// ============================================================
// SALVAR
// ============================================================

async function salvarDocumento(event) {

    event.preventDefault();


    const nome =
        document
            .getElementById(
                "newDocumentName"
            )
            .value
            .trim();


    const tipo =
        document
            .getElementById(
                "newDocumentType"
            )
            .value;


    const descricao =
        document
            .getElementById(
                "newDocumentDescription"
            )
            .value
            .trim();


    const link =
        document
            .getElementById(
                "newDocumentLink"
            )
            .value
            .trim();


    const equipeId =
        document
            .getElementById(
                "newDocumentTeam"
            )
            .value;


    const tarefaId =
        document
            .getElementById(
                "newDocumentTask"
            )
            .value || null;


    const saveButton =
        document.getElementById(
            "saveDocumentButton"
        );


    if (
        !nome ||
        !tipo ||
        !descricao ||
        !link ||
        !equipeId
    ) {

        mostrarToast(
            "Preencha todos os campos obrigatórios."
        );

        return;

    }


    if (!linkValido(link)) {

        mostrarToast(
            "Informe um link válido."
        );

        return;

    }


    if (
        usuarioAtual.perfil !== "admin" &&
        equipeId !== usuarioAtual.equipe
    ) {

        mostrarToast(
            "Você só pode adicionar documentos à sua equipe."
        );

        return;

    }


    const equipe =
        getEquipes().find(
            item =>
                item.id === equipeId
        );


    const tarefa =
        tarefaId
            ? getTarefas().find(
                item =>
                    item.id === tarefaId
            )
            : null;


    if (!equipe) {

        mostrarToast(
            "Equipe inválida."
        );

        return;

    }


    setButtonLoading(
        saveButton,
        "Salvando..."
    );


    try {

        await addDoc(
            collection(
                db,
                "documentos"
            ),
            {

                nome,

                tipo,

                descricao,

                link,

                equipeId,

                equipeNumero:
                    equipe.numero,

                equipeNome:
                    equipe.nome,

                tarefaId:
                    tarefa?.id || null,

                tarefaTitulo:
                    tarefa?.titulo || null,

                autorId:
                    usuarioAtual.uid,

                autorNome:
                    usuarioAtual.nome,

                criadoEm:
                    serverTimestamp()

            }
        );


        fecharModal();


        mostrarToast(
            "Documento adicionado com sucesso!"
        );


        await carregarDocumentos();

    }

    catch (error) {

        console.error(
            "Erro ao adicionar documento:",
            error
        );


        mostrarToast(
            "Não foi possível adicionar o documento."
        );


        restaurarBotao(
            saveButton,
            "Adicionar documento",
            "fa-link"
        );

    }

}


// ============================================================
// CARREGAR DOCUMENTOS
// ============================================================

export async function carregarDocumentos() {

    try {

        const documentosQuery =
            query(
                collection(
                    db,
                    "documentos"
                ),
                orderBy(
                    "criadoEm",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                documentosQuery
            );


        documentos =
            [];


        snapshot.forEach(
            documento => {

                documentos.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        renderizarDocumentos();

        renderizarRecentes();

        atualizarTotal();

    }

    catch (error) {

        console.error(
            "Erro ao carregar documentos:",
            error
        );


        mostrarToast(
            "Não foi possível carregar os documentos."
        );

    }

}


// ============================================================
// DOCUMENTOS VISÍVEIS
// ============================================================

function getDocumentosPermitidos() {

    let lista =
        [...documentos];


    if (
        usuarioAtual.perfil === "lider" ||
        usuarioAtual.perfil === "integrante"
    ) {

        lista =
            lista.filter(
                documento =>
                    documento.equipeId ===
                    usuarioAtual.equipe
            );

    }


    return lista;

}


// ============================================================
// RENDERIZAR
// ============================================================

function renderizarDocumentos() {

    if (!documentsGrid) {

        return;

    }


    const pesquisa =
        documentSearch?.value
            .trim()
            .toLowerCase() || "";


    const tipoFiltro =
        documentTypeFilter?.value || "";


    let lista =
        getDocumentosPermitidos();


    if (pesquisa) {

        lista =
            lista.filter(
                documento => {

                    const texto = `
                        ${documento.nome || ""}
                        ${documento.descricao || ""}
                        ${documento.autorNome || ""}
                        ${documento.equipeNome || ""}
                        ${documento.tarefaTitulo || ""}
                    `.toLowerCase();


                    return texto.includes(
                        pesquisa
                    );

                }
            );

    }


    if (tipoFiltro) {

        lista =
            lista.filter(
                documento =>
                    documento.tipo ===
                    tipoFiltro
            );

    }


    if (lista.length === 0) {

        documentsGrid.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <span>
                    Nenhum documento encontrado.
                </span>

            </div>

        `;

        return;

    }


    documentsGrid.innerHTML =
        "";


    lista.forEach(
        documento => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "document-card";


            const podeExcluir =
                usuarioAtual.perfil === "admin" ||
                usuarioAtual.perfil === "lider" ||
                documento.autorId ===
                    usuarioAtual.uid;


            card.innerHTML = `

                <div class="document-card-icon">

                    <i class="${getDocumentIcon(
                        documento.tipo
                    )}"></i>

                </div>


                <div class="document-card-content">

                    <h4
                        title="${escaparAtributo(
                            documento.nome
                        )}"
                    >

                        ${escaparHTML(
                            documento.nome
                        )}

                    </h4>


                    <p>

                        ${escaparHTML(
                            documento.descricao
                        )}

                    </p>


                    <div class="document-meta">

                        ${escaparHTML(
                            documento.equipeNome ||
                            ""
                        )}

                        ${
                            documento.tarefaTitulo
                                ? ` • ${escaparHTML(
                                    documento.tarefaTitulo
                                )}`
                                : ""
                        }

                        <br>

                        Por
                        ${escaparHTML(
                            documento.autorNome ||
                            "Usuário"
                        )}

                    </div>


                    <div
                        style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-top: 10px;
                        "
                    >

                        <a
                            class="document-open"
                            href="${escaparAtributo(
                                documento.link
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <i class="fa-solid fa-arrow-up-right-from-square"></i>

                            Abrir

                        </a>


                        ${
                            podeExcluir
                                ? `

                                    <button
                                        type="button"
                                        class="delete-document-button"
                                        data-id="${documento.id}"
                                        style="
                                            border: 0;
                                            background: transparent;
                                            color: #dc2626;
                                            font-size: 8px;
                                            font-weight: 700;
                                            cursor: pointer;
                                        "
                                    >

                                        <i class="fa-solid fa-trash"></i>

                                        Excluir

                                    </button>

                                `
                                : ""
                        }

                    </div>

                </div>

            `;


            documentsGrid.appendChild(
                card
            );

        }
    );


    documentsGrid
        .querySelectorAll(
            ".delete-document-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        excluirDocumento(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ============================================================
// DOCUMENTOS RECENTES
// ============================================================

function renderizarRecentes() {

    if (!recentDocuments) {

        return;

    }


    const lista =
        getDocumentosPermitidos()
            .slice(
                0,
                5
            );


    if (lista.length === 0) {

        recentDocuments.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <span>
                    Nenhum documento cadastrado.
                </span>

            </div>

        `;

        return;

    }


    recentDocuments.innerHTML =
        "";


    lista.forEach(
        documento => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-document-item";


            item.innerHTML = `

                <div class="recent-item-main">

                    <div class="recent-item-icon">

                        <i class="${getDocumentIcon(
                            documento.tipo
                        )}"></i>

                    </div>


                    <div class="recent-item-data">

                        <strong>

                            ${escaparHTML(
                                documento.nome
                            )}

                        </strong>


                        <span>

                            ${escaparHTML(
                                documento.autorNome ||
                                ""
                            )}

                        </span>

                    </div>

                </div>


                <a
                    href="${escaparAtributo(
                        documento.link
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="panel-link"
                >

                    Abrir

                </a>

            `;


            recentDocuments.appendChild(
                item
            );

        }
    );

}


// ============================================================
// TOTAL
// ============================================================

function atualizarTotal() {

    if (!totalDocuments) {

        return;

    }


    totalDocuments.textContent =
        getDocumentosPermitidos()
            .length;

}


// ============================================================
// EXCLUIR
// ============================================================

async function excluirDocumento(
    documentoId
) {

    const documento =
        documentos.find(
            item =>
                item.id === documentoId
        );


    if (!documento) {

        return;

    }


    const autorizado =
        usuarioAtual.perfil === "admin" ||
        usuarioAtual.perfil === "lider" ||
        documento.autorId ===
            usuarioAtual.uid;


    if (!autorizado) {

        mostrarToast(
            "Você não pode excluir este documento."
        );

        return;

    }


    const confirmar =
        window.confirm(
            `Deseja excluir o registro "${documento.nome}"?\n\nO arquivo original não será apagado do Google Drive ou GitHub.`
        );


    if (!confirmar) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "documentos",
                documentoId
            )
        );


        mostrarToast(
            "Documento removido."
        );


        await carregarDocumentos();

    }

    catch (error) {

        console.error(
            "Erro ao excluir documento:",
            error
        );


        mostrarToast(
            "Não foi possível remover o documento."
        );

    }

}


// ============================================================
// ÍCONES
// ============================================================

function getDocumentIcon(
    tipo
) {

    switch (tipo) {

        case "codigo":

            return "fa-solid fa-code";


        case "documentacao":

            return "fa-solid fa-file-lines";


        case "teste":

            return "fa-solid fa-vial";


        case "diagrama":

            return "fa-solid fa-diagram-project";


        case "apresentacao":

            return "fa-solid fa-display";


        default:

            return "fa-solid fa-file";

    }

}


// ============================================================
// LINK VÁLIDO
// ============================================================

function linkValido(
    link
) {

    try {

        const url =
            new URL(
                link
            );


        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );

    }

    catch {

        return false;

    }

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

function restaurarBotao(
    button,
    texto,
    icone
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
// ESCAPAR ATRIBUTO
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
// EXPORTAR
// ============================================================

export function getDocumentos() {

    return documentos;

}