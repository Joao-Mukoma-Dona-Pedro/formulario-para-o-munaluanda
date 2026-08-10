const SUBMISSION_ENDPOINT = "";
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];

const jobs = {
    escolas: {
        title: "Coordenador de Relações com Escolas",
        icon: "fa-school",
        short: "Apoia a aproximação da organização às escolas e comunidades estudantis.",
        description: "Responsável por criar contacto com escolas, apresentar oportunidades da Model UN Academy e acompanhar potenciais parcerias educativas.",
        essential: [
            "Boa comunicação oral e escrita.",
            "Responsabilidade no cumprimento de prazos.",
            "Capacidade de organizar contactos e informações.",
            "Disponibilidade para interagir com instituições de ensino."
        ],
        valued: [
            "Experiência em clubes escolares ou associações estudantis.",
            "Facilidade para apresentações e reuniões.",
            "Interesse por educação, liderança juvenil e relações internacionais."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso académico, atividades e experiências relevantes do candidato.",
                required: true
            }
        ]
    },
    universidades: {
        title: "Coordenador de Relações com Universidades",
        icon: "fa-building-columns",
        short: "Constrói pontes com universidades e grupos académicos.",
        description: "Acompanha contactos universitários, identifica oportunidades de colaboração e apoia iniciativas direcionadas a estudantes do ensino superior.",
        essential: [
            "Boa escrita e comunicação institucional.",
            "Organização e acompanhamento de contactos.",
            "Responsabilidade e postura profissional.",
            "Interesse por ambiente académico e juventude."
        ],
        valued: [
            "Participação em núcleos estudantis.",
            "Conhecimento de universidades ou associações universitárias.",
            "Capacidade de planear reuniões e apresentações."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Permite analisar o percurso académico, envolvimento estudantil e experiências relevantes.",
                required: true
            }
        ]
    },
    parcerias: {
        title: "Parcerias Institucionais",
        icon: "fa-handshake",
        short: "Apoia a criação de parcerias com organizações, empresas e instituições.",
        description: "Trabalha na identificação, abordagem e acompanhamento de parceiros que possam contribuir para o crescimento da organização.",
        essential: [
            "Comunicação profissional e respeitosa.",
            "Capacidade de pesquisa e organização.",
            "Responsabilidade no seguimento de contactos.",
            "Boa apresentação escrita."
        ],
        valued: [
            "Interesse por negociação e relações institucionais.",
            "Experiência em projetos juvenis.",
            "Facilidade para preparar propostas simples."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a avaliar experiências, atividades e competências de contacto institucional.",
                required: true
            }
        ]
    },
    diaspora: {
        title: "Coordenador da Diáspora",
        icon: "fa-earth-africa",
        short: "Liga a organização a jovens angolanos e parceiros fora do país.",
        description: "Apoia contactos com a diáspora angolana, oportunidades internacionais e iniciativas que aproximem jovens em diferentes contextos.",
        essential: [
            "Boa comunicação escrita.",
            "Interesse por relações internacionais e diáspora.",
            "Organização de contactos e informações.",
            "Responsabilidade e discrição."
        ],
        valued: [
            "Conhecimentos de inglês ou outra língua estrangeira.",
            "Rede de contactos em comunidades estudantis internacionais.",
            "Experiência em comunicação online."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Permite conhecer experiências académicas, linguísticas e associativas relevantes.",
                required: true
            }
        ]
    },
    provincial: {
        title: "Coordenador Provincial",
        icon: "fa-location-dot",
        short: "Apoia a expansão e organização de iniciativas em diferentes províncias.",
        description: "Contribui para mapear oportunidades locais, contactar estudantes e apoiar a coordenação de atividades fora do centro de Luanda.",
        essential: [
            "Responsabilidade e capacidade de organização.",
            "Boa comunicação com equipas e instituições.",
            "Conhecimento básico da realidade local.",
            "Disponibilidade para acompanhamento regular."
        ],
        valued: [
            "Experiência em liderança estudantil.",
            "Contacto com escolas, universidades ou grupos juvenis.",
            "Capacidade de mobilizar equipas."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a analisar percurso, atividades locais e experiências de liderança ou organização.",
                required: true
            }
        ]
    },
    designer: {
        title: "Designer Gráfico",
        icon: "fa-palette",
        short: "Cria materiais visuais alinhados à identidade institucional.",
        description: "Apoia a produção de cartazes, publicações digitais, apresentações e peças gráficas para comunicação da organização.",
        essential: [
            "Noções de composição visual e atenção ao detalhe.",
            "Capacidade básica de trabalhar com Canva, Photoshop, Illustrator ou ferramenta semelhante.",
            "Responsabilidade com prazos e identidade visual.",
            "Vontade de aprender e receber feedback."
        ],
        valued: [
            "Portfólio com peças gráficas.",
            "Experiência em redes sociais ou comunicação visual.",
            "Interesse por design institucional e educativo."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso e experiências do candidato.",
                required: true
            },
            {
                id: "portfolio",
                name: "Portfólio",
                reason: "Permite ver exemplos de trabalhos visuais, mesmo que sejam projetos pessoais ou escolares.",
                required: true
            }
        ]
    },
    redator: {
        title: "Redator de Conteúdo",
        icon: "fa-pen-nib",
        short: "Produz textos claros para comunicação institucional e educativa.",
        description: "Apoia a escrita de publicações, artigos curtos, legendas, comunicados e conteúdos informativos da organização.",
        essential: [
            "Boa escrita em português.",
            "Clareza, organização de ideias e atenção à revisão.",
            "Responsabilidade com prazos.",
            "Interesse por temas juvenis, educação e relações internacionais."
        ],
        valued: [
            "Exemplos de textos, artigos ou publicações.",
            "Conhecimentos básicos de inglês.",
            "Criatividade e capacidade de adaptar linguagem ao público."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso académico e experiências relevantes.",
                required: true
            },
            {
                id: "writing",
                name: "Texto de autoria",
                reason: "Permite avaliar clareza, organização e estilo de escrita. Pode ser um texto escolar, artigo ou publicação.",
                required: true
            }
        ]
    },
    fotografo: {
        title: "Fotógrafo",
        icon: "fa-camera",
        short: "Regista eventos, atividades e momentos institucionais.",
        description: "Apoia a captação de fotografias para eventos, redes sociais e memória institucional da organização.",
        essential: [
            "Noções básicas de enquadramento e composição.",
            "Responsabilidade no tratamento de imagens.",
            "Disponibilidade para eventos ou atividades combinadas.",
            "Capacidade de usar câmara ou smartphone com boa qualidade."
        ],
        valued: [
            "Portfólio com fotografias.",
            "Conhecimentos básicos de edição.",
            "Experiência em cobertura de eventos escolares ou juvenis."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências e disponibilidade do candidato.",
                required: true
            },
            {
                id: "portfolio",
                name: "Portfólio",
                reason: "Permite ver exemplos de fotografias já feitas, mesmo em contexto pessoal ou estudantil.",
                required: true
            }
        ]
    },
    videografo: {
        title: "Videógrafo",
        icon: "fa-video",
        short: "Produz e apoia conteúdos audiovisuais da organização.",
        description: "Apoia a gravação e edição de vídeos para eventos, redes sociais e campanhas institucionais.",
        essential: [
            "Noções básicas de gravação e enquadramento.",
            "Capacidade básica de editar em CapCut, InShot ou ferramenta semelhante.",
            "Responsabilidade com prazos.",
            "Atenção ao som, imagem e organização dos ficheiros."
        ],
        valued: [
            "Exemplos de vídeos editados.",
            "Criatividade para conteúdos curtos.",
            "Experiência em eventos ou redes sociais."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências e disponibilidade do candidato.",
                required: true
            },
            {
                id: "portfolio",
                name: "Portfólio",
                reason: "Permite avaliar exemplos de vídeos, edições ou projetos audiovisuais.",
                required: true
            }
        ]
    },
    rp: {
        title: "Relações Públicas",
        icon: "fa-users",
        short: "Representa a organização e apoia a comunicação com públicos externos.",
        description: "Apoia contactos externos, receção de convidados, comunicação institucional e representação em atividades oficiais.",
        essential: [
            "Boa comunicação e postura profissional.",
            "Responsabilidade e pontualidade.",
            "Capacidade de lidar com diferentes públicos.",
            "Clareza na comunicação escrita e oral."
        ],
        valued: [
            "Conhecimentos de inglês.",
            "Experiência em eventos, clubes ou representação estudantil.",
            "Facilidade para trabalhar em equipa."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a analisar experiências, atividades e competências de comunicação.",
                required: true
            },
            {
                id: "english",
                name: "Certificado de Inglês ou comprovativo equivalente",
                reason: "Opcionalmente comprova conhecimentos linguísticos valorizados para representação e contacto externo.",
                required: false
            }
        ]
    },
    secretario: {
        title: "Secretário",
        icon: "fa-clipboard-list",
        short: "Organiza documentos, reuniões e informações internas.",
        description: "Apoia o funcionamento administrativo da equipa, mantendo registos claros e ajudando na organização das atividades.",
        essential: [
            "Organização de documentos e informações.",
            "Registo de reuniões e decisões.",
            "Organização de agendas e reuniões.",
            "Boa comunicação escrita.",
            "Responsabilidade e atenção aos detalhes.",
            "Capacidade básica de trabalhar com documentos digitais.",
            "Cumprimento de prazos.",
            "Discrição no tratamento de informações internas.",
            "Espírito de equipa.",
            "Vontade de aprender."
        ],
        valued: [
            "Experiência em clubes escolares, associações ou grupos de estudantes.",
            "Noções de Google Docs, Word, Excel ou ferramentas semelhantes.",
            "Gosto por organização e apoio administrativo."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso, atividades e responsabilidades já assumidas pelo candidato.",
                required: true
            }
        ]
    }
};

const state = {
    currentPage: 0,
    selectedJob: "",
    files: {}
};

const pages = [...document.querySelectorAll(".page")];
const steps = [...document.querySelectorAll(".step")];
const progress = document.getElementById("progress");
const currentStepText = document.getElementById("currentStepText");
const currentStepName = document.getElementById("currentStepName");
const form = document.getElementById("applicationForm");
const jobGrid = document.getElementById("jobGrid");
const jobDetails = document.getElementById("jobDetails");
const jobError = document.getElementById("jobError");
const documents = document.getElementById("documents");
const documentsError = document.getElementById("documentsError");
const review = document.getElementById("review");
const submitMessage = document.getElementById("submitMessage");

function init() {
    renderJobs();
    bindNavigation();
    bindFieldValidation();
    bindCounters();
    restoreDraft();
    updateStep();
    renderDocuments();
}

function renderJobs() {
    jobGrid.innerHTML = Object.entries(jobs).map(([key, job]) => `
        <button type="button" class="job-card" data-job="${key}" aria-pressed="false">
            <i class="fa-solid ${job.icon}" aria-hidden="true"></i>
            <strong>${job.title}</strong>
            <small>${job.short}</small>
        </button>
    `).join("");

    jobGrid.addEventListener("click", (event) => {
        const card = event.target.closest(".job-card");
        if (!card) return;
        selectJob(card.dataset.job);
    });
}

function selectJob(jobKey) {
    state.selectedJob = jobKey;
    state.files = {};
    localStorage.setItem("muna_selected_job", jobKey);
    document.querySelectorAll(".job-card").forEach((card) => {
        const selected = card.dataset.job === jobKey;
        card.classList.toggle("selected", selected);
        card.setAttribute("aria-pressed", String(selected));
    });
    jobError.textContent = "";
    renderJobDetails();
    renderDocuments();
    saveDraft();
}

function renderJobDetails() {
    if (!state.selectedJob) {
        jobDetails.innerHTML = "";
        return;
    }

    const job = jobs[state.selectedJob];
    jobDetails.innerHTML = `
        <article class="details-card">
            <h4>${job.title}</h4>
            <p>${job.description}</p>
            <div class="detail-columns">
                <div>
                    <h5>Requisitos essenciais</h5>
                    <ul>${job.essential.map(item => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div>
                    <h5>Competências valorizadas</h5>
                    <ul>${job.valued.map(item => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div>
                    <h5>Documentos necessários</h5>
                    <ul>${job.documents.map(doc => `<li>${doc.name}${doc.required ? "" : " (opcional)"}</li>`).join("")}</ul>
                </div>
            </div>
        </article>
    `;
}

function renderDocuments() {
    if (!state.selectedJob) {
        documents.innerHTML = `
            <article class="document-card">
                <div class="document-head">
                    <div>
                        <h4>Nenhum cargo selecionado</h4>
                        <p>Escolha primeiro um cargo para que os documentos necessários apareçam aqui.</p>
                    </div>
                    <span class="doc-status">Pendente</span>
                </div>
            </article>
        `;
        return;
    }

    const job = jobs[state.selectedJob];
    documents.innerHTML = job.documents.map((doc) => {
        const file = state.files[doc.id];
        const loaded = Boolean(file);
        return `
            <article class="document-card ${loaded ? "loaded" : ""}" data-doc-id="${doc.id}">
                <div class="document-head">
                    <div>
                        <h4>${doc.name} ${doc.required ? "" : "(opcional)"}</h4>
                        <p>${doc.reason}</p>
                    </div>
                    <span class="doc-status">${loaded ? "Carregado" : "Pendente"}</span>
                </div>
                <label class="upload-zone" for="doc-${doc.id}">
                    <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
                    <span>
                        <strong>${loaded ? file.name : "Arraste o ficheiro para aqui"}</strong>
                        <small>${loaded ? formatFileSize(file.size) : `Ou escolha um ficheiro. Formatos: ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}. Máx. ${MAX_FILE_SIZE_MB} MB.`}</small>
                    </span>
                    <span class="btn btn-secondary">Escolher ficheiro</span>
                    <input id="doc-${doc.id}" class="upload-input" type="file" accept="${ACCEPTED_EXTENSIONS.map(ext => `.${ext}`).join(",")}" data-doc-id="${doc.id}">
                </label>
                <div class="file-actions">
                    ${loaded ? `<button type="button" class="text-button" data-replace="${doc.id}">Substituir ficheiro</button><button type="button" class="text-button remove" data-remove="${doc.id}">Remover ficheiro</button>` : ""}
                </div>
                <small class="field-error" data-doc-error="${doc.id}"></small>
            </article>
        `;
    }).join("");

    bindUploadEvents();
}

function bindUploadEvents() {
    documents.querySelectorAll(".upload-input").forEach((input) => {
        input.addEventListener("change", () => {
            handleFile(input.dataset.docId, input.files[0]);
        });
    });

    documents.querySelectorAll(".upload-zone").forEach((zone) => {
        zone.addEventListener("dragover", (event) => {
            event.preventDefault();
            zone.classList.add("dragging");
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
        zone.addEventListener("drop", (event) => {
            event.preventDefault();
            zone.classList.remove("dragging");
            const input = zone.querySelector(".upload-input");
            handleFile(input.dataset.docId, event.dataTransfer.files[0]);
        });
    });

    documents.querySelectorAll("[data-remove]").forEach((button) => {
        button.addEventListener("click", () => {
            delete state.files[button.dataset.remove];
            documentsError.textContent = "";
            renderDocuments();
        });
    });

    documents.querySelectorAll("[data-replace]").forEach((button) => {
        button.addEventListener("click", () => {
            document.getElementById(`doc-${button.dataset.replace}`).click();
        });
    });
}

function handleFile(docId, file) {
    const errorEl = documents.querySelector(`[data-doc-error="${docId}"]`);
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        if (errorEl) errorEl.textContent = `Formato inválido. Use: ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`;
        return;
    }

    if (file.size > maxBytes) {
        if (errorEl) errorEl.textContent = `Ficheiro demasiado grande. O limite é ${MAX_FILE_SIZE_MB} MB.`;
        return;
    }

    state.files[docId] = file;
    documentsError.textContent = "";
    renderDocuments();
}

function bindNavigation() {
    document.querySelectorAll("[data-next]").forEach((button) => {
        button.addEventListener("click", () => {
            if (!validateCurrentPage()) return;
            if (state.currentPage < pages.length - 1) {
                state.currentPage += 1;
                if (state.currentPage === pages.length - 1) renderReview();
                updateStep();
            }
        });
    });

    document.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => {
            if (state.currentPage > 0) {
                state.currentPage -= 1;
                updateStep();
            }
        });
    });

    form.addEventListener("submit", handleSubmit);
}

function updateStep() {
    pages.forEach((page, index) => page.classList.toggle("active", index === state.currentPage));
    steps.forEach((step, index) => step.classList.toggle("active", index <= state.currentPage));
    progress.style.width = `${(state.currentPage / (pages.length - 1)) * 100}%`;
    currentStepText.textContent = String(state.currentPage + 1);
    currentStepName.textContent = pages[state.currentPage].dataset.stepName;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateCurrentPage() {
    const page = pages[state.currentPage];
    let valid = validateFields(page);

    if (state.currentPage === 1 && !state.selectedJob) {
        jobError.textContent = "Selecione um cargo antes de continuar.";
        valid = false;
    }

    if (state.currentPage === 3) {
        valid = validateDocuments() && valid;
    }

    if (!valid) {
        const firstInvalid = page.querySelector(".invalid input, .invalid textarea, .invalid select, .form-error:not(:empty), .field-error:not(:empty)");
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return valid;
}

function validateFields(scope) {
    let valid = true;
    scope.querySelectorAll("input, textarea, select").forEach((field) => {
        if (field.type === "file") return;
        const wrapper = field.closest(".field");
        const error = wrapper ? wrapper.querySelector(".field-error") : null;
        const value = field.value.trim();
        let message = "";

        if (field.required && !value) {
            message = "Este campo é obrigatório.";
        } else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            message = "Indique um e-mail válido.";
        } else if (field.type === "url" && value && !isValidUrl(value)) {
            message = "Indique um link válido, começando por https://.";
        } else if (field.id === "phone" && value && !/^9\d{8}$/.test(value)) {
            message = "Indique um telefone angolano com 9 dígitos, começando por 9.";
        } else if (field.id === "age" && value && (Number(value) < 14 || Number(value) > 35)) {
            message = "Indique uma idade entre 14 e 35 anos.";
        }

        if (wrapper) wrapper.classList.toggle("invalid", Boolean(message));
        if (error) error.textContent = message;
        if (message) valid = false;
    });
    return valid;
}

function validateDocuments() {
    documentsError.textContent = "";
    if (!state.selectedJob) {
        documentsError.textContent = "Selecione um cargo antes de carregar documentos.";
        return false;
    }

    const missing = jobs[state.selectedJob].documents.filter((doc) => doc.required && !state.files[doc.id]);
    if (missing.length) {
        documentsError.textContent = `Carregue os documentos obrigatórios: ${missing.map(doc => doc.name).join(", ")}.`;
        return false;
    }
    return true;
}

function bindFieldValidation() {
    form.querySelectorAll("input, textarea, select").forEach((field) => {
        if (field.type === "file") return;
        field.addEventListener("input", () => {
            if (field.id === "phone") field.value = field.value.replace(/\D/g, "").slice(0, 9);
            validateFields(field.closest(".page") || form);
            saveDraft();
        });
        field.addEventListener("blur", () => validateFields(field.closest(".page") || form));
    });
}

function bindCounters() {
    document.querySelectorAll("textarea[maxlength]").forEach((textarea) => {
        const counter = document.querySelector(`.counter[data-for="${textarea.id}"]`);
        const update = () => {
            counter.textContent = `${textarea.value.length} / ${textarea.maxLength} caracteres`;
        };
        textarea.addEventListener("input", update);
        update();
    });
}

function renderReview() {
    const data = getFormData();
    const selected = jobs[state.selectedJob];
    const uploadedDocs = selected.documents.map((doc) => {
        const file = state.files[doc.id];
        return `${escapeHtml(doc.name)}: ${file ? escapeHtml(file.name) : "não carregado"}`;
    }).join("<br>");

    review.innerHTML = `
        <div class="review-grid">
            <div class="review-item"><strong>Nome</strong><span>${escapeHtml(data.fullName)}</span></div>
            <div class="review-item"><strong>Cargo</strong><span>${escapeHtml(selected.title)}</span></div>
            <div class="review-item"><strong>Idade</strong><span>${escapeHtml(data.age)}</span></div>
            <div class="review-item"><strong>Localização</strong><span>${escapeHtml(data.city)}, ${escapeHtml(data.province)}</span></div>
            <div class="review-item"><strong>E-mail</strong><span>${escapeHtml(data.email)}</span></div>
            <div class="review-item"><strong>Telefone</strong><span>${escapeHtml(data.phone)}</span></div>
            <div class="review-item full"><strong>Escola / Universidade / Profissão</strong><span>${escapeHtml(data.institution)}</span></div>
            <div class="review-item full"><strong>Documentos</strong><span>${uploadedDocs}</span></div>
            <div class="review-item full"><strong>Motivação</strong><span>${escapeHtml(data.motivation)}</span></div>
        </div>
    `;
}

async function handleSubmit(event) {
    event.preventDefault();
    submitMessage.className = "submit-message";
    submitMessage.innerHTML = "";

    const allValid = pages.every((page) => validateFields(page)) && state.selectedJob && validateDocuments();
    if (!allValid) {
        submitMessage.classList.add("show", "error");
        submitMessage.innerHTML = `<i class="fa-solid fa-circle-xmark"></i><p>Existem campos por corrigir antes de preparar a candidatura.</p>`;
        return;
    }

    const button = form.querySelector("button[type='submit']");
    button.disabled = true;

    if (!SUBMISSION_ENDPOINT) {
        submitMessage.classList.add("show", "error");
        submitMessage.innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            <p>A candidatura está validada no navegador, mas ainda não foi enviada porque falta configurar um endpoint de submissão. Consulte o README para ligar o portal a um backend ou serviço de formulário.</p>
        `;
        button.disabled = false;
        return;
    }

    try {
        const payload = buildPayload();
        const response = await fetch(SUBMISSION_ENDPOINT, {
            method: "POST",
            body: payload
        });
        if (!response.ok) throw new Error("Falha no envio");
        submitMessage.classList.add("show", "success");
        submitMessage.innerHTML = `<i class="fa-solid fa-circle-check"></i><p>Candidatura enviada com sucesso.</p>`;
        localStorage.removeItem("muna_draft");
        localStorage.removeItem("muna_selected_job");
    } catch (error) {
        submitMessage.classList.add("show", "error");
        submitMessage.innerHTML = `<i class="fa-solid fa-circle-xmark"></i><p>Não foi possível enviar a candidatura. Tente novamente ou contacte a equipa responsável.</p>`;
    } finally {
        button.disabled = false;
    }
}

function buildPayload() {
    const payload = new FormData();
    const data = getFormData();
    Object.entries(data).forEach(([key, value]) => payload.append(key, value));
    payload.append("selectedJob", state.selectedJob);
    payload.append("selectedJobTitle", jobs[state.selectedJob].title);
    Object.entries(state.files).forEach(([docId, file]) => payload.append(`document_${docId}`, file));
    return payload;
}

function getFormData() {
    return Object.fromEntries(new FormData(form).entries());
}

function saveDraft() {
    const data = getFormData();
    localStorage.setItem("muna_draft", JSON.stringify(data));
}

function restoreDraft() {
    const rawDraft = localStorage.getItem("muna_draft");
    if (rawDraft) {
        try {
            const draft = JSON.parse(rawDraft);
            Object.entries(draft).forEach(([name, value]) => {
                const field = form.elements[name];
                if (field && field.type !== "file") field.value = value;
            });
        } catch {
            localStorage.removeItem("muna_draft");
        }
    }

    const savedJob = localStorage.getItem("muna_selected_job");
    if (savedJob && jobs[savedJob]) {
        selectJob(savedJob);
    }
}

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

init();
