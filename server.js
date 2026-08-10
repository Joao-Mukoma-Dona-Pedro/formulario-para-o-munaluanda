const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");

const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ORGANIZATION_NAME = "Model UN Academy Luanda Chapter";
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || "";
const EMAIL_DRY_RUN = String(process.env.EMAIL_DRY_RUN || "").toLowerCase() === "true";
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024;
const DATA_DIR = path.join(__dirname, "data");
const APPLICATIONS_DIR = path.join(DATA_DIR, "applications");
const DB_FILE = path.join(DATA_DIR, "applications.json");
const ROUTING_CONFIG = require("./config/routing.json");
const USE_BLOB_STORAGE = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const IS_PRODUCTION_RUNTIME = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

const allowedExtensions = new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
]);
const applicationStates = ["Recebida", "Em análise", "Pré-selecionada", "Entrevista", "Selecionada", "Não selecionada"];

if (!USE_BLOB_STORAGE && !IS_PRODUCTION_RUNTIME) {
  ensureDir(DATA_DIR);
  ensureDir(APPLICATIONS_DIR);
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]\n");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 12 },
  fileFilter: (_req, file, cb) => {
    const extension = getExtension(file.originalname);
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      cb(new Error(`Tipo de ficheiro inválido: ${file.originalname}`));
      return;
    }
    cb(null, true);
  }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use("/data", (_req, res) => res.status(404).send("Not found"));
app.use("/api/index.js", (_req, res) => res.status(404).send("Not found"));
app.use(express.static(__dirname, { extensions: ["html"] }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    storage: USE_BLOB_STORAGE ? "vercel-blob-private" : (IS_PRODUCTION_RUNTIME ? "not-configured" : "local-filesystem"),
    productionReady: hasProductionSecrets(),
    emailConfigured: isEmailConfigured(),
    dryRun: EMAIL_DRY_RUN
  });
});

app.get("/api/routing/:jobKey", (req, res) => {
  const recipients = getRoutingForJob(req.params.jobKey);
  res.json({ recipients: recipients.map(publicRecipient) });
});

app.post("/api/applications", upload.any(), async (req, res) => {
  try {
    assertRuntimeConfigured();
    const dossier = parseDossier(req.body.dossier);
    const jobKey = String(req.body.selectedJob || dossier?.job?.key || "");
    validateApplication(req.body, dossier, jobKey, req.files || []);

    const now = new Date();
    const id = createApplicationId(jobKey);
    const recipients = getRoutingForJob(jobKey);
    if (!recipients.length) throw new Error("Não existem responsáveis configurados para este cargo.");
    const missingRecipient = recipients.find((recipient) => !recipient.email || String(recipient.email).startsWith("CONFIGURAR_"));
    if (missingRecipient) throw new Error(`E-mail do responsável não configurado: ${missingRecipient.name}.`);

    const submittedAt = now.toISOString();
    const submittedAtDisplay = now.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
    const record = {
      id,
      organization: ORGANIZATION_NAME,
      submittedAt,
      submittedAtDisplay,
      job: {
        key: jobKey,
        title: String(req.body.selectedJobTitle || dossier.job?.title || jobKey)
      },
      data: pickApplicationData(req.body),
      answers: Array.isArray(dossier.answers) ? dossier.answers : buildAnswerRows(req.body),
      documents: [],
      routing: {
        recipients: recipients.map(publicRecipient),
        recipientEmails: recipients.map((recipient) => recipient.email)
      },
      state: "Recebida",
      responsible: recipients.map((recipient) => recipient.name).join(", "),
      emailStatus: "pending",
      emailError: "",
      emailAttempts: 0,
      emailLastAttemptAt: "",
      audit: [{ at: submittedAt, action: "submitted", details: "Candidatura recebida pelo servidor." }]
    };

    record.documents = await saveDocuments(id, req.files || [], dossier.documents || []);
    record.pdf = await generatePdf(record);

    const emailResult = await sendApplicationEmail(record);
    record.emailStatus = emailResult.status;
    record.emailError = emailResult.error || "";
    record.emailAttempts = 1;
    record.emailLastAttemptAt = new Date().toISOString();
    record.audit.push({
      at: record.emailLastAttemptAt,
      action: "email",
      details: emailResult.status === "sent" ? "E-mail enviado aos responsáveis." : `Falha no envio: ${emailResult.error}`
    });

    await persistRecord(record);

    res.status(201).json({
      ok: true,
      id: record.id,
      state: record.state,
      emailStatus: record.emailStatus,
      message: "Candidatura enviada com sucesso!"
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message || "Não foi possível receber a candidatura." });
  }
});

app.get("/api/admin/applications", requireAdmin, async (req, res) => {
  const { q = "", job = "", state = "" } = req.query;
  const needle = String(q).trim().toLowerCase();
  const records = (await listApplicationSummaries()).filter((record) => {
    const matchesName = !needle || String(record.candidateName || "").toLowerCase().includes(needle);
    const matchesJob = !job || record.jobKey === job;
    const matchesState = !state || record.state === state;
    return matchesName && matchesJob && matchesState;
  });
  res.json({ applications: records, states: applicationStates });
});

app.get("/api/admin/applications/:id", requireAdmin, async (req, res) => {
  const record = await readFullRecord(req.params.id);
  if (!record) return res.status(404).json({ error: "Candidatura não encontrada." });
  res.json(withDownloadLinks(record));
});

app.patch("/api/admin/applications/:id/state", requireAdmin, async (req, res) => {
  const record = await readFullRecord(req.params.id);
  if (!record) return res.status(404).json({ error: "Candidatura não encontrada." });
  const nextState = String(req.body.state || "");
  if (!applicationStates.includes(nextState)) return res.status(400).json({ error: "Estado inválido." });
  record.state = nextState;
  record.audit.push({ at: new Date().toISOString(), action: "state", details: `Estado alterado para ${nextState}.` });
  await persistRecord(record);
  res.json({ ok: true, state: record.state });
});

app.post("/api/admin/applications/:id/resend-email", requireAdmin, async (req, res) => {
  const record = await readFullRecord(req.params.id);
  if (!record) return res.status(404).json({ error: "Candidatura não encontrada." });
  const result = await sendApplicationEmail(record);
  record.emailStatus = result.status;
  record.emailError = result.error || "";
  record.emailAttempts = Number(record.emailAttempts || 0) + 1;
  record.emailLastAttemptAt = new Date().toISOString();
  record.audit.push({
    at: record.emailLastAttemptAt,
    action: "email_resend",
    details: result.status === "sent" ? "E-mail reenviado aos responsáveis." : `Falha no reenvio: ${result.error}`
  });
  await persistRecord(record);
  res.json({ ok: result.status === "sent", emailStatus: record.emailStatus, emailError: record.emailError });
});

app.get("/api/download/:token", async (req, res) => {
  const payload = verifyDownloadToken(req.params.token);
  if (!payload) return res.status(403).send("Link inválido ou expirado.");
  const record = await readFullRecord(payload.applicationId);
  if (!record) return res.status(404).send("Candidatura não encontrada.");
  const file = [...record.documents, record.pdf].find((item) => item && item.id === payload.fileId);
  if (!file) return res.status(404).send("Documento não encontrado.");

  const stored = await readStoredFile(payload.applicationId, file);
  if (!stored) return res.status(404).send("Documento não encontrado.");
  res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${sanitizeDownloadName(file.originalName || file.fileName)}"`);
  if (stored.size) res.setHeader("Content-Length", stored.size);
  stored.stream.pipe(res);
});

app.use((error, _req, res, _next) => {
  res.status(400).json({ ok: false, error: error.message || "Pedido inválido." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MUNA recruitment system running at ${APP_BASE_URL}`);
  });
}

module.exports = app;

function assertRuntimeConfigured() {
  if (!DOWNLOAD_SECRET || DOWNLOAD_SECRET.length < 32) {
    throw new Error("DOWNLOAD_SECRET não configurado ou demasiado curto.");
  }
  if (IS_PRODUCTION_RUNTIME && !USE_BLOB_STORAGE) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado. A Vercel requer armazenamento persistente externo para candidaturas e documentos.");
  }
}

function hasProductionSecrets() {
  return Boolean(ADMIN_TOKEN && DOWNLOAD_SECRET && DOWNLOAD_SECRET.length >= 32 && APP_BASE_URL && (!IS_PRODUCTION_RUNTIME || USE_BLOB_STORAGE));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function assertLocalStorageAllowed() {
  if (IS_PRODUCTION_RUNTIME) {
    throw new Error("Armazenamento de produção não configurado. Configure BLOB_READ_WRITE_TOKEN para usar Vercel Blob privado.");
  }
}

function parseDossier(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Dossiê da candidatura inválido.");
  }
}

function validateApplication(body, dossier, jobKey, files = []) {
  const required = ["fullName", "age", "city", "province", "institution", "email", "phone", "motivation", "fit", "schoolPitch", "challenge", "communication", "availability"];
  required.forEach((field) => {
    if (!String(body[field] || "").trim()) throw new Error(`Campo obrigatório em falta: ${field}`);
  });
  if (!jobKey) throw new Error("Cargo não identificado.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) throw new Error("E-mail inválido.");
  if (!/^9\d{8}$/.test(String(body.phone))) throw new Error("Telefone inválido.");
  if (Number(body.age) < 14 || Number(body.age) > 35) throw new Error("Idade fora do intervalo permitido.");
  if (dossier.job?.requiresLuanda && body.luandaAvailability !== "Sim") {
    throw new Error("Este cargo exige disponibilidade presencial em Luanda.");
  }
  const requiredDocs = Array.isArray(dossier.documents) ? dossier.documents.filter((doc) => doc.required) : [];
  const uploadedDocIds = new Set(files.map((file) => file.fieldname.replace(/^document_/, "")));
  requiredDocs.forEach((doc) => {
    if (!uploadedDocIds.has(doc.id)) throw new Error(`Documento obrigatório em falta: ${doc.name || doc.id}`);
  });
}

function pickApplicationData(body) {
  const keys = ["fullName", "age", "city", "province", "institution", "email", "phone", "linkedin", "socials", "motivation", "fit", "schoolPitch", "challenge", "communication", "availability", "luandaAvailability"];
  return Object.fromEntries(keys.map((key) => [key, String(body[key] || "").trim()]));
}

function buildAnswerRows(body) {
  return Object.entries(pickApplicationData(body)).map(([label, answer]) => ({ label, answer: answer || "Não informado" }));
}

function getRoutingForJob(jobKey) {
  const ids = [
    ...ROUTING_CONFIG.globalRecipients,
    ...(ROUTING_CONFIG.jobRecipients[jobKey] || []),
    ...(ROUTING_CONFIG.eventRelatedJobs.includes(jobKey) ? ["tobiaBernardo"] : [])
  ];
  return [...new Set(ids)]
    .map((id) => ({
      id,
      ...ROUTING_CONFIG.recipients[id],
      email: process.env[ROUTING_CONFIG.recipients[id]?.emailEnv] || ROUTING_CONFIG.recipients[id]?.email
    }))
    .filter((recipient) => recipient.id);
}

function publicRecipient(recipient) {
  return {
    id: recipient.id,
    name: recipient.name,
    role: recipient.role,
    email: recipient.email
  };
}

function createApplicationId(jobKey) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `MUNA-${date}-${jobKey}-${crypto.randomBytes(6).toString("hex")}`;
}

function sanitizeFileName(value) {
  return path.basename(String(value || "documento")).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function sanitizeDownloadName(value) {
  return sanitizeFileName(value).replaceAll('"', "");
}

function getExtension(fileName) {
  return path.extname(String(fileName || "")).replace(".", "").toLowerCase();
}

async function saveDocuments(applicationId, files, dossierDocuments = []) {
  const documentLabels = new Map(dossierDocuments.map((doc) => [doc.id, doc.name || doc.id]));
  const saved = [];
  for (const file of files) {
    const docId = file.fieldname.replace(/^document_/, "") || "documento";
    const originalName = sanitizeFileName(file.originalname);
    const extension = getExtension(originalName);
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      throw new Error(`Documento inválido: ${originalName}`);
    }
    const storedName = `${docId}-${crypto.randomBytes(12).toString("hex")}.${extension}`;
    const relativePath = `documents/${storedName}`;
    await writeStoredFile(applicationId, relativePath, file.buffer, file.mimetype);
    saved.push({
      id: docId,
      name: documentLabels.get(docId) || docId,
      originalName,
      fileName: originalName,
      storedName,
      relativePath,
      mimeType: file.mimetype,
      size: file.size
    });
  }
  return saved;
}

async function generatePdf(record) {
  const pdfName = `dossie-${record.id}.pdf`;
  const buffer = await createPdfBuffer(record);
  await writeStoredFile(record.id, pdfName, buffer, "application/pdf");
  return {
    id: "dossierPdf",
    name: "PDF/dossiê da candidatura",
    originalName: pdfName,
    fileName: pdfName,
    relativePath: pdfName,
    mimeType: "application/pdf",
    size: buffer.length
  };
}

function createPdfBuffer(record) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(18).text(ORGANIZATION_NAME, { align: "center" });
    doc.moveDown(0.4).fontSize(14).text("Dossiê profissional da candidatura", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(`ID: ${record.id}`);
    doc.text(`Cargo: ${record.job.title}`);
    doc.text(`Data: ${record.submittedAtDisplay}`);
    doc.text(`Estado: ${record.state}`);
    doc.moveDown();
    record.answers.forEach((row) => {
      doc.font("Helvetica-Bold").text(`${row.label}:`);
      doc.font("Helvetica").text(String(row.answer || "Não informado"));
      doc.moveDown(0.45);
    });
    doc.addPage();
    doc.fontSize(14).text("Documentos da candidatura");
    doc.moveDown();
    record.documents.forEach((file) => {
      doc.fontSize(11).text(`${file.name}: ${file.originalName} (${formatBytes(file.size)})`);
    });
    doc.moveDown();
    doc.text(`Destinatários: ${record.routing.recipientEmails.join(", ")}`);
    doc.end();
  });
}

async function sendApplicationEmail(record) {
  try {
    const transporter = createTransporter();
    if (!transporter) throw new Error("SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e EMAIL_FROM.");
    const html = buildEmailHtml(withDownloadLinks(record));
    const text = buildEmailText(record);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: record.routing.recipientEmails,
      subject: `Nova candidatura - ${record.job.title} | ${ORGANIZATION_NAME}`,
      html,
      text
    });
    return { status: EMAIL_DRY_RUN ? "dry_run" : "sent" };
  } catch (error) {
    return { status: "failed", error: error.message };
  }
}

function createTransporter() {
  if (EMAIL_DRY_RUN) return nodemailer.createTransport({ jsonTransport: true });
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, EMAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !EMAIL_FROM) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });
}

function isEmailConfigured() {
  if (EMAIL_DRY_RUN) return true;
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, EMAIL_FROM } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD && EMAIL_FROM);
}

function buildEmailHtml(record) {
  const rows = record.answers.map((row) => `
    <tr>
      <th style="text-align:left;border:1px solid #d8dee9;padding:8px;background:#f6f8fb;width:32%;">${escapeHtml(row.label)}</th>
      <td style="border:1px solid #d8dee9;padding:8px;">${escapeHtml(row.answer || "Não informado").replaceAll("\n", "<br>")}</td>
    </tr>
  `).join("");
  const docs = [...record.documents, record.pdf].filter(Boolean).map((file) => `
    <li><strong>${escapeHtml(file.name)}</strong> - <a href="${escapeHtml(file.downloadUrl)}">Abrir/baixar documento</a> (${escapeHtml(file.originalName)})</li>
  `).join("");
  return `
    <div style="font-family:Arial,sans-serif;color:#172033;">
      <h2>Nova candidatura recebida</h2>
      <p><strong>${escapeHtml(ORGANIZATION_NAME)}</strong></p>
      <table style="border-collapse:collapse;width:100%;margin:18px 0;"><tbody>${rows}</tbody></table>
      <h3>DOCUMENTOS DA CANDIDATURA</h3>
      <ul>${docs}</ul>
      <p><strong>Data e hora da candidatura:</strong> ${escapeHtml(record.submittedAtDisplay)}</p>
      <p><strong>Destinatários:</strong> ${escapeHtml(record.routing.recipientEmails.join(", "))}</p>
    </div>
  `;
}

function buildEmailText(record) {
  const rows = record.answers.map((row) => `${row.label}: ${row.answer || "Não informado"}`).join("\n");
  return `${ORGANIZATION_NAME}\nNova candidatura - ${record.job.title}\n\n${rows}\n\nDocumentos disponíveis por links seguros no e-mail HTML.\nData: ${record.submittedAtDisplay}`;
}

function signDownloadToken(applicationId, fileId, minutes = 10080) {
  const expires = Date.now() + minutes * 60 * 1000;
  const payload = `${applicationId}.${fileId}.${expires}`;
  const signature = crypto.createHmac("sha256", DOWNLOAD_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function verifyDownloadToken(token) {
  try {
    if (!DOWNLOAD_SECRET) return null;
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [applicationId, fileId, expires, signature] = decoded.split(".");
    if (!applicationId || !fileId || !expires || !signature || Number(expires) < Date.now()) return null;
    const payload = `${applicationId}.${fileId}.${expires}`;
    const expected = crypto.createHmac("sha256", DOWNLOAD_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return { applicationId, fileId };
  } catch {
    return null;
  }
}

function withDownloadLinks(record) {
  const copy = JSON.parse(JSON.stringify(record));
  copy.documents = copy.documents.map((file) => ({ ...file, downloadUrl: downloadUrl(record.id, file.id) }));
  if (copy.pdf) copy.pdf.downloadUrl = downloadUrl(record.id, copy.pdf.id);
  return copy;
}

function downloadUrl(applicationId, fileId) {
  return `${APP_BASE_URL.replace(/\/$/, "")}/api/download/${signDownloadToken(applicationId, fileId)}`;
}

async function writeStoredFile(applicationId, relativePath, buffer, contentType) {
  if (USE_BLOB_STORAGE) {
    const { put } = await import("@vercel/blob");
    const pathname = blobPath(applicationId, relativePath);
    const blob = await put(pathname, buffer, {
      access: "private",
      allowOverwrite: true,
      contentType
    });
    return { pathname: blob.pathname, url: blob.url };
  }
  assertLocalStorageAllowed();
  const filePath = path.join(APPLICATIONS_DIR, applicationId, relativePath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, buffer);
  return { pathname: relativePath };
}

async function readStoredFile(applicationId, file) {
  if (USE_BLOB_STORAGE) {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPath(applicationId, file.relativePath), { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return {
      stream: Readable.fromWeb(result.stream),
      size: result.blob.size
    };
  }
  assertLocalStorageAllowed();
  const baseDir = path.resolve(APPLICATIONS_DIR, applicationId);
  const filePath = path.resolve(baseDir, file.relativePath);
  if (!filePath.startsWith(baseDir) || !fs.existsSync(filePath)) return null;
  return {
    stream: fs.createReadStream(filePath),
    size: fs.statSync(filePath).size
  };
}

async function persistRecord(record) {
  const json = `${JSON.stringify(record, null, 2)}\n`;
  if (USE_BLOB_STORAGE) {
    await writeStoredFile(record.id, "record.json", Buffer.from(json), "application/json");
    return;
  }
  assertLocalStorageAllowed();
  const appDir = path.join(APPLICATIONS_DIR, record.id);
  ensureDir(appDir);
  fs.writeFileSync(path.join(appDir, "record.json"), json);
  upsertLocalSummary(record);
}

async function readFullRecord(id) {
  const safeId = safeApplicationId(id);
  if (USE_BLOB_STORAGE) {
    const file = await readJsonBlob(blobPath(safeId, "record.json"));
    return file || null;
  }
  assertLocalStorageAllowed();
  const file = path.join(APPLICATIONS_DIR, safeId, "record.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function listApplicationSummaries() {
  if (USE_BLOB_STORAGE) {
    const records = await listBlobRecords();
    return records.map(summaryForRecord).sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
  }
  assertLocalStorageAllowed();
  return readLocalDb();
}

async function listBlobRecords() {
  const { list } = await import("@vercel/blob");
  const records = [];
  let cursor;
  do {
    const page = await list({ prefix: "applications/", cursor, limit: 1000 });
    const recordBlobs = page.blobs.filter((blob) => blob.pathname.endsWith("/record.json"));
    for (const blob of recordBlobs) {
      const record = await readJsonBlob(blob.pathname);
      if (record) records.push(record);
    }
    cursor = page.cursor;
  } while (cursor);
  return records;
}

async function readJsonBlob(pathname) {
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const chunks = [];
  for await (const chunk of Readable.fromWeb(result.stream)) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function readLocalDb() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeLocalDb(records) {
  fs.writeFileSync(DB_FILE, `${JSON.stringify(records, null, 2)}\n`);
}

function upsertLocalSummary(record) {
  const records = readLocalDb();
  const summary = summaryForRecord(record);
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) records[index] = summary;
  else records.unshift(summary);
  writeLocalDb(records);
}

function summaryForRecord(record) {
  return {
    id: record.id,
    candidateName: record.data.fullName,
    email: record.data.email,
    phone: record.data.phone,
    jobKey: record.job.key,
    jobTitle: record.job.title,
    submittedAt: record.submittedAt,
    state: record.state,
    responsible: record.responsible,
    recipients: record.routing.recipientEmails,
    emailStatus: record.emailStatus,
    emailError: record.emailError
  };
}

function blobPath(applicationId, relativePath) {
  return `applications/${safeApplicationId(applicationId)}/${String(relativePath).replaceAll("\\", "/").replace(/^\/+/, "")}`;
}

function safeApplicationId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ error: "ADMIN_TOKEN não configurado no servidor." });
  const token = req.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: "Acesso administrativo negado." });
  next();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
