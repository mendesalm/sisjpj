// backend/routes/biblioteca.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// import * as bibliotecaController from '../controllers/biblioteca.controller.js';
// import { uploadLivro } from '../middlewares/upload.middleware.js';
// import { bibliotecaValidationRules, handleValidationErrors } from '../validators/biblioteca.validator.js';

const router = express.Router();

const canManageBiblioteca = authorizeExtended({
  allowedCredentials: ['Webmaster', 'Diretoria'],
  allowedCargos: ['Venerável Mestre', 'Bibliotecário'] // Bibliotecário é apropriado
});

router.use(authMiddleware);
router.use(canManageBiblioteca);

// --- ROTAS CRUD PARA BIBLIOTECA ---

// POST /api/biblioteca
// router.post('/', uploadLivro.single('arquivoLivro'), bibliotecaValidationRules(), handleValidationErrors, bibliotecaController.createLivro);

// GET /api/biblioteca
// router.get('/', bibliotecaController.getAllLivros);

// GET /api/biblioteca/:id
// router.get('/:id', bibliotecaController.getLivroById);

// PUT /api/biblioteca/:id
// router.put('/:id', uploadLivro.single('arquivoLivro'), bibliotecaValidationRules(), handleValidationErrors, bibliotecaController.updateLivro);

// DELETE /api/biblioteca/:id
// router.delete('/:id', bibliotecaController.deleteLivro);

export default router;