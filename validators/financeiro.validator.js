// validators/financeiro.validator.js
import { body, param, query, validationResult } from 'express-validator';
import db from '../models/index.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const contaRules = [
    body('nome').notEmpty().withMessage('O nome da conta é obrigatório.').trim().escape(),
    body('tipo').isIn(['Receita', 'Despesa']).withMessage('O tipo da conta deve ser "Receita" ou "Despesa".'),
    body('descricao').optional().trim().escape(),
];

// --- REGRA ADICIONADA ---
export const contaIdParamRule = [
  param('id').isInt({ gt: 0 }).withMessage('O ID da conta na URL deve ser um inteiro positivo.'),
];


export const lancamentoRules = [
  body('descricao').notEmpty().withMessage('Descrição é obrigatória.').trim().escape(),
  body('valor').isDecimal({ decimal_digits: '2' }).withMessage('Valor deve ser um decimal com 2 casas.').toFloat(),
  body('dataLancamento').isISO8601().withMessage('Data do lançamento é obrigatória e deve ser no formato YYYY-MM-DD.').toDate(),
  body('contaId').isInt({ gt: 0 }).withMessage('ID da conta é obrigatório.')
    .custom(async (value) => {
      const conta = await db.Conta.findByPk(value);
      if (!conta) throw new Error('A conta especificada não existe.');
      return true;
    }),
  body('membroId').optional().isInt({ gt: 0 }).withMessage('ID do membro deve ser um inteiro positivo.')
    .custom(async (value) => {
        if(value) {
            const membro = await db.LodgeMember.findByPk(value);
            if (!membro) throw new Error('O membro especificado não existe.');
        }
        return true;
    }),
];

export const relatorioQueryRules = [
    query('mes').notEmpty().isInt({min: 1, max: 12}).withMessage('O mês é obrigatório e deve ser entre 1 e 12.'),
    query('ano').notEmpty().isInt({min: 2000, max: 2100}).withMessage('O ano é obrigatório e deve ser um ano válido.'),
];