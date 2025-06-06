// controllers/financeiro.controller.js
import db from '../models/index.js';
const { Lancamento, Conta, LodgeMember, Sequelize } = db;
const { Op } = Sequelize;

// --- CRUD para o Plano de Contas ---

export const createConta = async (req, res) => {
    try {
        const novaConta = await Conta.create(req.body);
        res.status(201).json(novaConta);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Erro de validação ou nome da conta já existe.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
        }
        res.status(500).json({ message: 'Erro ao criar conta.', errorDetails: error.message });
    }
};

export const getAllContas = async (req, res) => {
    try {
        const contas = await Conta.findAll({ order: [['tipo', 'ASC'], ['nome', 'ASC']] });
        res.status(200).json(contas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar contas.', errorDetails: error.message });
    }
};

// --- FUNÇÃO ADICIONADA ---
// Atualizar uma conta existente
export const updateConta = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Conta.update(req.body, { where: { id: id } });
        if (!updated) {
            return res.status(404).json({ message: 'Conta não encontrada.' });
        }
        const updatedConta = await Conta.findByPk(id);
        res.status(200).json(updatedConta);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Erro de validação ou nome da conta já existe.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
        }
        res.status(500).json({ message: 'Erro ao atualizar conta.', errorDetails: error.message });
    }
};

// --- FUNÇÃO ADICIONADA ---
// Deletar uma conta do plano de contas
export const deleteConta = async (req, res) => {
    try {
        const { id } = req.params;
        // Regra de Negócio: Verificar se a conta tem lançamentos associados antes de deletar.
        const lancamentosCount = await Lancamento.count({ where: { contaId: id } });
        if (lancamentosCount > 0) {
            return res.status(409).json({ // 409 Conflict é um status apropriado aqui
                message: `Não é possível deletar esta conta, pois ela já possui ${lancamentosCount} lançamento(s) associado(s).`
            });
        }

        const deleted = await Conta.destroy({ where: { id: id } });
        if (!deleted) {
            return res.status(404).json({ message: 'Conta não encontrada.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar conta.', errorDetails: error.message });
    }
};


// --- CRUD para Lançamentos ---

export const createLancamento = async (req, res) => {
  const { descricao, valor, dataLancamento, contaId, membroId, comprovanteUrl } = req.body;
  const criadoPorId = req.user.id;

  try {
    const novoLancamento = await Lancamento.create({
      descricao, valor, dataLancamento, contaId,
      membroId: membroId || null,
      comprovanteUrl: comprovanteUrl || null,
      criadoPorId
    });
    res.status(201).json(novoLancamento);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar lançamento.', errorDetails: error.message });
  }
};

export const getAllLancamentos = async (req, res) => {
  const { mes, ano, tipo, contaId } = req.query;
  const whereClause = {};

  if (mes && ano) {
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 0);
    whereClause.dataLancamento = { [Op.between]: [startDate, endDate] };
  }
  if (contaId) {
      whereClause.contaId = contaId;
  }
  
  const includeContaWhere = {};
  if (tipo) {
      includeContaWhere.tipo = tipo;
  }

  try {
    const lancamentos = await Lancamento.findAll({
      where: whereClause,
      include: [
        { model: Conta, as: 'conta', where: includeContaWhere, required: true },
        { model: LodgeMember, as: 'membroAssociado', attributes: ['id', 'NomeCompleto'], required: false },
        { model: LodgeMember, as: 'criadoPor', attributes: ['id', 'NomeCompleto'], required: false }
      ],
      order: [['dataLancamento', 'DESC']],
    });
    res.status(200).json(lancamentos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar lançamentos.', errorDetails: error.message });
  }
};

// --- Relatórios ---

export const getBalancete = async (req, res) => {
    const { mes, ano } = req.query;
    if (!mes || !ano) {
        return res.status(400).json({ message: 'Mês e ano são obrigatórios para gerar o balancete.' });
    }
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 0);

    try {
        const totalReceitas = await Lancamento.sum('valor', {
            where: { dataLancamento: { [Op.between]: [startDate, endDate] } },
            include: [{ model: Conta, as: 'conta', where: { tipo: 'Receita' } }]
        });
        const totalDespesas = await Lancamento.sum('valor', {
            where: { dataLancamento: { [Op.between]: [startDate, endDate] } },
            include: [{ model: Conta, as: 'conta', where: { tipo: 'Despesa' } }]
        });
        const saldo = (totalReceitas || 0) - (totalDespesas || 0);

        res.status(200).json({
            periodo: `${String(mes).padStart(2, '0')}/${ano}`,
            totalReceitas: totalReceitas || 0,
            totalDespesas: totalDespesas || 0,
            saldo: saldo
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar balancete.', errorDetails: error.message });
    }
}