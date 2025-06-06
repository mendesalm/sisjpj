// backend/routes/lodgemember.routes.js
import express from 'express';
import * as lodgeMemberController from '../controllers/lodgemember.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
// Importa o novo middleware de autorização por funcionalidade
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
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
// Importa as rotas de Condecorações para aninhar
import condecoracaoRoutes from './condecoracao.routes.js';

const router = express.Router();

// Aplica o middleware de autenticação a todas as rotas definidas neste arquivo
router.use(authMiddleware);

// --- Rotas de Auto-serviço para o Maçom Logado (/me) ---
router.get(
    '/me',
    authorizeByFeature('visualizarProprioPerfil'),
    lodgeMemberController.getMyProfile
);

router.put(
    '/me',
    authorizeByFeature('editarProprioPerfil'),
    updateMyProfileRules(),
    handleValidationErrors,
    lodgeMemberController.updateMyProfile
);

// --- Rotas Administrativas (Controladas por FuncionalidadePermissoes) ---

// GET /api/lodgemembers - Listar todos os maçons
router.get(
    '/',
    authorizeByFeature('listarTodosOsMembros'),
    lodgeMemberController.getAllLodgeMembers
);

// POST /api/lodgemembers - Criar um novo maçom (função administrativa)
router.post(
    '/',
    authorizeByFeature('criarNovoMembroPeloAdmin'),
    createLodgeMemberRules(),
    handleValidationErrors,
    lodgeMemberController.createLodgeMember
);

// GET /api/lodgemembers/:id - Obter um maçom específico por ID
router.get(
    '/:id',
    authorizeByFeature('visualizarDetalhesDeMembroPorAdmin'),
    lodgeMemberIdParamRule(),
    handleValidationErrors,
    lodgeMemberController.getLodgeMemberById
);

// PUT /api/lodgemembers/:id - Atualizar um maçom específico por ID
router.put(
    '/:id',
    authorizeByFeature('editarMembroPorAdmin'),
    updateLodgeMemberByAdminRules(),
    handleValidationErrors,
    lodgeMemberController.updateLodgeMemberById
);

// DELETE /api/lodgemembers/:id - Deletar um maçom específico por ID
router.delete(
    '/:id',
    authorizeByFeature('deletarMembroPorAdmin'),
    lodgeMemberIdParamRule(),
    handleValidationErrors,
    lodgeMemberController.deleteLodgeMemberById
);

// --- Montar Rotas Aninhadas ---

// Rotas para Cargos Exercidos: /api/lodgemembers/:lodgeMemberId/cargos
router.use('/:lodgeMemberId/cargos', cargoExercidoRoutes);

// Rotas para Condecorações: /api/lodgemembers/:lodgeMemberId/condecoracoes
router.use('/:lodgeMemberId/condecoracoes', condecoracaoRoutes);


export default router;