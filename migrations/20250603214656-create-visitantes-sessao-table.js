'use strict';
/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VisitantesSessao', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nomeCompleto: {
        type: Sequelize.STRING,
        allowNull: false
      },
      graduacao: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cim: {
        type: Sequelize.STRING,
        allowNull: true
      },
      potencia: {
        type: Sequelize.STRING,
        allowNull: true
      },
      loja: {
        type: Sequelize.STRING,
        allowNull: true
      },
      oriente: {
        type: Sequelize.STRING,
        allowNull: true
      },
      masonicSessionId: { // Chave estrangeira
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MasonicSessions', // Nome da tabela de sessões
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    console.log('Tabela VisitantesSessao criada.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('VisitantesSessao');
    console.log('Tabela VisitantesSessao removida.');
  }
};