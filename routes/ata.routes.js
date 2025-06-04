// backend/routes/ata.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// import * as ataController from '../controllers/ata.controller.js';
// import { uploadAta } from '../middlewares/upload.middleware.js';
// import { ataValidationRules, handleValidationErrors } from '../validators/ata.validator.js';

const router = express.Router();

const canManageAtas = authorizeExtended({
  allowedCredentials: ['Webmaster', 'Diretoria'],
  allowedCargos: ['Venerável Mestre', 'Secretário'] // Secretário é um bom candidato aqui
});

router.use(authMiddleware);
router.use(canManageAtas);

// --- ROTAS CRUD PARA ATAS ---

// GET /api/atas - Listar todas as atas
// router.get('/', ataController.getAllAtas);

// GET /api/atas/:id - Obter uma ata específica
// router.get('/:id', ataController.getAtaById);

// POST /api/atas - Criar uma nova ata (pode ser mais comum via rota de sessão)
// router.post('/', uploadAta.single('ataFile'), ataValidationRules(), handleValidationErrors, ataController.createAta);

// PUT /api/atas/:id - Atualizar metadados de uma ata ou substituir arquivo
// router.put('/:id', uploadAta.single('ataFile'), ataValidationRules(), handleValidationErrors, ataController.updateAta);

// DELETE /api/atas/:id - Deletar uma ata (cuidado com a sessão associada)
// router.delete('/:id', ataController.deleteAta);

export default router;