// backend/models/lodgemember.model.js
import bcrypt from 'bcryptjs';

export default (sequelize, DataTypes) => {
  const LodgeMember = sequelize.define('LodgeMember', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    NomeCompleto: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Nome completo é obrigatório.' } } },
    CIM: { type: DataTypes.STRING, unique: true, allowNull: true },
    CPF: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { notEmpty: { msg: 'CPF é obrigatório.' } } },
    Identidade: { type: DataTypes.STRING, allowNull: true },
    Email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: 'Email é obrigatório.' }, isEmail: { msg: 'Email inválido.' } } },
    FotoPessoal_Caminho: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: { msg: 'Caminho da foto deve ser uma URL válida, se fornecido.' } } },
    DataNascimento: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de nascimento inválida.' } } },
    DataCasamento: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de casamento inválida.' } } },
    Endereco_Rua: { type: DataTypes.STRING, allowNull: true },
    Endereco_Numero: { type: DataTypes.STRING, allowNull: true },
    Endereco_Bairro: { type: DataTypes.STRING, allowNull: true },
    Endereco_Cidade: { type: DataTypes.STRING, allowNull: true },
    Endereco_CEP: { type: DataTypes.STRING, allowNull: true },
    Telefone: { type: DataTypes.STRING, allowNull: true },
    Naturalidade: { type: DataTypes.STRING, allowNull: true },
    Nacionalidade: { type: DataTypes.STRING, allowNull: true },
    Religiao: { type: DataTypes.STRING, allowNull: true },
    NomePai: { type: DataTypes.STRING, allowNull: true },
    NomeMae: { type: DataTypes.STRING, allowNull: true },
    FormacaoAcademica: { type: DataTypes.STRING, allowNull: true },
    Ocupacao: { type: DataTypes.STRING, allowNull: true },
    LocalTrabalho: { type: DataTypes.STRING, allowNull: true },
    Situacao: { type: DataTypes.STRING, allowNull: true },
    Graduacao: { type: DataTypes.ENUM('Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'), allowNull: true },
    DataIniciacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de iniciação inválida.' } } },
    DataElevacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de elevação inválida.' } } },
    DataExaltacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de exaltação inválida.' } } },
    DataFiliacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de filiação inválida.' } } },
    DataRegularizacao: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: { msg: 'Data de regularização inválida.' } } },
    SenhaHash: { type: DataTypes.STRING, allowNull: false },
    Funcao: { type: DataTypes.STRING, defaultValue: 'user', allowNull: true },
    credencialAcesso: { type: DataTypes.ENUM('Webmaster', 'Diretoria', 'Membro'), allowNull: false, defaultValue: 'Membro' },
    grauFilosofico: { type: DataTypes.STRING, allowNull: true },
    statusCadastro: { type: DataTypes.ENUM('Pendente', 'Aprovado', 'Rejeitado', 'VerificacaoEmailPendente'), allowNull: false, defaultValue: 'Pendente' },
    emailVerificationToken: { type: DataTypes.STRING, allowNull: true },
    emailVerificationExpires: { type: DataTypes.DATE, allowNull: true },
    UltimoLogin: { type: DataTypes.DATE, allowNull: true },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  }, {
    timestamps: true,
    tableName: 'LodgeMembers',
    hooks: {
      beforeCreate: async (member) => {
        if (member.SenhaHash && (!member.SenhaHash.startsWith('$2a$') && !member.SenhaHash.startsWith('$2b$'))) {
          const salt = await bcrypt.genSalt(10);
          member.SenhaHash = await bcrypt.hash(member.SenhaHash, salt);
        }
      },
      beforeUpdate: async (member) => {
        if (member.changed('SenhaHash') && member.SenhaHash && (!member.SenhaHash.startsWith('$2a$') && !member.SenhaHash.startsWith('$2b$'))) {
          const salt = await bcrypt.genSalt(10);
          member.SenhaHash = await bcrypt.hash(member.SenhaHash, salt);
        }
      },
      // --- NOVA FUNCIONALIDADE ADICIONADA ---
      // Hook que é acionado após um novo membro ser criado no banco de dados.
      afterCreate: async (membro, options) => {
          // Verifica se o status do novo membro é 'Pendente'.
          if (membro.statusCadastro === 'Pendente') {
              // Importa dinamicamente o serviço de notificação para evitar dependências circulares.
              const { notificarNovoCadastroPendente } = await import('../services/notification.service.js');
              // Chama a função para enviar o email de notificação.
              notificarNovoCadastroPendente(membro);
          }
      }
    }
  });

  LodgeMember.prototype.isValidPassword = async function (password) {
    if (!password || !this.SenhaHash) return false;
    try {
        return await bcrypt.compare(password, this.SenhaHash);
    } catch (error) {
        console.error("Erro ao comparar senhas:", error);
        return false;
    }
  };

  LodgeMember.associate = function(models) {
    // Relações existentes e novas, agora mais limpas e completas
    LodgeMember.hasMany(models.FamilyMember, { as: 'familiares', foreignKey: 'lodgeMemberId' });
    LodgeMember.belongsToMany(models.MasonicSession, { through: models.SessionAttendee, as: 'sessoesPresente', foreignKey: 'lodgeMemberId', otherKey: 'sessionId' });
    LodgeMember.hasMany(models.MasonicSession, { as: 'sessoesResponsavelJantar', foreignKey: 'responsavelJantarLodgeMemberId' });
    LodgeMember.hasMany(models.CargoExercido, { as: 'cargos', foreignKey: 'lodgeMemberId' });
    LodgeMember.hasMany(models.Publicacao, { as: 'publicacoes', foreignKey: 'lodgeMemberId' });
    LodgeMember.hasMany(models.Harmonia, { as: 'harmonias', foreignKey: 'lodgeMemberId' });
    LodgeMember.hasMany(models.Biblioteca, { as: 'livrosCadastrados', foreignKey: 'lodgeMemberId' });
    LodgeMember.hasMany(models.Emprestimo, { as: 'emprestimos', foreignKey: 'membroId' });
    LodgeMember.hasMany(models.Visita, { as: 'visitas', foreignKey: 'lodgeMemberId' });
    LodgeMember.hasMany(models.Condecoracao, { as: 'condecoracoes', foreignKey: 'lodgeMemberId' });
    LodgeMember.hasMany(models.Comissao, { as: 'comissoesCriadas', foreignKey: 'criadorId' });
    LodgeMember.belongsToMany(models.Comissao, { through: models.MembroComissao, as: 'comissoes', foreignKey: 'lodgeMemberId', otherKey: 'comissaoId' });
    LodgeMember.hasMany(models.Evento, { as: 'eventosCriados', foreignKey: 'criadoPorId' });
    LodgeMember.belongsToMany(models.Evento, { through: models.ParticipanteEvento, as: 'eventosConfirmados', foreignKey: 'lodgeMemberId', otherKey: 'eventoId' });
  };

  return LodgeMember;
};
