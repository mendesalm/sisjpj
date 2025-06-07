// routes/financeiro.routes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authorizeByFeature } from '../middlewares/authorizeByFeature.middleware.js';
import * as financeiroController from '../controllers/financeiro.controller.js';
import {
  contaRules,
  lancamentoRules,
  relatorioQueryRules,
  contaIdParamRule,
  orcamentoRules, // <-- Importado
  orcamentoQueryRules, // <-- Importado
  handleValidationErrors
} from '../validators/financeiro.validator.js';

const router = express.Router();

// Protege todas as rotas financeiras com autenticação
router.use(authMiddleware);

// --- Rotas para Plano de Contas ---
router.post(
    '/contas',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaRules(false),
    handleValidationErrors,
    financeiroController.createConta
);

router.get(
    '/contas',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    financeiroController.getAllContas
);

router.put(
    '/contas/:id',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaIdParamRule,
    handleValidationErrors,
    contaRules(true),
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
  lancamentoRules(),
  handleValidationErrors,
  financeiroController.createLancamento
);

router.get(
    '/lancamentos',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    financeiroController.getAllLancamentos
);


// --- Rotas para Orçamento ---
router.post(
  '/orcamentos',
  authorizeByFeature('gerenciarOrcamento'),
  orcamentoRules,
  handleValidationErrors,
  financeiroController.setOrcamento
);

router.get(
  '/relatorios/orcamentario',
  authorizeByFeature('visualizarRelatorioOrcamentario'),
  orcamentoQueryRules,
  handleValidationErrors,
  financeiroController.getRelatorioOrcamentario
);


// --- Rotas para Relatórios ---
router.get(
    '/balancete',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    relatorioQueryRules,
    handleValidationErrors,
    financeiroController.getBalancete
);

router.get(
    '/balancete/pdf',
    authorizeByFeature('exportarRelatorioFinanceiro'),
    relatorioQueryRules,
    handleValidationErrors,
    financeiroController.exportBalancetePDF
);

export default router;
