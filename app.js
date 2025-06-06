// backend/app.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { sequelize, initModels } from './models/index.js';

// Importar TODOS os arquivos de rotas do projeto
import authRoutes from './routes/auth.routes.js';
import lodgeMemberRoutes from './routes/lodgemember.routes.js';
import familyMemberRoutes from './routes/familymember.routes.js';
import masonicSessionRoutes from './routes/masonicsession.routes.js';
import bibliotecaRoutes from './routes/biblioteca.routes.js';
import harmoniaRoutes from './routes/harmonia.routes.js';
import publicacaoRoutes from './routes/publicacao.routes.js';
import ataRoutes from './routes/ata.routes.js';
import comissaoRoutes from './routes/comissao.routes.js'; // Módulo Comissões
import visitaRoutes from './routes/visitacao.routes.js'; // Módulo Visitações
import { emprestimoRoutes, emprestimoMembroRoutes } from './routes/emprestimo.routes.js'; // Módulo Empréstimos

// O arquivo cargoexercido.routes.js é aninhado e não precisa ser montado aqui.

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares Globais
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota de teste simples para a API
app.get('/api', (req, res) => {
  res.json({ message: `API da Loja Maçônica ${process.env.APP_NAME || 'SysJPJ'} funcionando!` });
});

// Função assíncrona para iniciar o servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    await initModels();
    console.log('Modelos Sequelize inicializados e prontos.');

    console.log('Configurando rotas da API...');

    // Montagem de todas as rotas de nível superior da API
    app.use('/api/auth', authRoutes);
    app.use('/api/lodgemembers', lodgeMemberRoutes); // Gerencia suas próprias rotas aninhadas (/cargos, /condecoracoes)
    app.use('/api/familymembers', familyMemberRoutes);
    app.use('/api/sessions', masonicSessionRoutes); // Corrigido de 'masonicsessions' para 'sessions' para ser mais idiomático
    app.use('/api/publicacoes', publicacaoRoutes);
    app.use('/api/harmonia', harmoniaRoutes); // Corrigido de 'harmonias' para 'harmonia'
    app.use('/api/biblioteca', bibliotecaRoutes); // Corrigido de 'bibliotecas' para 'biblioteca'
    app.use('/api/atas', ataRoutes);
    app.use('/api/comissoes', comissaoRoutes);
    app.use('/api/visitas', visitaRoutes);
    
    // Montagem das rotas de Empréstimo
    app.use('/api/emprestimos', emprestimoRoutes);
    app.use('/api/lodgemembers/:membroId/emprestimos', emprestimoMembroRoutes);

    app.listen(PORT, () => {
      console.log(`Servidor backend rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados ou iniciar o servidor:', error);
    process.exit(1);
  }
};

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error("Ocorreu um erro não tratado:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor.',
  });
});

startServer();