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
  handleValidationErrors
} from '../validators/financeiro.validator.js';

const router = express.Router();

// Protege todas as rotas financeiras com autenticação
router.use(authMiddleware);

// --- Rotas para Plano de Contas ---

// POST /api/financeiro/contas - Criar uma nova conta (Receita/Despesa)
router.post(
    '/contas',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaRules(false),
    handleValidationErrors,
    financeiroController.createConta
);

// GET /api/financeiro/contas - Listar todas as contas do plano
router.get(
    '/contas',
    authorizeByFeature('visualizarRelatorioFinanceiro'), // Reutilizando permissão de visualização
    financeiroController.getAllContas
);

// PUT /api/financeiro/contas/:id - Atualizar uma conta existente
router.put(
    '/contas/:id',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaIdParamRule,
    handleValidationErrors,
    contaRules(true),
    handleValidationErrors,
    financeiroController.updateConta
);

// DELETE /api/financeiro/contas/:id - Deletar uma conta (com validação de segurança no controller)
router.delete(
    '/contas/:id',
    authorizeByFeature('gerenciarPlanoDeContas'),
    contaIdParamRule,
    handleValidationErrors,
    financeiroController.deleteConta
);


// --- Rotas para Lançamentos ---

// POST /api/financeiro/lancamentos - Criar um novo lançamento
router.post(
  '/lancamentos',
  authorizeByFeature('criarLancamentoFinanceiro'),
  lancamentoRules(),
  handleValidationErrors,
  financeiroController.createLancamento
);

// GET /api/financeiro/lancamentos - Listar lançamentos (relatório de extrato)
router.get(
    '/lancamentos',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    financeiroController.getAllLancamentos
);


// --- Rotas para Relatórios ---

// GET /api/financeiro/balancete - Obter o balancete
router.get(
    '/balancete',
    authorizeByFeature('visualizarRelatorioFinanceiro'),
    relatorioQueryRules,
    handleValidationErrors,
    financeiroController.getBalancete
);

// GET /api/financeiro/balancete/pdf - Exportar o balancete em PDF
router.get(
    '/balancete/pdf',
    authorizeByFeature('exportarRelatorioFinanceiro'),
    relatorioQueryRules,
    handleValidationErrors,
    financeiroController.exportBalancetePDF
);

export default router;
