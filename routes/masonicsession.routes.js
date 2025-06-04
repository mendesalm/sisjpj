// backend/routes/masonicsession.routes.js
import express from 'express';
import * as masonicSessionController from '../controllers/masonicsession.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeExtended } from '../middlewares/authorizeExtended.middleware.js';
import { uploadAta } from '../middlewares/upload.middleware.js'; // Seu middleware de upload para atas
import { 
    sessionRules, 
    sessionIdParamRule,
    handleValidationErrors 
} from '../validators/masonicsession.validator.js';

const router = express.Router();

// Permissões para gerenciar sessões
const canManageSessions = authorizeExtended({
  allowedCredentials: ['Webmaster', 'Diretoria'],
  allowedCargos: ['Venerável Mestre', 'Secretário'] // Ajuste conforme necessário
});

// Aplicar autenticação a todas as rotas de sessão
router.use(authMiddleware);

// POST /api/sessions - Criar nova sessão (com upload de ata)
router.post(
  '/',
  canManageSessions,
  uploadAta.single('ataFile'), // 'ataFile' é o nome do campo no formulário para o arquivo da ata
  sessionRules(false), // Regras de validação para criação
  handleValidationErrors,
  masonicSessionController.createSession
);

// GET /api/sessions - Listar todas as sessões
router.get(
    '/', 
    // Para listar, talvez todos os membros logados possam ver, ou apenas alguns cargos/credenciais.
    // Se for para todos os membros logados, apenas authMiddleware é suficiente.
    // Se for restrito, use canManageSessions ou outra configuração de authorizeExtended.
    // Exemplo: Permitir a todos os membros logados visualizarem as sessões
    // Se quiser restringir, descomente a linha abaixo e comente a linha authMiddleware acima do POST.
    // canManageSessions, 
    masonicSessionController.getAllSessions
);

// GET /api/sessions/:id - Obter uma sessão específica
router.get(
    '/:id', 
    // Similar à listagem, defina quem pode ver uma sessão específica
    // canManageSessions, 
    sessionIdParamRule(),
    handleValidationErrors,
    masonicSessionController.getSessionById
);

// PUT /api/sessions/:id - Atualizar uma sessão (com possível upload de nova ata)
router.put(
  '/:id',
  canManageSessions,
  uploadAta.single('ataFile'), // Permite novo upload de ata
  sessionIdParamRule(),
  sessionRules(true), // Regras de validação para atualização
  handleValidationErrors,
  masonicSessionController.updateSession
);

// DELETE /api/sessions/:id - Deletar uma sessão
router.delete(
  '/:id',
  canManageSessions,
  sessionIdParamRule(),
  handleValidationErrors,
  masonicSessionController.deleteSession
);

export default router;