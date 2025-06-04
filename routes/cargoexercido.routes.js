// backend/routes/cargoexercido.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
import * as cargoExercidoController from '../controllers/cargoexercido.controller.js';
// Importação correta do seu próprio validador
import { 
  createCargoExercidoRules, 
  updateCargoExercidoRules,
  cargoParamsRule,
  lodgeMemberIdParamRule, // Esta lodgeMemberIdParamRule é do cargoexercido.validator.js
  handleValidationErrors 
} from '../validators/cargoexercido.validator.js'; 

const router = express.Router({ mergeParams: true }); // mergeParams: true é essencial

// Permissões para gerenciar cargos
const canManageMemberCargos = authorizeExtended({
  allowedCredentials: ['Webmaster', 'Diretoria'],
  allowedCargos: ['Venerável Mestre', 'Secretário']
});

// Aplicar middleware de autenticação
router.use(authMiddleware);
// A autorização específica (canManageMemberCargos ou lógica customizada) é aplicada por rota

// POST /api/lodgemembers/:lodgeMemberId/cargos - Adicionar um novo cargo
router.post(
  '/', 
  canManageMemberCargos, // Autorização para criar cargos para outros
  lodgeMemberIdParamRule(), // Valida :lodgeMemberId da URL (do cargoexercido.validator.js)
  createCargoExercidoRules(), // Valida o corpo da requisição (do cargoexercido.validator.js)
  handleValidationErrors,
  cargoExercidoController.addCargoToLodgeMember
);

// GET /api/lodgemembers/:lodgeMemberId/cargos - Listar todos os cargos do maçom especificado
router.get(
  '/', 
  (req, res, next) => { // Lógica de permissão: próprio membro ou admin/diretoria/cargos permitidos
    if (req.user.id === parseInt(req.params.lodgeMemberId, 10)) {
        return next(); // O próprio usuário pode ver seus cargos
    }
    // Senão, aplicar as regras de admin/diretoria/cargos específicos
    return canManageMemberCargos(req, res, next);
  },
  lodgeMemberIdParamRule(), // Valida o :lodgeMemberId da URL (do cargoexercido.validator.js)
  handleValidationErrors,
  cargoExercidoController.getCargosByLodgeMember
);

// GET /api/lodgemembers/:lodgeMemberId/cargos/:cargoId - Obter um cargo específico
router.get(
  '/:cargoId',
  (req, res, next) => { 
    if (req.user.id === parseInt(req.params.lodgeMemberId, 10)) { // O próprio membro pode ver detalhes de seus cargos
        return next();
    }
    return canManageMemberCargos(req, res, next); // Admins/Diretoria/Cargos Específicos podem ver
  },
  cargoParamsRule(), // Valida :lodgeMemberId e :cargoId (do cargoexercido.validator.js)
  handleValidationErrors,
  cargoExercidoController.getCargoExercidoById
);

// PUT /api/lodgemembers/:lodgeMemberId/cargos/:cargoId - Atualizar um cargo específico
router.put(
  '/:cargoId', 
  canManageMemberCargos, // Apenas quem pode gerenciar cargos de outros
  cargoParamsRule(),
  updateCargoExercidoRules(),
  handleValidationErrors,
  cargoExercidoController.updateCargoExercido
);

// DELETE /api/lodgemembers/:lodgeMemberId/cargos/:cargoId - Remover um cargo específico
router.delete(
  '/:cargoId', 
  canManageMemberCargos, // Apenas quem pode gerenciar cargos de outros
  cargoParamsRule(),
  handleValidationErrors,
  cargoExercidoController.deleteCargoExercido
);

export default router;
