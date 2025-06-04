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