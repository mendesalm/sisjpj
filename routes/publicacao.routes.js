// backend/routes/publicacao.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// import * as publicacaoController from '../controllers/publicacao.controller.js';
// import { uploadPublicacao } from '../middlewares/upload.middleware.js';
// import { publicacaoValidationRules, handleValidationErrors } from '../validators/publicacao.validator.js';

const router = express.Router();

const canManagePublicacoes = authorizeExtended({
  allowedCredentials: ['Webmaster', 'Diretoria'],
  allowedCargos: ['Venerável Mestre', 'Secretário', 'Orador'] // Exemplo, Orador pode ser relevante
});

router.use(authMiddleware);
router.use(canManagePublicacoes);

// --- ROTAS CRUD PARA PUBLICAÇÕES ---

// POST /api/publicacoes
// router.post('/', uploadPublicacao.single('arquivoPublicacao'), publicacaoValidationRules(), handleValidationErrors, publicacaoController.createPublicacao);

// GET /api/publicacoes
// router.get('/', publicacaoController.getAllPublicacoes);

// GET /api/publicacoes/:id
// router.get('/:id', publicacaoController.getPublicacaoById);

// PUT /api/publicacoes/:id
// router.put('/:id', uploadPublicacao.single('arquivoPublicacao'), publicacaoValidationRules(), handleValidationErrors, publicacaoController.updatePublicacao);

// DELETE /api/publicacoes/:id
// router.delete('/:id', publicacaoController.deletePublicacao);

export default router;