'use strict';
const bcrypt = require('bcryptjs'); // Mude de import para require

module.exports = {
  async up (queryInterface, Sequelize) {
    const saltRounds = 10;
    const senhaPlanaAdmin = process.env.ADMIN_INITIAL_PASSWORD || 'SenhaWebmasterPadrao1!'; 
    const senhaHashAdmin = await bcrypt.hash(senhaPlanaAdmin, saltRounds);

    const senhaPlanaWebamaster = process.env.WEBMASTER_INITIAL_PASSWORD || 'SenhaWebmasterPadrao1!'; 
    const senhaHashWebmaster = await bcrypt.hash(senhaPlanaWebamaster, saltRounds);

    const senhaPlanaDiretoria = process.env.DIRETORIA_INITIAL_PASSWORD || 'SenhaDiretoriaPadrao1!';
    const senhaHashDiretoria = await bcrypt.hash(senhaPlanaDiretoria, saltRounds);

    const senhaPlanaMembro = process.env.MEMBRO_INITIAL_PASSWORD || 'SenhaMembroPadrao1!';
    const senhaHashMembro = await bcrypt.hash(senhaPlanaMembro, saltRounds);

    await queryInterface.bulkInsert('LodgeMembers', [
      {
        NomeCompleto: 'Webmaster Principal', Email: 'webmaster@sua-loja.com', CPF: '000.000.000-00',
        SenhaHash: senhaHashWebmaster, credencialAcesso: 'Webmaster', Graduacao: 'Mestre Instalado',
        statusCadastro: 'Aprovado', Situacao: 'Ativo', DataNascimento: '1980-01-01',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        NomeCompleto: 'André Luiz Mendes', Email: 'mendesalm@gmail.com', CPF: '831.059.806-87',
        SenhaHash: senhaHashAdmin, credencialAcesso: 'Webmaster', Graduacao: 'Mestre',
        statusCadastro: 'Aprovado', Situacao: 'Ativo', DataNascimento: '1974-07-23',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        NomeCompleto: 'Maçom Diretor', Email: 'diretor@sua-loja.com', CPF: '222.222.222-22',
        SenhaHash: senhaHashDiretoria, credencialAcesso: 'Diretoria', Graduacao: 'Companheiro',
        statusCadastro: 'Aprovado', Situacao: 'Ativo', DataNascimento: '1990-01-01',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        NomeCompleto: 'Maçom Padrão', Email: 'membro@sua-loja.com', CPF: '333.333.333-33',
        SenhaHash: senhaHashMembro, credencialAcesso: 'Membro', Graduacao: 'Companheiro',
        statusCadastro: 'Aprovado', Situacao: 'Ativo', DataNascimento: '1990-01-01',
        createdAt: new Date(), updatedAt: new Date()
      }      
    ], {}); //
    console.log('Seed (CommonJS): Maçons iniciais aprovados inseridos com sucesso.')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('LodgeMembers', {
      Email: ['webmaster@sua-loja.com', 'mendesalm@gmail.com','diretoria@sua-loja.com', 'membro@sua-loja.com']
    }, {}); //
    console.log('Seed (CommonJS): Maçons iniciais aprovados removidos.');
  }
};

