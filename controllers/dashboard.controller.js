// controllers/dashboard.controller.js
import db from '../models/index.js';
import { getAllowedFeaturesForUser } from '../services/permission.service.js';

const { LodgeMember, Evento, FamilyMember, Emprestimo, Lancamento, Conta, Visita, MasonicSession, CargoExercido, MenuItem, Sequelize } = db;
const { Op, fn, col } = Sequelize;

// --- Funções Auxiliares de Dados Existentes ---

const getResumoFinanceiroMesAtual = async () => {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const totalReceitas = await Lancamento.sum('valor', { where: { dataLancamento: { [Op.between]: [primeiroDia, ultimoDia] } }, include: [{ model: Conta, as: 'conta', where: { tipo: 'Receita' } }] }) || 0;
  const totalDespesas = await Lancamento.sum('valor', { where: { dataLancamento: { [Op.between]: [primeiroDia, ultimoDia] } }, include: [{ model: Conta, as: 'conta', where: { tipo: 'Despesa' } }] }) || 0;
  return { periodo: hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }), totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
};

const getProximosAniversariantes = async (dias = 7) => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + dias);
    const membros = await LodgeMember.findAll({ where: { Situacao: 'Ativo' }, attributes: ['NomeCompleto', 'DataNascimento'] });
    const familiares = await FamilyMember.findAll({ include: [{model: LodgeMember, attributes: ['NomeCompleto'], required: true}] });
    const todos = [ ...membros.map(m => ({ nome: m.NomeCompleto, data: m.DataNascimento, tipo: 'Membro' })), ...familiares.map(f => ({ nome: f.nomeCompleto, data: f.dataNascimento, tipo: `Familiar (${f.parentesco})` })) ];
    return todos.filter(pessoa => {
        if (!pessoa.data) return false;
        const aniversario = new Date(pessoa.data);
        aniversario.setFullYear(hoje.getFullYear());
        if (aniversario < hoje) aniversario.setFullYear(hoje.getFullYear() + 1);
        return aniversario >= hoje && aniversario <= dataLimite;
    }).map(pessoa => ({ nome: pessoa.nome, data: new Date(pessoa.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), tipo: pessoa.tipo })).sort((a,b) => new Date(a.data) - new Date(b.data));
};

const getProximosEventos = async (dias = 7) => {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + dias);
  return await Evento.findAll({ where: { dataHoraInicio: { [Op.between]: [hoje, dataLimite] } }, order: [['dataHoraInicio', 'ASC']], limit: 5, attributes: ['id', 'titulo', 'dataHoraInicio', 'local'] });
};

const getEmprestimosPendentes = async (membroId) => {
  return await Emprestimo.findAll({ where: { membroId, dataDevolucaoReal: null }, include: [{ model: db.Biblioteca, as: 'livro', attributes: ['id', 'titulo'] }], order: [['dataDevolucaoPrevista', 'ASC']] });
};

const getMenuForUser = async (user) => {
    const allowedFeatures = await getAllowedFeaturesForUser(user);
    if (!db.MenuItem) return [];
    return await db.MenuItem.findAll({
        where: { requiredFeature: { [Op.in]: allowedFeatures }, parentId: null },
        include: [{ model: db.MenuItem, as: 'children', where: { requiredFeature: { [Op.in]: allowedFeatures } }, required: false, }],
        order: [['ordem', 'ASC'], [{ model: db.MenuItem, as: 'children' }, 'ordem', 'ASC']]
    });
};

// --- NOVAS Funções Auxiliares para Widgets por Cargo ---

const getWidgetTesoureiro = async () => {
    // Para um widget de "mensalidades pendentes", seria necessário um módulo de tesouraria avançado.
    // Como proxy, vamos contar quantas mensalidades foram pagas no mês atual.
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const contaCapitacao = await Conta.findOne({ where: { nome: 'Capitação Mensal' }});
    let pagamentosMes = 0;
    if (contaCapitacao) {
        pagamentosMes = await Lancamento.count({
            where: { contaId: contaCapitacao.id, dataLancamento: { [Op.between]: [primeiroDia, ultimoDia] } }
        });
    }
    return {
        mensalidadesPagasNoMes: pagamentosMes,
    };
};

const getWidgetSecretario = async () => {
    const hoje = new Date();
    const dataAnterior = new Date();
    dataAnterior.setDate(hoje.getDate() - 90); // Período de 90 dias

    const totalSessoes = await MasonicSession.count({ where: { dataSessao: { [Op.between]: [dataAnterior, hoje] } } });
    let membrosBaixaFrequencia = [];

    if (totalSessoes > 0) {
        const membros = await LodgeMember.findAll({ where: { Situacao: 'Ativo' }, attributes: ['id', 'NomeCompleto'] });
        const presencasCount = await LodgeMember.findAll({
             attributes: ['id', [fn('COUNT', col('sessoesPresente.id')), 'presencas']],
            include: [{ model: MasonicSession, as: 'sessoesPresente', attributes: [], where: { dataSessao: { [Op.between]: [dataAnterior, hoje] } }, required: true }],
            group: ['LodgeMember.id']
        });
        const presencasMap = new Map(presencasCount.map(item => [item.id, parseInt(item.get('presencas'), 10)]));
        
        membros.forEach(membro => {
            const presencas = presencasMap.get(membro.id) || 0;
            const percentual = (presencas / totalSessoes) * 100;
            if (percentual < 50) { // Limite de 50% de frequência
                membrosBaixaFrequencia.push({ nome: membro.NomeCompleto, percentual: percentual.toFixed(2) });
            }
        });
    }

    return {
        membrosBaixaFrequencia,
        totalMembrosBaixaFrequencia: membrosBaixaFrequencia.length
    };
};

const getWidgetChanceler = async () => {
    // Widget simples que mostra quantas visitações foram registadas nos últimos 30 dias
    const hoje = new Date();
    const dataAnterior = new Date();
    dataAnterior.setDate(hoje.getDate() - 30);
    const visitacoesRecentes = await Visita.count({
        where: { createdAt: { [Op.gte]: dataAnterior } }
    });
    return {
        visitacoesRegistradasUltimos30Dias: visitacoesRecentes
    };
};


// --- Controller Principal do Dashboard (ATUALIZADO) ---

export const getDashboardData = async (req, res) => {
  try {
    const { credencialAcesso, id: membroId } = req.user;
    let dashboardData = {};

    // Busca os cargos ativos do utilizador
    const cargosAtivos = (await CargoExercido.findAll({
        where: { lodgeMemberId: membroId, dataFim: null },
        attributes: ['nomeCargo'], raw: true,
    })).map(c => c.nomeCargo);

    // Obtém os dados do menu e os dados resumidos em paralelo
    const [menu, proximosEventos] = await Promise.all([
        getMenuForUser(req.user),
        getProximosEventos()
    ]);

    // Inicializa o objeto de widgets
    const widgetsPorCargo = {};

    // --- Lógica de Widgets por Cargo ---
    if (cargosAtivos.includes('Tesoureiro') || cargosAtivos.includes('Tesoureiro Adjunto')) {
        widgetsPorCargo.tesouraria = await getWidgetTesoureiro();
    }
    if (cargosAtivos.includes('Secretário') || cargosAtivos.includes('Secretário Adjunto')) {
        widgetsPorCargo.secretaria = await getWidgetSecretario();
    }
    if (cargosAtivos.includes('Chanceler') || cargosAtivos.includes('Chanceler Adjunto')) {
        widgetsPorCargo.chancelaria = await getWidgetChanceler();
    }
    // O widget para Mestre de Cerimônias já é coberto pelos "próximos eventos"

    if (credencialAcesso === 'Webmaster' || credencialAcesso === 'Diretoria') {
      // Dashboard Administrativo
      const [resumoFinanceiro, totalMembros, proximosAniversariantes] = await Promise.all([
        getResumoFinanceiroMesAtual(),
        LodgeMember.count({ where: { Situacao: 'Ativo' } }),
        getProximosAniversariantes(15)
      ]);

      dashboardData = {
        tipo: 'admin',
        resumoFinanceiro,
        totalMembros,
        proximosAniversariantes,
        proximosEventos,
        menuItems: menu,
        widgets: widgetsPorCargo, // Adiciona os widgets
      };
    } else {
      // Dashboard do Membro Comum
      const emprestimosPendentes = await getEmprestimosPendentes(membroId);

      dashboardData = {
        tipo: 'membro',
        emprestimosPendentes,
        proximosEventos,
        menuItems: menu,
        widgets: widgetsPorCargo, // Adiciona os widgets (se o membro tiver algum cargo)
      };
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Erro ao gerar dados do dashboard:", error);
    res.status(500).json({ message: "Erro ao gerar dados do dashboard.", errorDetails: error.message });
  }
};
