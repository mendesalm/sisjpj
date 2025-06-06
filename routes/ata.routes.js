// backend/routes/ata.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as ataController from '../controllers/ata.controller.js'; // Descomentado
import { uploadAta } from '../middlewares/upload.middleware.js'; // Descomentado
import {
  updateAtaRules,
  ataIdParamRule,
  handleValidationErrors // Importar para uso explícito
} from '../validators/ata.validator.js'; // Descomentado

const router = express.Router();

router.use(authMiddleware);

// GET /api/atas - Listar todas as atas
router.get(
  '/',
  authorizeByFeature('listarTodasAsAtas'),
  ataController.getAllAtas
);

// GET /api/atas/:id - Obter uma ata específica
router.get(
  '/:id',
  authorizeByFeature('visualizarDetalhesAta'),
  ataIdParamRule,
  handleValidationErrors,
  ataController.getAtaById
);

// PUT /api/atas/:id - Atualizar metadados de uma ata ou substituir arquivo
router.put(
  '/:id',
  // A funcionalidade pode ser 'editarMetadadosAta' ou 'substituirArquivoAta'
  // Se forem separadas, precisaria de lógica condicional ou duas rotas.
  // Por simplicidade, vamos usar uma funcionalidade genérica para edição:
  authorizeByFeature('editarMetadadosAta'), // Ou uma mais específica como 'gerenciarAtaExistente'
  uploadAta.single('ataFile'), // 'ataFile' é o nome do campo no formulário
  updateAtaRules,
  handleValidationErrors,
  ataController.updateAta
);

// DELETE /api/atas/:id - Deletar uma ata
// Como discutido no controller, esta rota é problemática e está desabilitada por padrão no controller.
// Se decidir habilitá-la, use uma funcionalidade bem restrita.
router.delete(
  '/:id',
  authorizeByFeature('deletarAtaIndividualmente'), // Funcionalidade com permissão muito restrita
  ataIdParamRule,
  handleValidationErrors,
  ataController.deleteAta
);

// POST /api/atas - Criar uma nova ata (GERALMENTE NÃO USADO, pois atas são criadas com Sessões)
// Se você realmente precisa deste endpoint, o modelo Ata e sua relação com MasonicSession precisariam ser revistos.
// Por enquanto, manteremos comentado, pois não se alinha com a estrutura atual de dados (Ata requer sessionId).
/*
router.post(
  '/',
  authorizeByFeature('criarAtaAvulsa'), // Necessitaria desta funcionalidade
  uploadAta.single('ataFile'),
  // ataValidationRules(), // Precisaria de regras de criação
  handleValidationErrors,
  ataController.createAta // Precisaria desta função no controller
);
*/

export default router;