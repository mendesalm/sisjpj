// models/evento.model.js
export default (sequelize, DataTypes) => {
  const Evento = sequelize.define('Evento', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    dataHoraInicio: { type: DataTypes.DATE, allowNull: false, validate: { isDate: true } },
    dataHoraFim: { type: DataTypes.DATE, allowNull: true, validate: { isDate: true } },
    local: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    tipo: { type: DataTypes.ENUM('Sessão Maçônica', 'Evento Social', 'Evento Filantrópico', 'Outro'), allowNull: false },
    criadoPorId: { // Adicionando a coluna explicitamente para clareza
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'Eventos',
    timestamps: true,
  });

  Evento.associate = function(models) {
    Evento.belongsTo(models.LodgeMember, {
        as: 'criador',
        foreignKey: { name: 'criadoPorId', allowNull: true }, // <-- CORRIGIDO AQUI
        onDelete: 'SET NULL'
    });
    Evento.belongsToMany(models.LodgeMember, {
      through: models.ParticipanteEvento,
      as: 'participantes',
      foreignKey: 'eventoId',
      otherKey: 'lodgeMemberId'
    });
  };

  return Evento;
};
