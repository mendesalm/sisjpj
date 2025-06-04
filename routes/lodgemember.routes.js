// backend/routes/lodgemember.routes.js
import express from 'express';
import * as lodgeMemberController from '../controllers/lodgemember.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
// CORREÇÃO: Importa apenas de lodgemember.validator.js
import { 
  updateMyProfileRules, 
  createLodgeMemberRules, // Regra para criar um LodgeMember
  updateLodgeMemberByAdminRules,
  lodgeMemberIdParamRule, // Regra para validar o parâmetro :id de LodgeMember
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
    lodgeMemberController.getMyProfile
);

router.put(
    '/me', 
    updateMyProfileRules(), 
    handleValidationErrors, 
    lodgeMemberController.updateMyProfile
);

// --- Rotas Administrativas (Webmaster/Diretoria ou Cargos Específicos) ---
const canManageAllMembers = authorizeExtended({
    allowedCredentials: ['Webmaster', 'Diretoria'],
    allowedCargos: ['Venerável Mestre', 'Secretário']
});

// GET /api/lodgemembers - Listar todos os maçons
router.get(
    '/', 
    canManageAllMembers, 
    lodgeMemberController.getAllLodgeMembers
);

// POST /api/lodgemembers - Criar um novo maçom (função administrativa)
router.post(
    '/', 
    canManageAllMembers, 
    createLodgeMemberRules(), // Usa as regras de criação do lodgemember.validator.js
    handleValidationErrors, 
    lodgeMemberController.createLodgeMember
);

// GET /api/lodgemembers/:id - Obter um maçom específico por ID
router.get(
    '/:id', 
    canManageAllMembers, 
    lodgeMemberIdParamRule(), // Usa lodgeMemberIdParamRule do lodgemember.validator.js
    handleValidationErrors,
    lodgeMemberController.getLodgeMemberById
);

// PUT /api/lodgemembers/:id - Atualizar um maçom específico por ID
router.put(
    '/:id', 
    canManageAllMembers, 
    updateLodgeMemberByAdminRules(), // Usa as regras de update do lodgemember.validator.js
    handleValidationErrors,
    lodgeMemberController.updateLodgeMemberById
);

// DELETE /api/lodgemembers/:id - Deletar um maçom específico por ID
router.delete(
    '/:id', 
    canManageAllMembers, 
    lodgeMemberIdParamRule(), // Usa lodgeMemberIdParamRule do lodgemember.validator.js
    handleValidationErrors,
    lodgeMemberController.deleteLodgeMemberById
);

// --- Montar Rotas Aninhadas para Cargos Exercidos ---
// Todas as rotas definidas em cargoExercidoRoutes serão prefixadas com /api/lodgemembers/:lodgeMemberId/cargos
router.use('/:lodgeMemberId/cargos', cargoExercidoRoutes);

export default router;
