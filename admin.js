const tokenInput = document.getElementById("adminToken");
const searchInput = document.getElementById("search");
const jobFilter = document.getElementById("jobFilter");
const stateFilter = document.getElementById("stateFilter");
const table = document.getElementById("applicationsTable");
const details = document.getElementById("details");
const refreshButton = document.getElementById("refresh");
const toast = document.getElementById("toast");

let applications = [];
let states = [];
let selectedId = "";

tokenInput.value = localStorage.getItem("muna_admin_token") || "";

[tokenInput, searchInput, jobFilter, stateFilter].forEach((control) => {
    control.addEventListener("input", () => {
        if (control === tokenInput) localStorage.setItem("muna_admin_token", tokenInput.value);
        loadApplications();
    });
});
refreshButton.addEventListener("click", loadApplications);

async function api(path, options = {}) {
    const headers = {
        ...(options.headers || {}),
        "X-Admin-Token": tokenInput.value
    };
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Pedido falhou.");
    return data;
}

async function loadApplications() {
    if (!tokenInput.value) {
        table.innerHTML = `<tr><td colspan="5">Introduza o token administrativo.</td></tr>`;
        return;
    }
    const params = new URLSearchParams({
        q: searchInput.value,
        job: jobFilter.value,
        state: stateFilter.value
    });
    try {
        const data = await api(`/api/admin/applications?${params}`);
        applications = data.applications || [];
        states = data.states || [];
        renderFilters();
        renderTable();
    } catch (error) {
        showToast(error.message);
    }
}

function renderFilters() {
    const jobs = [...new Map(applications.map((item) => [item.jobKey, item.jobTitle])).entries()];
    const currentJob = jobFilter.value;
    const currentState = stateFilter.value;
    jobFilter.innerHTML = `<option value="">Todos os cargos</option>${jobs.map(([key, title]) => `<option value="${escapeHtml(key)}">${escapeHtml(title)}</option>`).join("")}`;
    stateFilter.innerHTML = `<option value="">Todos os estados</option>${states.map((state) => `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`).join("")}`;
    jobFilter.value = currentJob;
    stateFilter.value = currentState;
}

function renderTable() {
    if (!applications.length) {
        table.innerHTML = `<tr><td colspan="5">Nenhuma candidatura encontrada.</td></tr>`;
        return;
    }
    table.innerHTML = applications.map((item) => `
        <tr data-id="${escapeHtml(item.id)}" class="${item.id === selectedId ? "selected" : ""}">
            <td><strong>${escapeHtml(item.candidateName)}</strong><br><small>${escapeHtml(item.email)}</small></td>
            <td>${escapeHtml(item.jobTitle)}</td>
            <td>${escapeHtml(item.state)}</td>
            <td class="${item.emailStatus === "failed" ? "status-failed" : "status-ok"}">${escapeHtml(item.emailStatus)}</td>
            <td>${formatDate(item.submittedAt)}</td>
        </tr>
    `).join("");
    table.querySelectorAll("tr[data-id]").forEach((row) => {
        row.addEventListener("click", () => openApplication(row.dataset.id));
    });
}

async function openApplication(id) {
    selectedId = id;
    renderTable();
    try {
        const record = await api(`/api/admin/applications/${encodeURIComponent(id)}`);
        details.innerHTML = renderDetails(record);
        bindDetails(record);
    } catch (error) {
        showToast(error.message);
    }
}

function renderDetails(record) {
    const stateOptions = states.map((state) => `<option value="${escapeHtml(state)}" ${record.state === state ? "selected" : ""}>${escapeHtml(state)}</option>`).join("");
    const recipients = record.routing.recipients.map((recipient) => `${escapeHtml(recipient.name)} - ${escapeHtml(recipient.email)}`).join("<br>");
    const docs = [...record.documents, record.pdf].filter(Boolean).map((file) => `
        <div class="document-row">
            <strong>${escapeHtml(file.name)}</strong><br>
            <a href="${escapeHtml(file.downloadUrl)}" target="_blank" rel="noopener">Abrir/baixar ${escapeHtml(file.originalName)}</a>
        </div>
    `).join("");
    const answers = record.answers.map((row) => `
        <div class="answer">
            <strong>${escapeHtml(row.label)}</strong>
            <span>${escapeHtml(row.answer || "Nao informado")}</span>
        </div>
    `).join("");

    return `
        <h2>${escapeHtml(record.data.fullName)}</h2>
        <div class="meta"><strong>Cargo</strong>${escapeHtml(record.job.title)}</div>
        <div class="meta"><strong>Estado</strong><select id="applicationState">${stateOptions}</select></div>
        <div class="meta"><strong>Destinatarios</strong>${recipients}</div>
        <div class="meta"><strong>Envio do e-mail</strong><span class="${record.emailStatus === "failed" ? "status-failed" : "status-ok"}">${escapeHtml(record.emailStatus)}</span>${record.emailError ? `<br><small>${escapeHtml(record.emailError)}</small>` : ""}</div>
        <div class="actions">
            <button class="btn primary" id="saveState">Alterar estado</button>
            <button class="btn" id="resendEmail">Reenviar e-mail</button>
        </div>
        <h3>Documentos</h3>
        ${docs}
        <h3>Respostas</h3>
        ${answers}
    `;
}

function bindDetails(record) {
    document.getElementById("saveState").addEventListener("click", async () => {
        const state = document.getElementById("applicationState").value;
        await api(`/api/admin/applications/${encodeURIComponent(record.id)}/state`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state })
        });
        showToast("Estado atualizado.");
        await loadApplications();
        await openApplication(record.id);
    });

    document.getElementById("resendEmail").addEventListener("click", async () => {
        const result = await api(`/api/admin/applications/${encodeURIComponent(record.id)}/resend-email`, { method: "POST" });
        showToast(result.ok ? "E-mail reenviado." : "Falha no reenvio. A candidatura continua guardada.");
        await loadApplications();
        await openApplication(record.id);
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3600);
}

function formatDate(value) {
    return value ? new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "";
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadApplications();
