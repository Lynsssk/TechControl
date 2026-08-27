// ============================================================
// TECHCONTROL
// TAREFAS
// ============================================================

import {
    collection,
    addDoc,
    getDocs,
    doc,
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

import {
    getUsuarios
} from "./usuarios.js";


// ============================================================
// ELEMENTOS
// ============================================================

const newTaskButton =
    document.getElementById("newTaskButton");

const quickTaskButton =
    document.getElementById("quickTaskButton");

const taskTeamFilter =
    document.getElementById("taskTeamFilter");

const taskStatusFilter =
    document.getElementById("taskStatusFilter");


const pendingTaskList =
    document.getElementById("pendingTaskList");

const progressTaskList =
    document.getElementById("progressTaskList");

const reviewTaskList =
    document.getElementById("reviewTaskList");

const completedTaskList =
    document.getElementById("completedTaskList");


const pendingCount =
    document.getElementById("pendingCount");

const progressCount =
    document.getElementById("progressCount");

const reviewCount =
    document.getElementById("reviewCount");

const completedCount =
    document.getElementById("completedCount");


const totalTasks =
    document.getElementById("totalTasks");

const pendingTasks =
    document.getElementById("pendingTasks");

const progressTasks =
    document.getElementById("progressTasks");

const reviewTasks =
    document.getElementById("reviewTasks");

const completedTasks =
    document.getElementById("completedTasks");


const generalProgressValue =
    document.getElementById("generalProgressValue");

const generalProgressBar =
    document.getElementById("generalProgressBar");

const recentTasks =
    document.getElementById("recentTasks");


const globalModal =
    document.getElementById("globalModal");

const globalModalTitle =
    document.getElementById("globalModalTitle");

const globalModalBody =
    document.getElementById("globalModalBody");


// ============================================================
// ESTADO
// ============================================================

let tarefas = [];

let usuarioAtual = null;

let eventosConfigurados = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

export async function initTarefas(userData) {

    usuarioAtual = userData;

    configurarEventos();

    await carregarTarefas();

}


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

    if (eventosConfigurados) {

        return;

    }


    newTaskButton?.addEventListener(
        "click",
        abrirModalNovaTarefa
    );


    quickTaskButton?.addEventListener(
        "click",
        abrirModalNovaTarefa
    );


    taskTeamFilter?.addEventListener(
        "change",
        renderizarTarefas
    );


    taskStatusFilter?.addEventListener(
        "change",
        renderizarTarefas
    );


    eventosConfigurados = true;

}


// ============================================================
// ABRIR MODAL NOVA TAREFA
// ============================================================

function abrirModalNovaTarefa() {

    if (!usuarioAtual) return;


    if (
        usuarioAtual.perfil !== "admin" &&
        usuarioAtual.perfil !== "lider"
    ) {

        mostrarToast(
            "Você não possui permissão para criar tarefas."
        );

        return;

    }


    const equipes =
        getEquipes();


    const usuarios =
        getUsuarios();


    let equipesPermitidas =
        [...equipes];


    if (
        usuarioAtual.perfil === "lider"
    ) {

        equipesPermitidas =
            equipes.filter(
                equipe =>
                    equipe.id ===
                    usuarioAtual.equipe
            );

    }


    globalModalTitle.textContent =
        "Nova tarefa";


    globalModalBody.innerHTML = `

        <form
            id="newTaskForm"
            class="dashboard-form"
        >

            <div class="dashboard-form-group full">

                <label for="newTaskTitle">
                    Título da tarefa
                </label>

                <input
                    type="text"
                    id="newTaskTitle"
                    placeholder="Ex: Criar cadastro de equipamentos"
                    maxlength="120"
                    required
                >

            </div>


            <div class="dashboard-form-group full">

                <label for="newTaskDescription">
                    Descrição
                </label>

                <textarea
                    id="newTaskDescription"
                    placeholder="Descreva o que precisa ser desenvolvido..."
                    maxlength="500"
                    required
                ></textarea>

            </div>


            <div class="dashboard-form-group">

                <label for="newTaskTeam">
                    Equipe
                </label>

                <select
                    id="newTaskTeam"
                    required
                >

                    <option value="">
                        Selecione
                    </option>

                    ${equipesPermitidas.map(
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


            <div class="dashboard-form-group">

                <label for="newTaskResponsible">
                    Responsável
                </label>

                <select
                    id="newTaskResponsible"
                    required
                >

                    <option value="">
                        Escolha primeiro a equipe
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group">

                <label for="newTaskPriority">
                    Prioridade
                </label>

                <select
                    id="newTaskPriority"
                    required
                >

                    <option value="baixa">
                        Baixa
                    </option>

                    <option
                        value="media"
                        selected
                    >
                        Média
                    </option>

                    <option value="alta">
                        Alta
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group">

                <label for="newTaskDeadline">
                    Prazo
                </label>

                <input
                    type="date"
                    id="newTaskDeadline"
                >

            </div>


            <div class="dashboard-form-group">

                <label for="newTaskStatus">
                    Status inicial
                </label>

                <select
                    id="newTaskStatus"
                    required
                >

                    <option
                        value="pendente"
                        selected
                    >
                        A fazer
                    </option>

                    <option value="andamento">
                        Em andamento
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group">

                <label for="newTaskProgress">
                    Progresso inicial
                </label>

                <input
                    type="number"
                    id="newTaskProgress"
                    min="0"
                    max="100"
                    value="0"
                    required
                >

            </div>


            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelNewTaskButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveNewTaskButton"
                >

                    <i class="fa-solid fa-check"></i>

                    Criar tarefa

                </button>

            </div>

        </form>

    `;


    globalModal.hidden =
        false;


    const teamSelect =
        document.getElementById(
            "newTaskTeam"
        );


    const responsibleSelect =
        document.getElementById(
            "newTaskResponsible"
        );


    function atualizarResponsaveis() {

        const equipeId =
            teamSelect.value;


        let responsaveis =
            usuarios.filter(
                usuario =>
                    usuario.ativo !== false &&
                    usuario.equipe === equipeId
            );


        responsibleSelect.innerHTML = `
            <option value="">
                Selecione o responsável
            </option>
        `;


        responsaveis.forEach(
            usuario => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    usuario.uid;


                option.textContent =
                    `${usuario.nome} - ${getRoleLabel(
                        usuario.perfil
                    )}`;


                responsibleSelect.appendChild(
                    option
                );

            }
        );

    }


    teamSelect?.addEventListener(
        "change",
        atualizarResponsaveis
    );


    atualizarResponsaveis();


    document
        .getElementById(
            "cancelNewTaskButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "newTaskForm"
        )
        ?.addEventListener(
            "submit",
            salvarNovaTarefa
        );

}


// ============================================================
// SALVAR NOVA TAREFA
// ============================================================

async function salvarNovaTarefa(
    event
) {

    event.preventDefault();


    const titulo =
        document
            .getElementById(
                "newTaskTitle"
            )
            .value
            .trim();


    const descricao =
        document
            .getElementById(
                "newTaskDescription"
            )
            .value
            .trim();


    const equipeId =
        document
            .getElementById(
                "newTaskTeam"
            )
            .value;


    const responsavelId =
        document
            .getElementById(
                "newTaskResponsible"
            )
            .value;


    const prioridade =
        document
            .getElementById(
                "newTaskPriority"
            )
            .value;


    const prazo =
        document
            .getElementById(
                "newTaskDeadline"
            )
            .value || null;


    let status =
        document
            .getElementById(
                "newTaskStatus"
            )
            .value;


    let progresso =
        Number(
            document
                .getElementById(
                    "newTaskProgress"
                )
                .value
        );


    const saveButton =
        document.getElementById(
            "saveNewTaskButton"
        );


    // ========================================================
    // VALIDAÇÕES
    // ========================================================

    if (
        !titulo ||
        !descricao ||
        !equipeId ||
        !responsavelId
    ) {

        mostrarToast(
            "Preencha todos os campos obrigatórios."
        );

        return;

    }


    progresso =
        limitarProgresso(
            progresso
        );


    // Status e progresso coerentes

    if (
        status === "pendente"
    ) {

        progresso =
            0;

    }


    if (
        progresso === 100
    ) {

        status =
            "concluida";

    }


    const equipe =
        getEquipes().find(
            item =>
                item.id === equipeId
        );


    const responsavel =
        getUsuarios().find(
            item =>
                item.uid ===
                responsavelId
        );


    if (
        !equipe ||
        !responsavel
    ) {

        mostrarToast(
            "Equipe ou responsável inválido."
        );

        return;

    }


    // Líder só cria tarefa na própria equipe

    if (
        usuarioAtual.perfil === "lider" &&
        equipeId !== usuarioAtual.equipe
    ) {

        mostrarToast(
            "Você só pode criar tarefas para sua equipe."
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
                "tarefas"
            ),
            {

                titulo,
                descricao,

                equipeId,

                equipeNumero:
                    equipe.numero,

                equipeNome:
                    equipe.nome,

                responsavelId,

                responsavelNome:
                    responsavel.nome,

                prioridade,

                prazo,

                status,

                progresso,

                criadoPorId:
                    usuarioAtual.uid,

                criadoPorNome:
                    usuarioAtual.nome,

                criadoEm:
                    serverTimestamp(),

                atualizadoEm:
                    serverTimestamp()

            }
        );


        fecharModal();


        mostrarToast(
            "Tarefa criada com sucesso!"
        );


        await carregarTarefas();

        await atualizarProgressoEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao criar tarefa:",
            error
        );


        mostrarToast(
            "Não foi possível criar a tarefa."
        );


        restaurarBotao(
            saveButton,
            "Criar tarefa",
            "fa-check"
        );

    }

}


// ============================================================
// CARREGAR TAREFAS
// ============================================================

export async function carregarTarefas() {

    try {

        const tarefasQuery =
            query(
                collection(
                    db,
                    "tarefas"
                ),
                orderBy(
                    "criadoEm",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                tarefasQuery
            );


        tarefas = [];


        snapshot.forEach(
            documento => {

                tarefas.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        renderizarTarefas();

        atualizarDashboard();

        renderizarTarefasRecentes();

    }

    catch (error) {

        console.error(
            "Erro ao carregar tarefas:",
            error
        );


        mostrarToast(
            "Não foi possível carregar as tarefas."
        );

    }

}


// ============================================================
// FILTRAR TAREFAS VISÍVEIS
// ============================================================

function getTarefasPermitidas() {

    let filtradas =
        [...tarefas];


    if (
        usuarioAtual.perfil === "lider" ||
        usuarioAtual.perfil === "integrante"
    ) {

        filtradas =
            filtradas.filter(
                tarefa =>
                    tarefa.equipeId ===
                    usuarioAtual.equipe
            );

    }


    const equipeFiltro =
        taskTeamFilter?.value || "";


    const statusFiltro =
        taskStatusFilter?.value || "";


    if (equipeFiltro) {

        filtradas =
            filtradas.filter(
                tarefa =>
                    tarefa.equipeId ===
                    equipeFiltro
            );

    }


    if (statusFiltro) {

        filtradas =
            filtradas.filter(
                tarefa =>
                    tarefa.status ===
                    statusFiltro
            );

    }


    return filtradas;

}


// ============================================================
// RENDERIZAR KANBAN
// ============================================================

function renderizarTarefas() {

    const filtradas =
        getTarefasPermitidas();


    const pendentes =
        filtradas.filter(
            tarefa =>
                tarefa.status === "pendente"
        );


    const andamento =
        filtradas.filter(
            tarefa =>
                tarefa.status === "andamento"
        );


    const revisao =
        filtradas.filter(
            tarefa =>
                tarefa.status === "revisao"
        );


    const concluidas =
        filtradas.filter(
            tarefa =>
                tarefa.status === "concluida"
        );


    renderizarColuna(
        pendingTaskList,
        pendentes
    );


    renderizarColuna(
        progressTaskList,
        andamento
    );


    renderizarColuna(
        reviewTaskList,
        revisao
    );


    renderizarColuna(
        completedTaskList,
        concluidas
    );


    if (pendingCount) {

        pendingCount.textContent =
            pendentes.length;

    }


    if (progressCount) {

        progressCount.textContent =
            andamento.length;

    }


    if (reviewCount) {

        reviewCount.textContent =
            revisao.length;

    }


    if (completedCount) {

        completedCount.textContent =
            concluidas.length;

    }

}


// ============================================================
// RENDERIZAR COLUNA
// ============================================================

function renderizarColuna(
    elemento,
    lista
) {

    if (!elemento) return;


    if (
        lista.length === 0
    ) {

        elemento.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-inbox"></i>

                <span>
                    Nenhuma tarefa
                </span>

            </div>

        `;

        return;

    }


    elemento.innerHTML =
        "";


    lista.forEach(
        tarefa => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "task-card";


            const podeEditar =
                usuarioAtual.perfil === "admin" ||
                usuarioAtual.perfil === "lider" ||
                tarefa.responsavelId ===
                    usuarioAtual.uid;


            card.innerHTML = `

                <div class="task-card-header">

                    <h4>
                        ${escaparHTML(
                            tarefa.titulo
                        )}
                    </h4>


                    <span class="
                        task-priority
                        ${getPriorityClass(
                            tarefa.prioridade
                        )}
                    ">

                        ${getPriorityLabel(
                            tarefa.prioridade
                        )}

                    </span>

                </div>


                <p class="task-card-description">

                    ${escaparHTML(
                        tarefa.descricao
                    )}

                </p>


                <div class="task-card-meta">

                    <span>

                        <i class="fa-solid fa-user"></i>

                        ${escaparHTML(
                            tarefa.responsavelNome ||
                            "Sem responsável"
                        )}

                    </span>


                    <span>

                        ${
                            tarefa.prazo
                            ? formatarData(
                                tarefa.prazo
                            )
                            : "Sem prazo"
                        }

                    </span>

                </div>


                <div class="task-progress-header">

                    <span>
                        Progresso
                    </span>

                    <strong>
                        ${limitarProgresso(
                            tarefa.progresso
                        )}%
                    </strong>

                </div>


                <div class="task-progress">

                    <div
                        style="
                            width:
                            ${limitarProgresso(
                                tarefa.progresso
                            )}%;
                        "
                    ></div>

                </div>


                ${
                    podeEditar
                    ? `

                        <div
                            style="
                                margin-top: 10px;
                                display: flex;
                                justify-content: flex-end;
                            "
                        >

                            <button
                                type="button"
                                class="
                                    btn
                                    btn-secondary
                                    edit-task-button
                                "
                                data-id="${tarefa.id}"
                                style="
                                    padding: 6px 9px;
                                    font-size: 8px;
                                "
                            >

                                <i class="fa-solid fa-pen"></i>

                                Atualizar

                            </button>

                        </div>

                    `
                    : ""
                }

            `;


            elemento.appendChild(
                card
            );

        }
    );


    elemento
        .querySelectorAll(
            ".edit-task-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        abrirModalEditarTarefa(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ============================================================
// EDITAR TAREFA
// ============================================================

function abrirModalEditarTarefa(
    tarefaId
) {

    const tarefa =
        tarefas.find(
            item =>
                item.id === tarefaId
        );


    if (!tarefa) {

        mostrarToast(
            "Tarefa não encontrada."
        );

        return;

    }


    const podeEditarTudo =
        usuarioAtual.perfil === "admin" ||
        usuarioAtual.perfil === "lider";


    const responsavel =
        tarefa.responsavelId ===
        usuarioAtual.uid;


    if (
        !podeEditarTudo &&
        !responsavel
    ) {

        mostrarToast(
            "Você não pode alterar esta tarefa."
        );

        return;

    }


    globalModalTitle.textContent =
        "Atualizar tarefa";


    globalModalBody.innerHTML = `

        <form
            id="editTaskForm"
            class="dashboard-form"
        >

            <div class="dashboard-form-group full">

                <label>
                    Tarefa
                </label>

                <input
                    type="text"
                    value="${escaparAtributo(
                        tarefa.titulo
                    )}"
                    disabled
                >

            </div>


            <div class="dashboard-form-group full">

                <label>
                    Responsável
                </label>

                <input
                    type="text"
                    value="${escaparAtributo(
                        tarefa.responsavelNome ||
                        ""
                    )}"
                    disabled
                >

            </div>


            <div class="dashboard-form-group">

                <label for="editTaskStatus">
                    Status
                </label>

                <select
                    id="editTaskStatus"
                    required
                >

                    <option
                        value="pendente"
                        ${
                            tarefa.status === "pendente"
                                ? "selected"
                                : ""
                        }
                    >
                        A fazer
                    </option>

                    <option
                        value="andamento"
                        ${
                            tarefa.status === "andamento"
                                ? "selected"
                                : ""
                        }
                    >
                        Em andamento
                    </option>

                    <option
                        value="revisao"
                        ${
                            tarefa.status === "revisao"
                                ? "selected"
                                : ""
                        }
                    >
                        Em revisão
                    </option>

                    <option
                        value="concluida"
                        ${
                            tarefa.status === "concluida"
                                ? "selected"
                                : ""
                        }
                    >
                        Concluída
                    </option>

                    <option
                        value="bloqueada"
                        ${
                            tarefa.status === "bloqueada"
                                ? "selected"
                                : ""
                        }
                    >
                        Bloqueada
                    </option>

                </select>

            </div>


            <div class="dashboard-form-group">

                <label for="editTaskProgress">
                    Progresso (%)
                </label>

                <input
                    type="number"
                    id="editTaskProgress"
                    min="0"
                    max="100"
                    value="${limitarProgresso(
                        tarefa.progresso
                    )}"
                    required
                >

            </div>


            ${
                podeEditarTudo
                ? `

                    <div class="dashboard-form-group">

                        <label for="editTaskPriority">
                            Prioridade
                        </label>

                        <select
                            id="editTaskPriority"
                        >

                            <option
                                value="baixa"
                                ${
                                    tarefa.prioridade === "baixa"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Baixa
                            </option>

                            <option
                                value="media"
                                ${
                                    tarefa.prioridade === "media"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Média
                            </option>

                            <option
                                value="alta"
                                ${
                                    tarefa.prioridade === "alta"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Alta
                            </option>

                        </select>

                    </div>


                    <div class="dashboard-form-group">

                        <label for="editTaskDeadline">
                            Prazo
                        </label>

                        <input
                            type="date"
                            id="editTaskDeadline"
                            value="${tarefa.prazo || ""}"
                        >

                    </div>

                `
                : ""
            }


            <div class="modal-form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelEditTaskButton"
                >
                    Cancelar
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="updateTaskButton"
                >

                    <i class="fa-solid fa-floppy-disk"></i>

                    Salvar

                </button>

            </div>

        </form>

    `;


    globalModal.hidden =
        false;


    document
        .getElementById(
            "cancelEditTaskButton"
        )
        ?.addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "editTaskForm"
        )
        ?.addEventListener(
            "submit",
            event =>
                atualizarTarefa(
                    event,
                    tarefa,
                    podeEditarTudo
                )
        );

}


// ============================================================
// ATUALIZAR TAREFA
// ============================================================

async function atualizarTarefa(
    event,
    tarefa,
    podeEditarTudo
) {

    event.preventDefault();


    let status =
        document
            .getElementById(
                "editTaskStatus"
            )
            .value;


    let progresso =
        limitarProgresso(
            document
                .getElementById(
                    "editTaskProgress"
                )
                .value
        );


    if (
        status === "pendente"
    ) {

        progresso =
            0;

    }


    if (
        status === "concluida"
    ) {

        progresso =
            100;

    }


    if (
        progresso === 100
    ) {

        status =
            "concluida";

    }


    if (
        progresso > 0 &&
        status === "pendente"
    ) {

        status =
            "andamento";

    }


    const dados = {

        status,

        progresso,

        atualizadoPorId:
            usuarioAtual.uid,

        atualizadoPorNome:
            usuarioAtual.nome,

        atualizadoEm:
            serverTimestamp()

    };


    if (podeEditarTudo) {

        dados.prioridade =
            document
                .getElementById(
                    "editTaskPriority"
                )
                .value;


        dados.prazo =
            document
                .getElementById(
                    "editTaskDeadline"
                )
                .value || null;

    }


    const updateButton =
        document.getElementById(
            "updateTaskButton"
        );


    setButtonLoading(
        updateButton,
        "Salvando..."
    );


    try {

        await updateDoc(
            doc(
                db,
                "tarefas",
                tarefa.id
            ),
            dados
        );


        fecharModal();


        mostrarToast(
            "Tarefa atualizada!"
        );


        await carregarTarefas();

        await atualizarProgressoEquipes();

    }

    catch (error) {

        console.error(
            "Erro ao atualizar tarefa:",
            error
        );


        mostrarToast(
            "Não foi possível atualizar a tarefa."
        );


        restaurarBotao(
            updateButton,
            "Salvar",
            "fa-floppy-disk"
        );

    }

}


// ============================================================
// DASHBOARD
// ============================================================

function atualizarDashboard() {

    let visiveis =
        [...tarefas];


    if (
        usuarioAtual.perfil === "lider" ||
        usuarioAtual.perfil === "integrante"
    ) {

        visiveis =
            visiveis.filter(
                tarefa =>
                    tarefa.equipeId ===
                    usuarioAtual.equipe
            );

    }


    const total =
        visiveis.length;


    const pendentes =
        visiveis.filter(
            tarefa =>
                tarefa.status === "pendente"
        ).length;


    const andamento =
        visiveis.filter(
            tarefa =>
                tarefa.status === "andamento"
        ).length;


    const revisao =
        visiveis.filter(
            tarefa =>
                tarefa.status === "revisao"
        ).length;


    const concluidas =
        visiveis.filter(
            tarefa =>
                tarefa.status === "concluida"
        ).length;


    if (totalTasks) {

        totalTasks.textContent =
            total;

    }


    if (pendingTasks) {

        pendingTasks.textContent =
            pendentes;

    }


    if (progressTasks) {

        progressTasks.textContent =
            andamento;

    }


    if (reviewTasks) {

        reviewTasks.textContent =
            revisao;

    }


    if (completedTasks) {

        completedTasks.textContent =
            concluidas;

    }


    let progressoGeral = 0;


    if (total > 0) {

        const soma =
            visiveis.reduce(
                (
                    total,
                    tarefa
                ) =>
                    total +
                    limitarProgresso(
                        tarefa.progresso
                    ),
                0
            );


        progressoGeral =
            Math.round(
                soma / total
            );

    }


    if (generalProgressValue) {

        generalProgressValue.textContent =
            `${progressoGeral}%`;

    }


    if (generalProgressBar) {

        generalProgressBar.style.width =
            `${progressoGeral}%`;

    }

}


// ============================================================
// TAREFAS RECENTES
// ============================================================

function renderizarTarefasRecentes() {

    if (!recentTasks) return;


    let lista =
        [...tarefas];


    if (
        usuarioAtual.perfil === "lider" ||
        usuarioAtual.perfil === "integrante"
    ) {

        lista =
            lista.filter(
                tarefa =>
                    tarefa.equipeId ===
                    usuarioAtual.equipe
            );

    }


    lista =
        lista.slice(
            0,
            5
        );


    if (
        lista.length === 0
    ) {

        recentTasks.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-list-check"></i>

                <span>
                    Nenhuma tarefa cadastrada.
                </span>

            </div>

        `;

        return;

    }


    recentTasks.innerHTML =
        "";


    lista.forEach(
        tarefa => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-task-item";


            item.innerHTML = `

                <div class="recent-item-main">

                    <div class="recent-item-icon">

                        <i class="fa-solid fa-list-check"></i>

                    </div>


                    <div class="recent-item-data">

                        <strong>
                            ${escaparHTML(
                                tarefa.titulo
                            )}
                        </strong>

                        <span>
                            ${escaparHTML(
                                tarefa.responsavelNome ||
                                ""
                            )}
                            •
                            ${limitarProgresso(
                                tarefa.progresso
                            )}%
                        </span>

                    </div>

                </div>


                <span class="
                    badge
                    ${getStatusBadge(
                        tarefa.status
                    )}
                ">
                    ${getStatusLabel(
                        tarefa.status
                    )}
                </span>

            `;


            recentTasks.appendChild(
                item
            );

        }
    );

}


// ============================================================
// ATUALIZAR PROGRESSO DAS EQUIPES
// ============================================================

async function atualizarProgressoEquipes() {

    const equipes =
        getEquipes();


    for (
        const equipe of equipes
    ) {

        const tarefasEquipe =
            tarefas.filter(
                tarefa =>
                    tarefa.equipeId ===
                    equipe.id
            );


        let progresso = 0;


        if (
            tarefasEquipe.length > 0
        ) {

            const soma =
                tarefasEquipe.reduce(
                    (
                        total,
                        tarefa
                    ) =>
                        total +
                        limitarProgresso(
                            tarefa.progresso
                        ),
                    0
                );


            progresso =
                Math.round(
                    soma /
                    tarefasEquipe.length
                );

        }


        try {

            await updateDoc(
                doc(
                    db,
                    "equipes",
                    equipe.id
                ),
                {

                    progresso,

                    atualizadoEm:
                        serverTimestamp()

                }
            );

        }

        catch (error) {

            console.error(
                "Erro ao atualizar progresso da equipe:",
                equipe.id,
                error
            );

        }

    }


    await carregarEquipes();

}


// ============================================================
// UTILITÁRIOS
// ============================================================

function limitarProgresso(valor) {

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


function formatarNumero(numero) {

    return String(
        numero
    ).padStart(
        2,
        "0"
    );

}


function formatarData(data) {

    if (!data) {

        return "-";

    }


    const partes =
        data.split("-");


    if (
        partes.length !== 3
    ) {

        return data;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


function getPriorityClass(prioridade) {

    switch (prioridade) {

        case "alta":
            return "priority-high";

        case "baixa":
            return "priority-low";

        default:
            return "priority-medium";

    }

}


function getPriorityLabel(prioridade) {

    switch (prioridade) {

        case "alta":
            return "Alta";

        case "baixa":
            return "Baixa";

        default:
            return "Média";

    }

}


function getStatusLabel(status) {

    switch (status) {

        case "pendente":
            return "A fazer";

        case "andamento":
            return "Em andamento";

        case "revisao":
            return "Em revisão";

        case "concluida":
            return "Concluída";

        case "bloqueada":
            return "Bloqueada";

        default:
            return "Status";

    }

}


function getStatusBadge(status) {

    switch (status) {

        case "concluida":
            return "badge-success";

        case "andamento":
            return "badge-primary";

        case "revisao":
            return "badge-warning";

        case "bloqueada":
            return "badge-danger";

        default:
            return "badge-info";

    }

}


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


function fecharModal() {

    if (!globalModal) return;


    globalModal.hidden =
        true;


    if (globalModalBody) {

        globalModalBody.innerHTML =
            "";

    }

}


function mostrarToast(mensagem) {

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

export function getTarefas() {

    return tarefas;

}