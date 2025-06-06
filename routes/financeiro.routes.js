// routes/financeiro.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as financeiroController from '../controllers/financeiro.controller.js';
import {
  contaRules,
  lancamentoRules,
  relatorioQueryRules,
  contaIdParamRule, // Importar a nova regra
  handleValidationErrors
} from '../validators/financeiro.validator.js';

const router = express.Router();
router.use(authMiddleware);

// --- Rotas para Plano de Contas ---
router.post(
    '/contas',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaRules,
    handleValidationErrors,
    financeiroController.createConta
);

router.get(
    '/contas',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    financeiroController.getAllContas
);

// --- ROTAS ADICIONADAS ---
router.put(
    '/contas/:id',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaIdParamRule,
    handleValidationErrors,
    contaRules, // Reutiliza as regras para validar o corpo da atualização
    handleValidationErrors,
    financeiroController.updateConta
);

router.delete(
    '/contas/:id',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaIdParamRule,
    handleValidationErrors,
    financeiroController.deleteConta
);

// --- Rotas para Lançamentos ---
router.post(
  '/lancamentos',
  authorizeByFeature('criarLancamentoFinanceiro'),
  lancamentoRules,
  handleValidationErrors,
  financeiroController.createLancamento
);

router.get(
    '/lancamentos',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    financeiroController.getAllLancamentos
);

// --- Rotas para Relatórios ---
router.get(
    '/balancete',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    relatorioQueryRules,
    handleValidationErrors,
    financeiroController.getBalancete
);

export default router;