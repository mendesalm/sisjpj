// services/notification.service.js
import db from '../models/index.js';
import sendEmail from '../utils/emailSender.js';
import { Op, fn, col, literal } from 'sequelize';

const { LodgeMember, Evento, FamilyMember, Emprestimo, Biblioteca, CargoExercido } = db;

// Função para notificar sobre novos cadastros pendentes
export const notificarNovoCadastroPendente = async (novoMembro) => {
  try {
    const administradores = await LodgeMember.findAll({
      where: {
        credencialAcesso: { [Op.in]: ['Webmaster', 'Diretoria'] },
        statusCadastro: 'Aprovado'
      },
      attributes: ['Email']
    });

    if (administradores.length === 0) return;

    const emails = administradores.map(admin => admin.Email).join(', ');
    const subject = 'SysJPJ - Novo Cadastro Pendente de Aprovação';
    const text = `Um novo membro, ${novoMembro.NomeCompleto}, cadastrou-se no sistema e aguarda aprovação.`;
    const html = `<p>Olá,</p><p>Um novo membro, <strong>${novoMembro.NomeCompleto}</strong> (Email: ${novoMembro.Email}), cadastrou-se no sistema e aguarda a sua aprovação.</p><p>Por favor, acesse o painel de administração para revisar o cadastro.</p><p>Atenciosamente,<br>Sistema SysJPJ</p>`;

    await sendEmail(emails, subject, text, html);
  } catch (error) {
    console.error("Erro ao enviar notificação de novo cadastro:", error);
  }
};

// Função para enviar a agenda semanal
export const enviarAgendaSemanal = async () => {
  try {
    const hoje = new Date();
    const proximaSemana = new Date();
    proximaSemana.setDate(hoje.getDate() + 7);

    const eventos = await Evento.findAll({
      where: { dataHoraInicio: { [Op.between]: [hoje, proximaSemana] } },
      order: [['dataHoraInicio', 'ASC']]
    });

    if (eventos.length === 0) {
      console.log('Nenhum evento na próxima semana. Email de agenda não enviado.');
      return;
    }

    const membros = await LodgeMember.findAll({ where: { statusCadastro: 'Aprovado' }, attributes: ['Email'] });
    if (membros.length === 0) return;

    const emails = membros.map(m => m.Email).join(', ');
    const subject = `SysJPJ - Agenda da Semana (${hoje.toLocaleDateString('pt-BR')})`;
    let html = '<h1>Agenda da Semana</h1><p>Confira os próximos eventos da Loja:</p><ul>';
    eventos.forEach(evento => {
      html += `<li><strong>${evento.titulo}</strong> - ${new Date(evento.dataHoraInicio).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})} no local: ${evento.local}</li>`;
    });
    html += '</ul>';

    await sendEmail(emails, subject, "Agenda da semana", html);
  } catch (error) {
    console.error("Erro ao enviar agenda semanal:", error);
  }
};

// Função para enviar os aniversariantes da semana
export const enviarAniversariantesSemanal = async () => {
    // A lógica para buscar aniversariantes (ignorando o ano) é a mesma do relatório
    // Por simplicidade, este exemplo foca no conceito.
    // Você pode adaptar a lógica da função gerarRelatorioAniversariantes do seu controller de relatórios.
    console.log("Funcionalidade de email de aniversariantes a ser implementada.");
};

// Função para alertar o Bibliotecário sobre livros atrasados
export const alertarSobreLivrosAtrasados = async () => {
  try {
    const bibliotecarios = await LodgeMember.findAll({
        include: [{
            model: CargoExercido,
            as: 'cargos',
            where: { nomeCargo: 'Bibliotecário', dataFim: null },
            required: true
        }],
        attributes: ['Email']
    });

    if (bibliotecarios.length === 0) {
      console.log('Nenhum bibliotecário encontrado para enviar alerta.');
      return;
    }

    const emprestimosAtrasados = await Emprestimo.findAll({
        where: {
            dataDevolucaoReal: null,
            dataDevolucaoPrevista: { [Op.lt]: new Date() }
        },
        include: [
            { model: Biblioteca, as: 'livro', attributes: ['titulo'] },
            { model: LodgeMember, as: 'membro', attributes: ['NomeCompleto'] }
        ]
    });

    if (emprestimosAtrasados.length === 0) {
        console.log('Nenhum livro atrasado. Alerta não enviado.');
        return;
    }

    const emails = bibliotecarios.map(b => b.Email).join(', ');
    const subject = 'SysJPJ - Alerta de Livros com Devolução Atrasada';
    let html = '<h1>Alerta de Livros Atrasados</h1><p>Os seguintes livros estão com a devolução em atraso:</p><ul>';
    emprestimosAtrasados.forEach(e => {
        html += `<li><strong>Livro:</strong> ${e.livro.titulo}<br/><strong>Membro:</strong> ${e.membro.NomeCompleto}<br/><strong>Devolução Prevista:</strong> ${new Date(e.dataDevolucaoPrevista).toLocaleDateString('pt-BR')}</li><br/>`;
    });
    html += '</ul>';

    await sendEmail(emails, subject, "Alerta de livros atrasados", html);

  } catch (error) {
    console.error("Erro ao enviar alerta de livros atrasados:", error);
  }
};
