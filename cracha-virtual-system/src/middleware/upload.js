const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- FUNÇÕES AUXILIARES (DEFINIDAS UMA VEZ) ---

// Garante que um diretório exista, senão o cria.
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Filtra arquivos para aceitar apenas imagens.
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
  }
};

// --- CONFIGURAÇÃO PARA FOTOS DE PERFIL ---
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profiles";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Usa o ID do usuário (se logado) para um nome mais descritivo
    const userId = req.user?.id || "new-user";
    const uniqueSuffix = `${userId}-${Date.now()}`;
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// CORREÇÃO: O nome do campo agora é 'profilePhoto', correspondendo ao frontend.
const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
}).single("profilePhoto");

// --- CONFIGURAÇÃO PARA TEMPLATES DE CRACHÁ DE EVENTO ---
const badgeTemplateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/badge-templates";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.params.id}-${Date.now()}`;
    cb(
      null,
      `event-template-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const uploadBadgeTemplate = multer({
  storage: badgeTemplateStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
}).single("badgeTemplate");

// --- CONFIGURAÇÃO PARA IMAGENS DE INSÍGNIAS (PREMIAÇÕES) ---
const insigniaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/insignias";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `insignia-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadInsignia = multer({
  storage: insigniaStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB
}).single("imageUrl");

// REMOVIDO: A configuração genérica 'storage' e 'upload' foi removida
// para evitar confusão e bugs, favorecendo as configurações específicas acima.

// MANTIDO: O middleware de tratamento de erros é útil.
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Arquivo muito grande." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      // Mensagem mais clara para o usuário final
      return res.status(400).json({
        error:
          "Ocorreu um erro com o campo do arquivo. Verifique o nome do campo.",
      });
    }
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

// NOVO: Storage para templates de certificados (PDFs)
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/certificates";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `cert-template-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: imageFileFilter, // <-- ALTERADO AQUI (usando o mesmo filtro de imagem do crachá)
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
}).single("certificateTemplate");

// --- NOVO STORAGE PARA CAPAS DE EVENTO ---
const eventThumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/events/"; // Salva em /uploads/events/
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // timestamp-id_do_evento-nome_original.ext
    const uniqueSuffix = Date.now() + "-" + req.params.id;
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

// Middleware de upload para capas
const uploadEventThumbnail = multer({
  storage: eventThumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    // Filtro para aceitar apenas imagens
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Erro: Apenas arquivos de imagem são permitidos!"));
  },
}).single("eventThumbnail"); // 'eventThumbnail' é o nome do campo no FormData

// --- CONFIGURAÇÃO PARA FOTOS DE PALESTRANTE ---
const speakerPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/speakers/";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + req.params.id;
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

const uploadSpeakerPhoto = multer({
  storage: speakerPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Erro: Apenas arquivos de imagem são permitidos!"));
  },
}).single("speakerPhoto"); // Campo 'speakerPhoto'

// --- NOVO STORAGE PARA APRESENTAÇÕES (PDF/PPT) ---
const presentationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/presentations/";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `presentation-${uniqueSuffix}${extension}`);
  },
});

const uploadPresentation = multer({
  storage: presentationStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|ppt|pptx/;
    const mimetype = file.mimetype.includes("pdf") ||
      file.mimetype.includes("powerpoint") ||
      file.mimetype.includes("presentationml");
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error("Erro: Apenas arquivos PDF ou PPT são permitidos!"));
  },
}).single("presentation");

module.exports = {
  uploadProfilePhoto,
  uploadBadgeTemplate,
  uploadInsignia,
  handleUploadError,
  uploadCertificate,
  uploadEventThumbnail,
  uploadSpeakerPhoto,
  uploadPresentation,
};
