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
const applicationStates = ["Recebida", "Em anÃ¡lise", "PrÃ©-selecionada", "Entrevista", "Selecionada", "NÃ£o selecionada"];

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
      cb(new Error(`Tipo de ficheiro invÃ¡lido: ${file.originalname}`));
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
  const productionChecks = getProductionChecks();
  res.json({
    ok: true,
    storage: USE_BLOB_STORAGE ? "vercel-blob-private" : (IS_PRODUCTION_RUNTIME ? "not-configured" : "local-filesystem"),
    productionReady: hasProductionSecrets(),
    emailConfigured: isEmailConfigured(),
    dryRun: EMAIL_DRY_RUN,
    checks: productionChecks
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
    if (!recipients.length) throw new Error("NÃ£o existem responsÃ¡veis configurados para este cargo.");
    const missingRecipient = recipients.find((recipient) => !recipient.email || String(recipient.email).startsWith("CONFIGURAR_"));
    if (missingRecipient) throw new Error(`E-mail do responsÃ¡vel nÃ£o configurado: ${missingRecipient.name}.`);

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
      data: pickApplicationData(req.body, jobKey),
      answers: buildAnswerRows(req.body, jobKey),
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
      details: emailResult.status === "sent" ? "E-mail enviado aos responsÃ¡veis." : `Falha no envio: ${emailResult.error}`
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
    res.status(400).json({ ok: false, error: error.message || "NÃ£o foi possÃ­vel receber a candidatura." });
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
  if (!record) return res.status(404).json({ error: "Candidatura nÃ£o encontrada." });
  res.json(withDownloadLinks(record));
});

app.patch("/api/admin/applications/:id/state", requireAdmin, async (req, res) => {
  const record = await readFullRecord(req.params.id);
  if (!record) return res.status(404).json({ error: "Candidatura nÃ£o encontrada." });
  const nextState = String(req.body.state || "");
  if (!applicationStates.includes(nextState)) return res.status(400).json({ error: "Estado invÃ¡lido." });
  record.state = nextState;
  record.audit.push({ at: new Date().toISOString(), action: "state", details: `Estado alterado para ${nextState}.` });
  await persistRecord(record);
  res.json({ ok: true, state: record.state });
});

app.post("/api/admin/applications/:id/resend-email", requireAdmin, async (req, res) => {
  const record = await readFullRecord(req.params.id);
  if (!record) return res.status(404).json({ error: "Candidatura nÃ£o encontrada." });
  const result = await sendApplicationEmail(record);
  record.emailStatus = result.status;
  record.emailError = result.error || "";
  record.emailAttempts = Number(record.emailAttempts || 0) + 1;
  record.emailLastAttemptAt = new Date().toISOString();
  record.audit.push({
    at: record.emailLastAttemptAt,
    action: "email_resend",
    details: result.status === "sent" ? "E-mail reenviado aos responsÃ¡veis." : `Falha no reenvio: ${result.error}`
  });
  await persistRecord(record);
  res.json({ ok: result.status === "sent", emailStatus: record.emailStatus, emailError: record.emailError });
});

app.post("/api/admin/test-email", requireAdmin, async (_req, res) => {
  const result = await sendSmtpTestEmail();
  res.status(result.ok ? 200 : 400).json(result);
});

app.get("/api/download/:token", async (req, res) => {
  const payload = verifyDownloadToken(req.params.token);
  if (!payload) return res.status(403).send("Link invÃ¡lido ou expirado.");
  const record = await readFullRecord(payload.applicationId);
  if (!record) return res.status(404).send("Candidatura nÃ£o encontrada.");
  const file = [...record.documents, record.pdf].find((item) => item && item.id === payload.fileId);
  if (!file) return res.status(404).send("Documento nÃ£o encontrado.");

  const stored = await readStoredFile(payload.applicationId, file);
  if (!stored) return res.status(404).send("Documento nÃ£o encontrado.");
  res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${sanitizeDownloadName(file.originalName || file.fileName)}"`);
  if (stored.size) res.setHeader("Content-Length", stored.size);
  stored.stream.pipe(res);
});

app.use((error, _req, res, _next) => {
  res.status(400).json({ ok: false, error: error.message || "Pedido invÃ¡lido." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MUNA recruitment system running at ${APP_BASE_URL}`);
  });
}

module.exports = app;

function assertRuntimeConfigured() {
  if (!DOWNLOAD_SECRET || DOWNLOAD_SECRET.length < 32) {
    throw new Error("DOWNLOAD_SECRET nÃ£o configurado ou demasiado curto.");
  }
  if (IS_PRODUCTION_RUNTIME && !USE_BLOB_STORAGE) {
    throw new Error("BLOB_READ_WRITE_TOKEN nÃ£o configurado. A Vercel requer armazenamento persistente externo para candidaturas e documentos.");
  }
}

function hasProductionSecrets() {
  const checks = getProductionChecks();
  return Boolean(
    checks.ADMIN_TOKEN_CONFIGURED &&
    checks.DOWNLOAD_SECRET_CONFIGURED &&
    checks.DOWNLOAD_SECRET_LENGTH_OK &&
    checks.APP_BASE_URL_CONFIGURED &&
    (!checks.IS_PRODUCTION_RUNTIME || checks.BLOB_CONFIGURED)
  );
}

function getProductionChecks() {
  return {
    ADMIN_TOKEN_CONFIGURED: Boolean(ADMIN_TOKEN),
    DOWNLOAD_SECRET_CONFIGURED: Boolean(DOWNLOAD_SECRET),
    DOWNLOAD_SECRET_LENGTH_OK: Boolean(DOWNLOAD_SECRET && DOWNLOAD_SECRET.length >= 32),
    APP_BASE_URL_CONFIGURED: Boolean(APP_BASE_URL),
    BLOB_CONFIGURED: Boolean(USE_BLOB_STORAGE),
    IS_PRODUCTION_RUNTIME: Boolean(IS_PRODUCTION_RUNTIME)
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function assertLocalStorageAllowed() {
  if (IS_PRODUCTION_RUNTIME) {
    throw new Error("Armazenamento de produÃ§Ã£o nÃ£o configurado. Configure BLOB_READ_WRITE_TOKEN para usar Vercel Blob privado.");
  }
}

function parseDossier(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("DossiÃª da candidatura invÃ¡lido.");
  }
}

const COMMON_QUESTION_IDS = ["motivation", "fit", "availability"];
const QUESTION_IDS_BY_JOB = {
  escolas: ["schoolApproach", "institutionalCommunication", "schoolPartnershipFollowUp", "previousExperience"],
  universidades: ["universityApproach", "universityRelations", "partnershipBuilding", "institutionalFollowUp"],
  parcerias: ["partnerIdentification", "institutionalApproach", "proposalBuilding", "relationshipMaintenance"],
  diaspora: ["diasporaCommunication", "networkBuilding", "representationExperience", "internationalOpportunityChallenge"],
  provincial: ["territorialCoordination", "teamLeadership", "localProblemSolving", "activityFollowUp"],
  designer: ["designExperience", "designTools", "visualIdentity", "socialMediaDesign", "portfolioExamples"],
  redator: ["writingExperience", "contentTypes", "audienceAdaptation", "institutionalContent", "deadlineWriting", "writingSamples"],
  fotografo: ["photoExperience", "photoEquipment", "photoEditing", "eventCoverage", "composition", "portfolioExamples"],
  videografo: ["videoExperience", "videoTools", "videoEquipment", "videoEventCoverage", "visualStorytelling", "portfolioExamples"],
  rp: ["publicRelationsExperience", "contactManagement", "externalCommunication", "delicateSituation", "rpScenario"],
  especialistaCurriculo: ["academicBackground", "technicalSkills", "educationCurriculumExperience", "contentDevelopment", "academicProfessionalGoals"],
  coordenadorPedagogico: ["academicBackground", "pedagogicalExperience", "educationalPlanning", "studentFollowUp", "pedagogicalProblemSolving"],
  tecnicoAvaliacaoMonitoria: ["evaluationExperience", "dataAnalysis", "indicators", "reporting", "monitoringTools"],
  tecnicoMateriaisDidaticos: ["educationalMaterialsExperience", "materialsTools", "contentOrganization", "audienceAdaptation", "creativeMaterials"],
  assistenteAdministrativo: ["administrativeExperience", "officeTools", "taskManagement", "professionalCommunication", "detailAttention"],
  eventos: ["eventOrganizationExperience", "eventLogistics", "eventPressure", "eventProblemSolving", "teamworkInstructions"],
  secretario: ["secretariatExperience", "agendaManagement", "minutesDocuments", "informationManagement", "taskFollowUp"]
};
const QUESTION_LABELS = {
  motivation: "Por que gostaria de fazer parte da Model UN Academy Luanda Chapter?",
  fit: "Por que acha que é a pessoa certa para este cargo?",
  availability: "Consegue participar regularmente das reuniões?",
  schoolApproach: "Como abordaria um diretor de escola para apresentar a Model UN Academy e conseguir estabelecer uma parceria?",
  institutionalCommunication: "Como garantiria uma comunicação institucional clara e profissional com escolas?",
  schoolPartnershipFollowUp: "Como acompanharia uma escola depois do primeiro contacto para manter a parceria ativa?",
  previousExperience: "Que experiência anterior tem em contacto com escolas, clubes estudantis, associações ou projetos educativos?",
  universityApproach: "Como abordaria uma universidade para apresentar a Model UN Academy e estabelecer uma parceria?",
  universityRelations: "Que experiência ou contacto tem com universidades, associações académicas ou grupos estudantis?",
  partnershipBuilding: "Como ajudaria a construir uma parceria útil para estudantes universitários?",
  institutionalFollowUp: "Como acompanharia contactos institucionais para garantir continuidade e resposta?",
  partnerIdentification: "Como identificaria potenciais parceiros para a Model UN Academy?",
  institutionalApproach: "Como faria uma abordagem institucional a um potencial parceiro?",
  proposalBuilding: "Como ajudaria a construir uma proposta de parceria clara e convincente?",
  relationshipMaintenance: "Como manteria uma relação profissional com parceiros depois da parceria iniciada?",
  diasporaCommunication: "Como comunicaria com jovens angolanos ou comunidades angolanas no exterior?",
  networkBuilding: "Como construiria uma rede de contactos na diáspora para apoiar oportunidades internacionais?",
  representationExperience: "Que experiência tem com comunidades, organizações, grupos estudantis ou representação institucional?",
  internationalOpportunityChallenge: "Qual considera ser o maior desafio para conectar jovens angolanos a oportunidades internacionais?",
  territorialCoordination: "Como organizaria e acompanharia atividades em diferentes províncias?",
  teamLeadership: "Que experiência tem em liderança ou coordenação de pessoas?",
  localProblemSolving: "Como resolveria dificuldades de comunicação, distância ou organização entre equipas locais?",
  activityFollowUp: "Como garantiria acompanhamento regular das atividades e resultados na sua área?",
  designExperience: "Que experiência tem em design gráfico e criação de peças visuais?",
  designTools: "Que ferramentas ou softwares de design domina?",
  visualIdentity: "Como garantiria que as peças respeitam a identidade visual da organização?",
  socialMediaDesign: "Que experiência tem na criação de peças para redes sociais ou materiais institucionais?",
  portfolioExamples: "Indique links ou descreva exemplos do seu portfólio mais relevantes para esta função.",
  writingExperience: "Que experiência tem em redação ou produção de conteúdo?",
  contentTypes: "Que tipos de conteúdo sabe produzir com mais segurança?",
  audienceAdaptation: "Como adapta a linguagem para diferentes públicos?",
  institutionalContent: "Que experiência tem com redes sociais ou conteúdo institucional?",
  deadlineWriting: "Como organiza o seu trabalho para cumprir prazos de escrita e revisão?",
  writingSamples: "Indique links ou descreva exemplos de textos que representem bem a sua escrita.",
  photoExperience: "Que experiência tem em fotografia?",
  photoEquipment: "Que equipamento fotográfico sabe utilizar?",
  photoEditing: "Que experiência tem em edição ou tratamento de fotografias?",
  eventCoverage: "Como faria a cobertura fotográfica de um evento da organização?",
  composition: "Como trabalha composição, enquadramento e seleção das melhores imagens?",
  videoExperience: "Que experiência tem em produção de vídeo?",
  videoTools: "Que ferramentas ou softwares de edição de vídeo domina?",
  videoEquipment: "Que equipamentos sabe utilizar para gravação de vídeo?",
  videoEventCoverage: "Como faria a cobertura audiovisual de um evento da organização?",
  visualStorytelling: "Como contaria uma história através de vídeo curto para redes sociais?",
  publicRelationsExperience: "Que experiência tem em comunicação, relações públicas ou representação institucional?",
  contactManagement: "Como organizaria e acompanharia contactos com pessoas e instituições?",
  externalCommunication: "Como comunicaria externamente em nome da organização mantendo uma imagem profissional?",
  delicateSituation: "Como lidaria com uma situação delicada envolvendo um convidado, parceiro ou participante?",
  rpScenario: "Como apresentaria a Model UN Academy a uma instituição ou convidado que ainda não conhece a organização?",
  academicBackground: "Qual é a sua formação académica e área de formação?",
  technicalSkills: "Que competências técnicas tem para apoiar formação, currículo ou desenvolvimento de conteúdos?",
  educationCurriculumExperience: "Que experiência tem em educação, currículo, formação ou elaboração de conteúdos?",
  contentDevelopment: "Como estruturaria um conteúdo ou sessão de formação para jovens participantes?",
  academicProfessionalGoals: "Quais são os seus objetivos académicos ou profissionais e como se relacionam com esta função?",
  pedagogicalExperience: "Que experiência tem em pedagogia, tutoria, formação ou acompanhamento de estudantes?",
  educationalPlanning: "Como planearia e acompanharia uma atividade educativa?",
  studentFollowUp: "Como acompanharia estudantes ou equipas com diferentes níveis de preparação?",
  pedagogicalProblemSolving: "Como resolveria um problema durante uma formação ou atividade pedagógica?",
  evaluationExperience: "Que experiência tem com avaliação, monitoria ou acompanhamento de resultados?",
  dataAnalysis: "Como faria a recolha e análise de dados de uma atividade da organização?",
  indicators: "Que indicadores usaria para acompanhar o impacto de uma formação ou evento?",
  reporting: "Que experiência tem na elaboração de relatórios ou apresentação de resultados?",
  monitoringTools: "Que ferramentas informáticas sabe usar para organizar dados e acompanhar atividades?",
  educationalMaterialsExperience: "Que experiência tem na produção de materiais educativos ou pedagógicos?",
  materialsTools: "Que ferramentas utiliza para elaborar ou organizar materiais didáticos?",
  contentOrganization: "Como organizaria um conteúdo para que fosse claro e útil para estudantes?",
  creativeMaterials: "Como combina criatividade e rigor na preparação de materiais didáticos?",
  administrativeExperience: "Que experiência tem em organização administrativa ou gestão de documentos?",
  officeTools: "Que ferramentas de escritório sabe utilizar?",
  taskManagement: "Como organiza tarefas, prazos e informações para não perder detalhes importantes?",
  professionalCommunication: "Como garantiria uma comunicação profissional em mensagens, documentos e contactos internos?",
  detailAttention: "Conte uma situação em que a sua atenção ao detalhe ajudou a evitar ou resolver um problema.",
  eventOrganizationExperience: "Que experiência tem na organização de eventos?",
  eventLogistics: "Que experiência tem com logística, montagem ou preparação física de eventos?",
  eventPressure: "Como trabalha sob pressão durante a preparação ou realização de um evento?",
  eventProblemSolving: "Como resolveria um problema inesperado durante um evento?",
  teamworkInstructions: "Como trabalha em equipa e segue orientações da pessoa responsável pelo departamento?",
  secretariatExperience: "Que experiência tem em organização, secretaria ou apoio administrativo?",
  agendaManagement: "Como organizaria agendas, reuniões e acompanhamento de tarefas?",
  minutesDocuments: "Que experiência tem na elaboração de atas, documentos ou registos de reunião?",
  informationManagement: "Como garantiria boa gestão de informação interna e atenção ao detalhe?",
  taskFollowUp: "Como acompanharia tarefas pendentes para garantir que nada fica esquecido?"
};
const LUANDA_REQUIRED_JOB_IDS = new Set(["designer", "redator", "fotografo", "videografo", "eventos"]);

function getRequiredQuestionIds(jobKey) {
  return [...COMMON_QUESTION_IDS, ...(QUESTION_IDS_BY_JOB[jobKey] || [])];
}

function validateApplication(body, dossier, jobKey, files = []) {
  if (!jobKey) throw new Error("Cargo não identificado.");
  if (!QUESTION_IDS_BY_JOB[jobKey]) throw new Error("Cargo inválido.");
  const required = ["fullName", "age", "city", "province", "institution", "email", "phone", ...getRequiredQuestionIds(jobKey)];
  required.forEach((field) => {
    if (!String(body[field] || "").trim()) throw new Error(`Campo obrigatório em falta: ${field}`);
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) throw new Error("E-mail inválido.");
  if (!/^9\d{8}$/.test(String(body.phone))) throw new Error("Telefone inválido.");
  if (Number(body.age) < 14 || Number(body.age) > 35) throw new Error("Idade fora do intervalo permitido.");
  if (LUANDA_REQUIRED_JOB_IDS.has(jobKey) && body.luandaAvailability !== "Sim") {
    throw new Error("Este cargo exige disponibilidade presencial em Luanda.");
  }
  if (!LUANDA_REQUIRED_JOB_IDS.has(jobKey) && String(body.luandaAvailability || "").trim()) {
    throw new Error("Disponibilidade presencial em Luanda não se aplica a este cargo.");
  }
  const requiredDocs = Array.isArray(dossier.documents) ? dossier.documents.filter((doc) => doc.required) : [];
  const uploadedDocIds = new Set(files.map((file) => file.fieldname.replace(/^document_/, "")));
  requiredDocs.forEach((doc) => {
    if (!uploadedDocIds.has(doc.id)) throw new Error(`Documento obrigatório em falta: ${doc.name || doc.id}`);
  });
}

function pickApplicationData(body, jobKey) {
  const keys = ["fullName", "age", "city", "province", "institution", "email", "phone", "linkedin", "socials", ...getRequiredQuestionIds(jobKey), "luandaAvailability"];
  return Object.fromEntries(keys.map((key) => [key, String(body[key] || "").trim()]));
}

function buildAnswerRows(body, jobKey) {
  const data = pickApplicationData(body, jobKey);
  const baseRows = [
    ["Nome completo", data.fullName],
    ["Idade", data.age],
    ["Cidade", data.city],
    ["Província", data.province],
    ["Escola / Universidade / Profissão", data.institution],
    ["E-mail", data.email],
    ["Telefone", data.phone],
    ["LinkedIn", data.linkedin || "Não informado"],
    ["Redes sociais", data.socials || "Não informado"]
  ];
  const questionRows = getRequiredQuestionIds(jobKey).map((id) => [QUESTION_LABELS[id] || id, data[id]]);
  if (data.luandaAvailability) questionRows.push(["Disponibilidade presencial em Luanda", data.luandaAvailability]);
  return [...baseRows, ...questionRows].map(([label, answer]) => ({ label, answer: answer || "Não informado" }));
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
      throw new Error(`Documento invÃ¡lido: ${originalName}`);
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
    name: "PDF/dossiÃª da candidatura",
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
    doc.moveDown(0.4).fontSize(14).text("DossiÃª profissional da candidatura", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(`ID: ${record.id}`);
    doc.text(`Cargo: ${record.job.title}`);
    doc.text(`Data: ${record.submittedAtDisplay}`);
    doc.text(`Estado: ${record.state}`);
    doc.moveDown();
    record.answers.forEach((row) => {
      doc.font("Helvetica-Bold").text(`${row.label}:`);
      doc.font("Helvetica").text(String(row.answer || "NÃ£o informado"));
      doc.moveDown(0.45);
    });
    doc.addPage();
    doc.fontSize(14).text("Documentos da candidatura");
    doc.moveDown();
    record.documents.forEach((file) => {
      doc.fontSize(11).text(`${file.name}: ${file.originalName} (${formatBytes(file.size)})`);
    });
    doc.moveDown();
    doc.text(`DestinatÃ¡rios: ${record.routing.recipientEmails.join(", ")}`);
    doc.end();
  });
}

async function sendApplicationEmail(record) {
  try {
    const transporter = createTransporter();
    if (!transporter) throw new Error("SMTP nÃ£o configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e EMAIL_FROM.");
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

async function sendSmtpTestEmail() {
  try {
    const to = process.env.EMAIL_JOAO_PEDRO;
    if (!to) throw new Error("EMAIL_JOAO_PEDRO nÃ£o configurado.");
    const transporter = createTransporter();
    if (!transporter) throw new Error("SMTP nÃ£o configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e EMAIL_FROM.");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Teste SMTP | ${ORGANIZATION_NAME}`,
      text: `Teste de SMTP do sistema de candidaturas da ${ORGANIZATION_NAME}.`,
      html: `<p>Teste de SMTP do sistema de candidaturas da <strong>${escapeHtml(ORGANIZATION_NAME)}</strong>.</p>`
    });
    return {
      ok: true,
      status: EMAIL_DRY_RUN ? "dry_run" : "sent",
      accepted: info.accepted || [],
      rejected: info.rejected || []
    };
  } catch (error) {
    return { ok: false, status: "failed", error: error.message };
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
      <td style="border:1px solid #d8dee9;padding:8px;">${escapeHtml(row.answer || "NÃ£o informado").replaceAll("\n", "<br>")}</td>
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
      <p><strong>DestinatÃ¡rios:</strong> ${escapeHtml(record.routing.recipientEmails.join(", "))}</p>
    </div>
  `;
}

function buildEmailText(record) {
  const rows = record.answers.map((row) => `${row.label}: ${row.answer || "NÃ£o informado"}`).join("\n");
  return `${ORGANIZATION_NAME}\nNova candidatura - ${record.job.title}\n\n${rows}\n\nDocumentos disponÃ­veis por links seguros no e-mail HTML.\nData: ${record.submittedAtDisplay}`;
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
  if (!ADMIN_TOKEN) return res.status(503).json({ error: "ADMIN_TOKEN nÃ£o configurado no servidor." });
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

