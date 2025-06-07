// controllers/dashboard.controller.js
import db from '../models/index.js';
const { LodgeMember, Evento, FamilyMember, Emprestimo, Lancamento, Conta, Sequelize } = db;
const { Op, fn, col, literal } = Sequelize;

// --- Funções Auxiliares para buscar os dados ---

const getResumoFinanceiroMesAtual = async () => {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const totalReceitas = await Lancamento.sum('valor', {
    where: { dataLancamento: { [Op.between]: [primeiroDia, ultimoDia] } },
    include: [{ model: Conta, as: 'conta', where: { tipo: 'Receita' } }]
  }) || 0;

  const totalDespesas = await Lancamento.sum('valor', {
    where: { dataLancamento: { [Op.between]: [primeiroDia, ultimoDia] } },
    include: [{ model: Conta, as: 'conta', where: { tipo: 'Despesa' } }]
  }) || 0;

  return {
    periodo: hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
  };
};

const getProximosAniversariantes = async (dias = 7) => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + dias);

    const membros = await LodgeMember.findAll({ where: { Situacao: 'Ativo' }, attributes: ['NomeCompleto', 'DataNascimento'] });
    const familiares = await FamilyMember.findAll({ include: [{model: LodgeMember, attributes: ['NomeCompleto'], required: true}] });

    const todos = [
        ...membros.map(m => ({ nome: m.NomeCompleto, data: m.DataNascimento, tipo: 'Membro' })),
        ...familiares.map(f => ({ nome: f.nomeCompleto, data: f.dataNascimento, tipo: `Familiar (${f.parentesco})` }))
    ];

    return todos.filter(pessoa => {
        if (!pessoa.data) return false;
        const aniversario = new Date(pessoa.data);
        aniversario.setFullYear(hoje.getFullYear()); // Normaliza o ano para o ano corrente
        // Se o aniversário já passou este ano, verifica para o próximo
        if (aniversario < hoje) {
            aniversario.setFullYear(hoje.getFullYear() + 1);
        }
        return aniversario >= hoje && aniversario <= dataLimite;
    }).map(pessoa => ({
        nome: pessoa.nome,
        data: new Date(pessoa.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        tipo: pessoa.tipo
    })).sort((a,b) => new Date(a.data) - new Date(b.data));
};

const getProximosEventos = async (dias = 7) => {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + dias);
  return await Evento.findAll({
    where: { dataHoraInicio: { [Op.between]: [hoje, dataLimite] } },
    order: [['dataHoraInicio', 'ASC']],
    limit: 5, // Limita a 5 próximos eventos
    attributes: ['id', 'titulo', 'dataHoraInicio', 'local']
  });
};

const getEmprestimosPendentes = async (membroId) => {
  return await Emprestimo.findAll({
    where: { membroId, dataDevolucaoReal: null },
    include: [{ model: db.Biblioteca, as: 'livro', attributes: ['id', 'titulo'] }],
    order: [['dataDevolucaoPrevista', 'ASC']]
  });
};

// --- Controller Principal do Dashboard ---

export const getDashboardData = async (req, res) => {
  try {
    const { credencialAcesso, id: membroId } = req.user;
    let dashboardData = {};

    // Dados comuns a todos os perfis
    const proximosEventos = await getProximosEventos();

    if (credencialAcesso === 'Webmaster' || credencialAcesso === 'Diretoria') {
      // Dashboard Administrativo
      const [resumoFinanceiro, totalMembros, proximosAniversariantes] = await Promise.all([
        getResumoFinanceiroMesAtual(),
        LodgeMember.count({ where: { Situacao: 'Ativo' } }),
        getProximosAniversariantes(15) // Mostra aniversariantes dos próximos 15 dias
      ]);

      dashboardData = {
        tipo: 'admin',
        resumoFinanceiro,
        totalMembros,
        proximosAniversariantes,
        proximosEventos,
      };
    } else {
      // Dashboard do Membro Comum
      const emprestimosPendentes = await getEmprestimosPendentes(membroId);

      dashboardData = {
        tipo: 'membro',
        emprestimosPendentes,
        proximosEventos,
      };
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Erro ao gerar dados do dashboard:", error);
    res.status(500).json({ message: "Erro ao gerar dados do dashboard.", errorDetails: error.message });
  }
};
