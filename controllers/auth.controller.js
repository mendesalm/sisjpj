// backend/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../models/index.js'; // Importa o objeto db
import sendEmail from '../utils/emailSender.js';
import dotenv from 'dotenv';

// dotenv.config(); // Geralmente carregado uma vez no app.js/server.js
// Se precisar garantir que as variáveis de ambiente estão disponíveis aqui:
if (!process.env.JWT_SECRET) { // Exemplo de checagem
    dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });
}


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const APP_NAME = process.env.APP_NAME || 'SysJPJ';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Ajuste se necessário

// Função para registrar um novo Maçom (LodgeMember)
export const register = async (req, res) => {
  const {
    NomeCompleto, Email, CPF, SenhaHash, // Campos mínimos principais
    CIM, Identidade, FotoPessoal_Caminho, DataNascimento, DataCasamento, 
    Endereco_Rua, Endereco_Numero, Endereco_Bairro, Endereco_Cidade, Endereco_CEP, 
    Telefone, Naturalidade, Nacionalidade, Religiao, NomePai, NomeMae,
    FormacaoAcademica, Ocupacao, LocalTrabalho, Situacao, Graduacao, DataIniciacao,
    DataElevacao, DataExaltacao, DataFiliacao, DataRegularizacao, grauFilosofico
  } = req.body;

  try {
    if (!db.LodgeMember) {
      console.error("MODELO INDEFINIDO: db.LodgeMember não está disponível em auth.controller -> register.");
      return res.status(500).json({ message: "Erro interno do servidor (modelo não pronto)." });
    }

    let memberByEmail = await db.LodgeMember.findOne({ where: { Email } });
    if (memberByEmail) {
      return res.status(400).json({ errors: [{ msg: 'Este email já está em uso.' }] });
    }
    let memberByCPF = await db.LodgeMember.findOne({ where: { CPF } });
    if (memberByCPF) {
      return res.status(400).json({ errors: [{ msg: 'Este CPF já está em uso.' }] });
    }
    
    const newMember = await db.LodgeMember.create({
      NomeCompleto, Email, CPF, SenhaHash, // Senha plana, será hasheada pelo hook
      CIM, Identidade, FotoPessoal_Caminho, DataNascimento, DataCasamento, 
      Endereco_Rua, Endereco_Numero, Endereco_Bairro, Endereco_Cidade, Endereco_CEP, 
      Telefone, Naturalidade, Nacionalidade, Religiao, NomePai, NomeMae,
      FormacaoAcademica, Ocupacao, LocalTrabalho, Situacao, Graduacao, DataIniciacao,
      DataElevacao, DataExaltacao, DataFiliacao, DataRegularizacao, grauFilosofico,
      statusCadastro: 'Pendente', // <<< Definindo o status inicial do cadastro
      credencialAcesso: 'Membro',   // Credencial padrão para novos registros
      // emailVerificationToken e emailVerificationExpires podem ser definidos aqui se você for enviar email de verificação
    });

    // Opcional: Enviar email para administradores notificando sobre novo pedido de cadastro.
    // Ex: await sendEmail({ to: 'admin@loja.com', subject: 'Novo Pedido de Cadastro', text: `O usuário ${NomeCompleto} (${Email}) solicitou cadastro.` });

    const { SenhaHash: removedPass, resetPasswordToken, resetPasswordExpires, ...memberResponse } = newMember.toJSON();
    
    res.status(201).json({ 
      message: 'Solicitação de cadastro recebida com sucesso! Seu cadastro será revisado e você será notificado após a aprovação.', 
      member: memberResponse 
    });

  } catch (error) {
    console.error('Erro na solicitação de registro do maçom:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(err => ({ field: err.path, msg: err.message }));
        return res.status(400).json({ message: 'Erro de validação ou campo duplicado.', errors: messages });
    }
    res.status(500).json({ message: 'Erro no servidor ao tentar solicitar o cadastro.', errorDetails: error.message });
  }
};

// Função de Login
export const login = async (req, res) => {
  const { Email, password } = req.body;
  try {
    if (!db.LodgeMember) {
      console.error("MODELO INDEFINIDO: db.LodgeMember não está disponível no auth.controller -> login.");
      return res.status(500).json({ message: "Erro interno do servidor (modelo não pronto)." });
    }
    const member = await db.LodgeMember.findOne({ where: { Email } });

    if (!member) {
      return res.status(401).json({ errors: [{ msg: 'Credenciais inválidas.' }] });
    }

    const isMatch = await member.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ errors: [{ msg: 'Credenciais inválidas.' }] });
    }

    // <<< VERIFICAÇÃO DO STATUS DO CADASTRO >>>
    if (member.statusCadastro === 'Pendente') {
      return res.status(403).json({ message: 'Seu cadastro ainda está pendente de aprovação. Por favor, aguarde.' });
    }
    if (member.statusCadastro === 'Rejeitado') {
      return res.status(403).json({ message: 'Seu cadastro foi rejeitado. Entre em contato com a Loja para mais informações.' });
    }
    if (member.statusCadastro === 'VerificacaoEmailPendente') { // Caso implemente verificação de email
        return res.status(403).json({ message: 'Por favor, verifique seu email para ativar sua conta antes da aprovação administrativa.' });
    }
    // Garante que apenas 'Aprovado' possa logar
    if (member.statusCadastro !== 'Aprovado') {
        return res.status(403).json({ message: 'Sua conta não está ativa ou o status é desconhecido. Contate o administrador.' });
    }

    // Se chegou aqui, o status é 'Aprovado'
    member.UltimoLogin = new Date();
    await member.save();

    const payload = {
      user: {
        id: member.id,
        Email: member.Email,
        NomeCompleto: member.NomeCompleto,
        credencialAcesso: member.credencialAcesso,
      },
    };

    jwt.sign(
      payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN },
      (err, token) => {
        if (err) {
            console.error("Erro ao assinar o token JWT:", err);
            return res.status(500).json({ message: "Erro ao gerar token de autenticação."});
        }
        const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...userResponse } = member.toJSON();
        res.json({
          message: 'Login bem-sucedido!', token, user: userResponse
        });
      }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.', errorDetails: error.message });
  }
};

// Função para solicitar redefinição de senha
export const forgotPassword = async (req, res) => {
  const { Email } = req.body;
  try {
    if (!db.LodgeMember) {
      return res.status(500).json({ message: "Erro interno: Modelo LodgeMember não inicializado (forgotPassword)." });
    }
    const member = await db.LodgeMember.findOne({ where: { Email } });
    if (!member) {
      return res.status(200).json({ message: 'Se um maçom com este email existir, um link de redefinição de senha será enviado.' });
    }

    // Opcional: Verificar se o usuário está 'Aprovado' antes de permitir reset de senha
    // if (member.statusCadastro !== 'Aprovado') {
    //   return res.status(403).json({ message: 'Apenas contas aprovadas podem redefinir a senha.' });
    // }

    const resetToken = crypto.randomBytes(32).toString('hex');
    member.resetPasswordToken = resetToken;
    member.resetPasswordExpires = Date.now() + 3600000;
    await member.save(); 

    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
    const emailText = `Você solicitou a redefinição da senha para ${APP_NAME}.\n\nClique no link para redefinir (expira em 1 hora):\n${resetUrl}\n\nSe não foi você, ignore este email.`;
    const emailHtml = `<p>Você solicitou a redefinição da senha para ${APP_NAME}.</p><p>Clique <a href="${resetUrl}">aqui</a> para redefinir sua senha (o link expira em 1 hora).</p><p>Se não foi você, ignore este email.</p>`;
    
    await sendEmail({ to: member.Email, subject: `Redefinição de Senha - ${APP_NAME}`, text: emailText, html: emailHtml });

    res.status(200).json({ message: 'Se um maçom com este email existir, um link de redefinição de senha foi enviado.' });

  } catch (error) {
    console.error('Erro no processo de forgotPassword:', error.message);
    res.status(500).json({ message: 'Erro no servidor ao processar sua solicitação.' });
  }
};

// Função para redefinir a senha com o token
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { novaSenha } = req.body;
  if (!novaSenha) return res.status(400).json({ message: 'Nova senha é obrigatória.' });

  try {
    if (!db.LodgeMember) {
      return res.status(500).json({ message: "Erro interno: Modelo LodgeMember não inicializado (resetPassword)." });
    }
    const member = await db.LodgeMember.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Symbol.for('gt')]: Date.now() }
      }
    });

    if (!member) return res.status(400).json({ message: 'Token de redefinição de senha inválido ou expirado.' });
    
    // Opcional: Verificar se o usuário está 'Aprovado' antes de permitir reset de senha
    // if (member.statusCadastro !== 'Aprovado') {
    //   return res.status(403).json({ message: 'Apenas contas aprovadas podem redefinir a senha.' });
    // }

    member.SenhaHash = novaSenha; // O hook beforeUpdate cuidará do hash
    member.resetPasswordToken = null;
    member.resetPasswordExpires = null;
    await member.save();

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('Erro em resetPassword:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => ({ field: err.path, msg: err.message }));
        return res.status(400).json({ message: 'Erro de validação ao salvar nova senha.', errors: messages });
    }
    res.status(500).json({ message: 'Erro ao redefinir senha.', errorDetails: error.message });
  }
};