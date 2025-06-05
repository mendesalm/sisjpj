// backend/app.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar a instância do Sequelize e a função de inicialização dos modelos
// getDb FOI REMOVIDO DAQUI, pois app.js não o utiliza diretamente.
import { sequelize, initModels } from './models/index.js';

// Importar arquivos de rotas (AGORA NO TOPO DO MÓDULO)
import authRoutes from './routes/auth.routes.js';
import lodgeMemberRoutes from './routes/lodgemember.routes.js';
import familyMemberRoutes from './routes/familymember.routes.js';
import cargoExercidoRoutes from './routes/cargoexercido.routes.js';
import funcionalidadePermissaoRoutes from './routes/funcionalidadePermissao.routes.js'; // ADICIONE ESTA LINHA

// Importe outras rotas aqui, se houver
// import masonicSessionRoutes from './routes/masonicsession.routes.js';
// import ataRoutes from './routes/ata.routes.js';
// import publicacaoRoutes from './routes/publicacao.routes.js';
// import harmoniaRoutes from './routes/harmonia.routes.js';
// import bibliotecaRoutes from './routes/biblioteca.routes.js';


// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
// Ajuste o caminho se seu .env estiver em outro local (ex: na raiz do projeto SysJPJ/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Criar a instância do Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares Globais
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' })); // Ajuste a porta do frontend se necessário
app.use(express.json()); // Permite que o Express leia JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })); // Permite que o Express leia dados de formulário codificados na URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir arquivos estáticos da pasta 'uploads'

// Rota de teste simples para a API
app.get('/api', (req, res) => {
  res.json({ message: `API da Loja Maçônica ${process.env.APP_NAME || 'SysJPJ'} funcionando!` });
});

// Função assíncrona para iniciar o servidor
const startServer = async () => {
  try {
    console.log('Autenticando com o banco de dados...');
    // Tenta autenticar a conexão com o banco de dados
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    console.log('Inicializando modelos Sequelize...');
    // Chama a função initModels para carregar e associar todos os modelos Sequelize
    // É CRUCIAL que esta chamada seja aguardada (await) antes de configurar as rotas
    await initModels();
    console.log('Modelos Sequelize inicializados e prontos.');

    // AGORA, USE AS ROTAS AQUI DENTRO,
    // DEPOIS QUE initModels() FOI CHAMADO E CONCLUÍDO.
    // As variáveis de rota (authRoutes, lodgeMemberRoutes, etc.) já foram importadas no topo.
    console.log('Configurando rotas da API...');

    // Configurar as rotas da API com seus respectivos middlewares
    app.use('/api/auth', authRoutes);
    app.use('/api/lodgemembers', lodgeMemberRoutes);
    app.use('/api/familymembers', familyMemberRoutes);
    app.use('/api/cargoexercido', cargoExercidoRoutes);
    // Use outras rotas aqui
    // app.use('/api/masonicsessions', masonicSessionRoutes);
    // app.use('/api/atas', ataRoutes);
    // app.use('/api/publicacoes', publicacaoRoutes);
    // app.use('/api/harmonias', harmoniaRoutes);
    // app.use('/api/bibliotecas', bibliotecaRoutes);
    app.use('/api/permissoes', funcionalidadePermissaoRoutes);

    // Iniciar o servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor backend rodando na porta ${PORT}`);
      console.log(`Acesse a API em http://localhost:${PORT}/api`);
    });
  } catch (error) {
    // Captura e loga quaisquer erros que ocorram durante a conexão com o DB ou inicialização
    console.error('Não foi possível conectar ao banco de dados ou iniciar o servidor:', error);
    // Encerra o processo com código de erro
    process.exit(1);
  }
};

// Middleware para tratamento de erros (deve ser o último middleware)
app.use((err, req, res, next) => {
  console.error("Ocorreu um erro não tratado:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor.',
  });
});

// Chama a função para iniciar o servidor
startServer();
