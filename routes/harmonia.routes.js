// backend/routes/harmonia.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// import * as harmoniaController from '../controllers/harmonia.controller.js';
// import { uploadAudio } from '../middlewares/upload.middleware.js'; // Se houver upload
// import { harmoniaValidationRules, handleValidationErrors } from '../validators/harmonia.validator.js';

const router = express.Router();

const canManageHarmonia = authorizeExtended({
  allowedCredentials: ['Webmaster', 'Diretoria'],
  allowedCargos: ['Venerável Mestre', 'Mestre de Harmonia'] // Mestre de Harmonia é apropriado
});

router.use(authMiddleware);
router.use(canManageHarmonia);

// --- ROTAS CRUD PARA HARMONIA ---

// POST /api/harmonia
// router.post('/', uploadAudio.single('audioFile'), harmoniaValidationRules(), handleValidationErrors, harmoniaController.createHarmonia);

// GET /api/harmonia
// router.get('/', harmoniaController.getAllHarmonia);

// GET /api/harmonia/:id
// router.get('/:id', harmoniaController.getHarmoniaById);

// PUT /api/harmonia/:id
// router.put('/:id', uploadAudio.single('audioFile'), harmoniaValidationRules(), handleValidationErrors, harmoniaController.updateHarmonia);

// DELETE /api/harmonia/:id
// router.delete('/:id', harmoniaController.deleteHarmonia);

export default router;