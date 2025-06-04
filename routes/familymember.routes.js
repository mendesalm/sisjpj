// backend/routes/familymember.routes.js
import express from 'express';
// Importa todas as exportações nomeadas do controller como um objeto
import * as familyMemberController from '../controllers/familymember.controller.js'; 
import authMiddleware from '../middlewares/auth.middleware.js';
// Importa as funções de validação nomeadas
import {
  familyMemberRules,
  familyMemberIdParamRule,
  handleValidationErrors,
} from '../validators/familyMember.validator.js'; // Certifique-se que o nome do arquivo é familyMember.validator.js

// Cria a instância do router
const router = express.Router();

// Aplica autenticação a todas as rotas de familiares
router.use(authMiddleware);

// POST /api/familymembers - Criar um novo familiar para o maçom logado
router.post(
  '/',
  familyMemberRules(false), // false indica que é para 'criação' (campos obrigatórios)
  handleValidationErrors,
  familyMemberController.createFamilyMember
);

// GET /api/familymembers - Listar todos os familiares do maçom logado
router.get(
  '/', 
  familyMemberController.getFamilyMembersForCurrentUser
);

// GET /api/familymembers/:id - Obter um familiar específico por ID (do maçom logado)
router.get(
  '/:id',
  familyMemberIdParamRule(), // Valida o parâmetro :id
  handleValidationErrors,
  familyMemberController.getFamilyMemberById
);

// PUT /api/familymembers/:id - Atualizar um familiar específico por ID (do maçom logado)
router.put(
  '/:id',
  familyMemberIdParamRule(),
  familyMemberRules(true), // true indica que é para 'atualização' (campos opcionais)
  handleValidationErrors,
  familyMemberController.updateFamilyMember
);

// DELETE /api/familymembers/:id - Deletar um familiar específico por ID (do maçom logado)
router.delete(
  '/:id',
  familyMemberIdParamRule(),
  handleValidationErrors,
  familyMemberController.deleteFamilyMember
);

// Exporta o router como default
export default router; // <<< ESTA LINHA É CRUCIAL
