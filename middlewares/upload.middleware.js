// backend/middlewares/upload.middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuração para Upload de Atas ---
const ataStoragePath = path.join(__dirname, '..', 'uploads', 'atas');

// Garante que o diretório de upload para atas exista
if (!fs.existsSync(ataStoragePath)) {
  fs.mkdirSync(ataStoragePath, { recursive: true });
  console.log(`Diretório de upload para atas criado em: ${ataStoragePath}`);
}

const ataDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ataStoragePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const ataFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Tipo de arquivo não suportado para atas! Apenas PDF, DOC, DOCX são permitidos.'), false);
};

export const uploadAta = multer({ 
  storage: ataDiskStorage,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limite de 10MB
  },
  fileFilter: ataFileFilter
});


// --- Exemplo: Configuração para Upload de Publicações ---
const publicacaoStoragePath = path.join(__dirname, '..', 'uploads', 'publicacoes');
if (!fs.existsSync(publicacaoStoragePath)) {
  fs.mkdirSync(publicacaoStoragePath, { recursive: true });
  console.log(`Diretório de upload para publicações criado em: ${publicacaoStoragePath}`);
}
const publicacaoDiskStorage = multer.diskStorage({ /* ... configuração similar ... */ });
const publicacaoFileFilter = (req, file, cb) => { /* ... filtro para publicações ... */ };
export const uploadPublicacao = multer({ storage: publicacaoDiskStorage, /* limits, fileFilter */ });


// --- Exemplo: Configuração para Upload de Livros (Biblioteca) ---
const bibliotecaStoragePath = path.join(__dirname, '..', 'uploads', 'biblioteca');
if (!fs.existsSync(bibliotecaStoragePath)) {
  fs.mkdirSync(bibliotecaStoragePath, { recursive: true });
  console.log(`Diretório de upload para biblioteca criado em: ${bibliotecaStoragePath}`);
}
const bibliotecaDiskStorage = multer.diskStorage({ /* ... configuração similar ... */ });
const bibliotecaFileFilter = (req, file, cb) => { /* ... filtro para livros (ex: PDF, EPUB) ... */ };
export const uploadLivro = multer({ storage: bibliotecaDiskStorage, /* limits, fileFilter */ });

// Adicione outras configurações de upload conforme necessário
// backend/middlewares/upload.middleware.js
// ... (código existente para uploadAta, uploadPublicacao, uploadLivro) ...

// --- Configuração para Upload de Áudios (Harmonia) ---
const harmoniaStoragePath = path.join(__dirname, '..', 'uploads', 'harmonia');

// Garante que o diretório de upload para áudios da harmonia exista
if (!fs.existsSync(harmoniaStoragePath)) {
  fs.mkdirSync(harmoniaStoragePath, { recursive: true });
  console.log(`Diretório de upload para áudios da harmonia criado em: ${harmoniaStoragePath}`);
}

const harmoniaDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, harmoniaStoragePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Preserva o nome original do arquivo um pouco mais, mas ainda garante unicidade
    cb(null, `harmonia-${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const harmoniaFileFilter = (req, file, cb) => {
  // Tipos de arquivo de áudio comuns
  const allowedTypes = /mpeg|mp3|wav|aac|ogg|m4a|flac|wma/; // Adicionado flac, wma
  const mimetype = allowedTypes.test(file.mimetype);
  // Verifique também a extensão, pois o mimetype pode ser genérico como 'application/octet-stream'
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) { // Permitir se mimetype OU extname corresponderem
    return cb(null, true);
  }
  cb(new Error('Tipo de arquivo não suportado para harmonia! Apenas áudios (MP3, WAV, AAC, OGG, M4A, FLAC, WMA) são permitidos.'), false);
};

export const uploadAudio = multer({
  storage: harmoniaDiskStorage,
  limits: {
    fileSize: 1024 * 1024 * 50 // Limite de 50MB para arquivos de áudio (ajuste conforme necessário)
  },
  fileFilter: harmoniaFileFilter
});

// ... (resto do seu arquivo upload.middleware.js)