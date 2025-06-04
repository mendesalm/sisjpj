// backend/controllers/lodgemember.controller.js
import db from '../models/index.js';
const { LodgeMember, FamilyMember, CargoExercido } = db; // Assegure-se que CargoExercido está definido em models/index.js
import { pick } from '../utils/pick.js';

// Obter o perfil do maçom autenticado
export const getMyProfile = async (req, res) => {
  try {
    if (!db.LodgeMember || !db.FamilyMember || !db.CargoExercido) {
      return res.status(500).json({ message: "Erro interno: Modelos não inicializados (getMyProfile)." });
    }
    const member = await db.LodgeMember.findByPk(req.user.id, {
      attributes: { exclude: ['SenhaHash', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        { model: db.FamilyMember, as: 'familiares', required: false },
        { model: db.CargoExercido, as: 'cargosExercidos', order: [['dataInicio', 'DESC']], required: false }
      ]
    });
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });
    res.status(200).json(member);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do perfil.', errorDetails: error.message });
  }
};

// Atualizar o perfil do maçom autenticado
export const updateMyProfile = async (req, res) => {
  console.log('--- Iniciando updateMyProfile ---');
  console.log('ID do usuário (do token):', req.user.id);
  console.log('Dados recebidos no corpo (req.body):', JSON.stringify(req.body, null, 2));

  try {
    if (!db.LodgeMember) {
      console.error("MODELO INDEFINIDO: db.LodgeMember não está disponível em updateMyProfile.");
      return res.status(500).json({ message: "Erro interno do servidor (modelo não pronto)." });
    }

    const member = await db.LodgeMember.findByPk(req.user.id);
    if (!member) {
      console.log('Maçom não encontrado para o ID:', req.user.id);
      return res.status(404).json({ message: 'Maçom não encontrado.' });
    }

    console.log('Dados atuais do maçom (antes do pick):', JSON.stringify(member.toJSON(), null, 2));

    const allowedFields = [
      'NomeCompleto', 'CIM', 'Identidade', 'Email',
      'FotoPessoal_Caminho', 'DataNascimento', 'DataCasamento',
      'Endereco_Rua', 'Endereco_Numero', 'Endereco_Bairro', 'Endereco_Cidade', 'Endereco_CEP',
      'Telefone', 'Naturalidade', 'Nacionalidade', 'Religiao', 'NomePai', 'NomeMae',
      'FormacaoAcademica', 'Ocupacao', 'LocalTrabalho', 'grauFilosofico'
    ];
    console.log('Campos permitidos para atualização:', allowedFields);

    const updatesFromPick = pick(req.body, allowedFields);
    console.log('Objeto "updates" APÓS pick():', JSON.stringify(updatesFromPick, null, 2));

    const finalUpdates = {};
    for (const key in updatesFromPick) {
      if (updatesFromPick[key] !== undefined) {
        finalUpdates[key] = updatesFromPick[key];
      }
    }
    console.log('Objeto "finalUpdates" APÓS remover undefined:', JSON.stringify(finalUpdates, null, 2));

    if (Object.keys(finalUpdates).length === 0) {
      console.log('Nenhum campo válido para atualização foi fornecido ou campos não estão na lista de permitidos.');
      const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...memberResponseUnchanged } = member.toJSON();
      return res.status(200).json({ message: 'Nenhum dado válido para atualização fornecido.', member: memberResponseUnchanged });
    }
    
    // Validações de unicidade para Email e CIM ANTES de tentar o update,
    // se eles estiverem presentes em finalUpdates e forem diferentes do valor atual.
    // O validador em user.validator.js já deve ter feito isso, mas uma checagem dupla aqui é segura.
    if (finalUpdates.Email && finalUpdates.Email !== member.Email) {
      const existingByEmail = await db.LodgeMember.findOne({ where: { Email: finalUpdates.Email } });
      if (existingByEmail && existingByEmail.id !== member.id) {
        return res.status(400).json({ errors: [{ type: 'field', msg: 'Este email já está em uso por outra conta.', path: 'Email', location: 'body', value: finalUpdates.Email }] });
      }
    }
    if (finalUpdates.CIM && finalUpdates.CIM !== member.CIM) {
      const existingByCIM = await db.LodgeMember.findOne({ where: { CIM: finalUpdates.CIM } });
      if (existingByCIM && existingByCIM.id !== member.id) {
        return res.status(400).json({ errors: [{ type: 'field', msg: 'Este CIM já está em uso por outra conta.', path: 'CIM', location: 'body', value: finalUpdates.CIM }] });
      }
    }

    let fieldsThatActuallyChanged = false;
    for (const key in finalUpdates) {
      if (String(member[key]) !== String(finalUpdates[key])) {
        console.log(`Campo a ser alterado: ${key}, Valor antigo: '${member[key]}', Novo valor: '${finalUpdates[key]}'`);
        fieldsThatActuallyChanged = true;
      }
    }

    if (!fieldsThatActuallyChanged) {
      console.log('Os dados fornecidos são idênticos aos existentes no banco. Nenhuma atualização real será feita.');
      const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...memberResponseNoChange } = member.toJSON();
      return res.status(200).json({ message: 'Dados fornecidos são idênticos aos existentes. Nenhuma alteração realizada.', member: memberResponseNoChange });
    }

    await member.update(finalUpdates);
    console.log('Maçom atualizado no banco de dados.');
    
    const updatedMemberInstance = await db.LodgeMember.findByPk(req.user.id);
    const { SenhaHash, resetPasswordToken, resetPasswordExpires, ...memberResponse } = updatedMemberInstance.toJSON();
    
    console.log('Dados do maçom APÓS atualização (para resposta):', JSON.stringify(memberResponse, null, 2));
    res.status(200).json({ message: 'Perfil atualizado com sucesso!', member: memberResponse });

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação nos dados fornecidos.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Erro de duplicidade. Email ou CIM já podem estar em uso.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao atualizar perfil.', errorDetails: error.message });
  }
};

// --- Funções de Admin/Diretoria ---

export const createLodgeMember = async (req, res) => {
  // SenhaHash aqui é a senha plana vinda do request, o hook do modelo fará o hash.
  const { 
    Email, CPF, SenhaHash, NomeCompleto, credencialAcesso, Graduacao, Situacao,
    // Inclua todos os outros campos que um admin pode preencher na criação
    CIM, Identidade, FotoPessoal_Caminho, DataNascimento, DataCasamento, 
    Endereco_Rua, Endereco_Numero, Endereco_Bairro, Endereco_Cidade, Endereco_CEP, 
    Telefone, Naturalidade, Nacionalidade, Religiao, NomePai, NomeMae,
    FormacaoAcademica, Ocupacao, LocalTrabalho, DataIniciacao,
    DataElevacao, DataExaltacao, DataFiliacao, DataRegularizacao, grauFilosofico,
    Funcao 
  } = req.body; 
  try {
    if (!db.LodgeMember) return res.status(500).json({ message: "Erro interno: Modelo LodgeMember não inicializado (createLodgeMember)." });
    
    const newMember = await db.LodgeMember.create({ 
      Email, CPF, SenhaHash, NomeCompleto, credencialAcesso, Graduacao, Situacao,
      CIM, Identidade, FotoPessoal_Caminho, DataNascimento, DataCasamento, 
      Endereco_Rua, Endereco_Numero, Endereco_Bairro, Endereco_Cidade, Endereco_CEP, 
      Telefone, Naturalidade, Nacionalidade, Religiao, NomePai, NomeMae,
      FormacaoAcademica, Ocupacao, LocalTrabalho, DataIniciacao,
      DataElevacao, DataExaltacao, DataFiliacao, DataRegularizacao, grauFilosofico,
      Funcao,
      statusCadastro: 'Aprovado' // Cadastro interno já é aprovado
    });
    const { SenhaHash: removedPass, resetPasswordToken, resetPasswordExpires, ...memberResponse } = newMember.toJSON();
    res.status(201).json(memberResponse);
  } catch (error) {
    console.error("Erro ao criar maçom (admin):", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Erro de validação ou campo duplicado.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao criar maçom.', errorDetails: error.message });
  }
};

export const getAllLodgeMembers = async (req, res) => {
  try {
    if (!db.LodgeMember || !db.CargoExercido) return res.status(500).json({ message: "Erro interno: Modelos não inicializados (getAllLodgeMembers)." });
    const members = await db.LodgeMember.findAll({
      attributes: { exclude: ['SenhaHash', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [ 
        { model: db.CargoExercido, as: 'cargosExercidos', attributes: ['nomeCargo', 'dataInicio', 'dataTermino'], required: false }
      ],
      order: [['NomeCompleto', 'ASC']]
    });
    res.status(200).json(members);
  } catch (error) {
    console.error("Erro ao listar maçons:", error);
    res.status(500).json({ message: 'Erro ao listar maçons.', errorDetails: error.message });
  }
};

export const getLodgeMemberById = async (req, res) => {
  try {
    if (!db.LodgeMember || !db.FamilyMember || !db.CargoExercido) return res.status(500).json({ message: "Erro interno: Modelos não inicializados (getLodgeMemberById)." });
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) return res.status(400).json({ message: 'ID do maçom inválido.' });

    const member = await db.LodgeMember.findByPk(memberId, {
      attributes: { exclude: ['SenhaHash', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        { model: db.FamilyMember, as: 'familiares', required: false },
        { model: db.CargoExercido, as: 'cargosExercidos', required: false, order: [['dataInicio', 'DESC']] }
      ]
    });
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });
    res.status(200).json(member);
  } catch (error) {
    console.error("Erro ao buscar maçom por ID:", error);
    res.status(500).json({ message: 'Erro ao buscar maçom por ID.', errorDetails: error.message });
  }
};

export const updateLodgeMemberById = async (req, res) => {
  try {
    if (!db.LodgeMember) return res.status(500).json({ message: "Erro interno: Modelo LodgeMember não inicializado (updateLodgeMemberById)." });
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) return res.status(400).json({ message: 'ID do maçom inválido.' });

    const member = await db.LodgeMember.findByPk(memberId);
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });

    const allowedAdminFields = [
      'NomeCompleto', 'Email', 'CPF', 'CIM', 'Identidade', 'FotoPessoal_Caminho', 
      'DataNascimento', 'DataCasamento', 'Endereco_Rua', 'Endereco_Numero', 
      'Endereco_Bairro', 'Endereco_Cidade', 'Endereco_CEP', 'Telefone', 
      'Naturalidade', 'Nacionalidade', 'Religiao', 'NomePai', 'NomeMae', 
      'FormacaoAcademica', 'Ocupacao', 'LocalTrabalho', 'Situacao', 'Graduacao', 
      'DataIniciacao', 'DataElevacao', 'DataExaltacao', 'DataFiliacao', 
      'DataRegularizacao', 'grauFilosofico', 'credencialAcesso', 'Funcao',
      'statusCadastro' // Admin também pode alterar o status do cadastro
    ];
    const updates = pick(req.body, allowedAdminFields);
    Object.keys(updates).forEach(key => (updates[key] === undefined) && delete updates[key]); // Remove apenas undefined
    
    // Validações de unicidade para Email e CPF (feitas pelo lodgemember.validator.js)
    
    await member.update(updates);
    const { SenhaHash: removedPass, resetPasswordToken, resetPasswordExpires, ...memberResponse } = member.toJSON();
    res.status(200).json({ message: 'Maçom atualizado com sucesso!', member: memberResponse });
  } catch (error) {
    console.error("Erro ao atualizar maçom por ID (admin):", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Erro de validação ou campo duplicado.', errors: error.errors.map(e => ({msg: e.message, path: e.path})) });
    }
    res.status(500).json({ message: 'Erro ao atualizar maçom.', errorDetails: error.message });
  }
};

export const deleteLodgeMemberById = async (req, res) => {
  try {
    if (!db.LodgeMember) return res.status(500).json({ message: "Erro interno: Modelo LodgeMember não inicializado (deleteLodgeMemberById)." });
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) return res.status(400).json({ message: 'ID do maçom inválido.' });

    const member = await db.LodgeMember.findByPk(memberId);
    if (!member) return res.status(404).json({ message: 'Maçom não encontrado.' });
    
    await member.destroy(); // Se 'paranoid: true' estiver no modelo, será soft delete.
    res.status(200).json({ message: 'Maçom deletado com sucesso.' });
  } catch (error) {
    console.error("Erro ao deletar maçom:", error);
    res.status(500).json({ message: 'Erro ao deletar maçom.', errorDetails: error.message });
  }
};