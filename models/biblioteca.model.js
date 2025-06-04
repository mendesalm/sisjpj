// backend/models/biblioteca.model.js
export default (sequelize, DataTypes) => {
  const Biblioteca = sequelize.define('Biblioteca', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Título é obrigatório." } } },
    autores: { type: DataTypes.STRING, allowNull: true },
    editora: { type: DataTypes.STRING, allowNull: true },
    anoPublicacao: { type: DataTypes.INTEGER, allowNull: true, validate: { isInt: { msg: "Ano deve ser um número." } } },
    ISBN: { type: DataTypes.STRING, allowNull: true, unique: true },
    numeroPaginas: { type: DataTypes.INTEGER, allowNull: true, validate: { isInt: { msg: "Número de páginas deve ser um número." }, min: 1 } },
    classificacao: { type: DataTypes.STRING, allowNull: true },
    observacoes: { type: DataTypes.TEXT, allowNull: true },
    path: { type: DataTypes.STRING, allowNull: true }, // Corrigido para allowNull: true, conforme comentário
    lodgeMemberId: { // Para rastrear quem fez o upload/cadastrou
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, { timestamps: true, tableName: 'Biblioteca' });

  Biblioteca.associate = function(models) {
    if (this.getAttributes().lodgeMemberId && models.LodgeMember) {
      this.belongsTo(models.LodgeMember, {
        foreignKey: 'lodgeMemberId',
        as: 'cadastradoPor',
        allowNull: true,
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  };
  return Biblioteca;
};