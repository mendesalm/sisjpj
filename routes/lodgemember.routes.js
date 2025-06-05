// backend/routes/lodgemember.routes.js
import express from 'express';
import * as lodgeMemberController from '../controllers/lodgemember.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
// Importa o novo middleware de autorização por funcionalidade
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js'; // Você precisará criar este arquivo como discutido
// Os validadores permanecem os mesmos
import {
  updateMyProfileRules,
  createLodgeMemberRules,
  updateLodgeMemberByAdminRules,
  lodgeMemberIdParamRule,
  handleValidationErrors
} from '../validators/lodgemember.validator.js';

// Importa as rotas de CargoExercido para aninhar
import cargoExercidoRoutes from './cargoexercido.routes.js';

const router = express.Router();

// Aplica o middleware de autenticação a todas as rotas definidas neste arquivo
router.use(authMiddleware);

// --- Rotas de Auto-serviço para o Maçom Logado (/me) ---
router.get(
    '/me',
    authorizeByFeature('visualizarProprioPerfil'), // <-- Nova autorização
    lodgeMemberController.getMyProfile
);

router.put(
    '/me',
    authorizeByFeature('editarProprioPerfil'), // <-- Nova autorização
    updateMyProfileRules(),
    handleValidationErrors,
    lodgeMemberController.updateMyProfile
);

// --- Rotas Administrativas (Controladas por FuncionalidadePermissoes) ---

// GET /api/lodgemembers - Listar todos os maçons
router.get(
    '/',
    authorizeByFeature('listarTodosOsMembros'), // <-- Nova autorização
    lodgeMemberController.getAllLodgeMembers
);

// POST /api/lodgemembers - Criar um novo maçom (função administrativa)
router.post(
    '/',
    authorizeByFeature('criarNovoMembroPeloAdmin'), // <-- Nova autorização
    createLodgeMemberRules(),
    handleValidationErrors,
    lodgeMemberController.createLodgeMember
);

// GET /api/lodgemembers/:id - Obter um maçom específico por ID
router.get(
    '/:id',
    authorizeByFeature('visualizarMembroPorAdmin'), // <-- Nova autorização
    lodgeMemberIdParamRule(),
    handleValidationErrors,
    lodgeMemberController.getLodgeMemberById
);

// PUT /api/lodgemembers/:id - Atualizar um maçom específico por ID
router.put(
    '/:id',
    authorizeByFeature('editarMembroPorAdmin'), // <-- Nova autorização
    updateLodgeMemberByAdminRules(),
    handleValidationErrors,
    lodgeMemberController.updateLodgeMemberById
);

// DELETE /api/lodgemembers/:id - Deletar um maçom específico por ID
router.delete(
    '/:id',
    authorizeByFeature('deletarMembroPorAdmin'), // <-- Nova autorização
    lodgeMemberIdParamRule(),
    handleValidationErrors,
    lodgeMemberController.deleteLodgeMemberById
);

// --- Montar Rotas Aninhadas para Cargos Exercidos ---
// Todas as rotas definidas em cargoExercidoRoutes serão prefixadas com /api/lodgemembers/:lodgeMemberId/cargos
// A autorização para estas rotas será tratada dentro de 'cargoexercido.routes.js'
router.use('/:lodgeMemberId/cargos', cargoExercidoRoutes);

export default router;