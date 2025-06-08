// backend/models/index.js
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('--- INICIANDO models/index.js (ESM Version) ---');

const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_DIALECT', 'DB_HOST'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`ERRO CRÍTICO: Variáveis de ambiente faltando no .env: ${missingEnvVars.join(', ')}`);
  console.error("Verifique o caminho em dotenv.config() e o conteúdo do seu arquivo .env.");
  process.exit(1);
} else {
  console.log(`[DEBUG .env] DB_HOST lido pelo dotenv: ${process.env.DB_HOST}`);
  console.log(`[DEBUG .env] DB_NAME lido pelo dotenv: ${process.env.DB_NAME}`);
}

const dbDialect = process.env.DB_DIALECT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS || null;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbTimezone = process.env.DB_TIMEZONE || '-03:00';
const sequelizeLogging = process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false;

console.log(`DEBUG: Configurando Sequelize com Dialeto (constante): ${dbDialect}, Host: ${dbHost}, DB: ${dbName}`);

if (!dbDialect) {
    console.error("ERRO CRÍTICO: dbDialect (process.env.DB_DIALECT) é undefined antes de new Sequelize().");
    process.exit(1);
}

export const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPass,
  {
    host: dbHost,
    dialect: dbDialect,
    port: dbPort,
    logging: sequelizeLogging,
    timezone: dbTimezone,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Array com TODAS as definições de modelos do projeto
const modelDefinitions = [
  { key: 'LodgeMember', file: 'lodgemember.model.js' },
  { key: 'FamilyMember', file: 'familymember.model.js' },
  { key: 'MasonicSession', file: 'masonicsession.model.js' },
  { key: 'SessionAttendee', file: 'sessionattendee.model.js' },
  { key: 'CargoExercido', file: 'cargoexercido.model.js' },
  { key: 'Ata', file: 'ata.model.js' },
  { key: 'Publicacao', file: 'publicacao.model.js' },
  { key: 'Harmonia', file: 'harmonia.model.js' },
  { key: 'Biblioteca', file: 'biblioteca.model.js' },
  { key: 'VisitanteSessao', file: 'visitantesessao.model.js' },
  { key: 'FuncionalidadePermissao', file: 'funcionalidadepermissao.model.js' },
  { key: 'Comissao', file: 'comissao.model.js' },
  { key: 'MembroComissao', file: 'membro_comissao.model.js' },
  { key: 'Visita', file: 'visitacao.model.js' },
  { key: 'Condecoracao', file: 'condecoracao.model.js' },
  { key: 'Emprestimo', file: 'emprestimo.model.js' },
  { key: 'Conta', file: 'conta.model.js' },
  { key: 'Lancamento', file: 'lancamento.model.js' },
  { key: 'Aviso', file: 'aviso.model.js' },
  { key: 'Patrimonio', file: 'patrimonio.model.js' },
  { key: 'Orcamento', file: 'orcamento.model.js' },
  { key: 'Reserva', file: 'reserva.model.js' },
  { key: 'MenuItem', file: 'menu_item.model.js' }
];

const loadModel = async (modelFileName) => {
  const absolutePath = path.join(__dirname, modelFileName);
  const modelURL = pathToFileURL(absolutePath).href;
  const importedModule = await import(modelURL);
  const defineFunction = importedModule.default;
  if (typeof defineFunction !== 'function') {
    const errorMsg = `[loadModel] ERRO CRÍTICO: ${modelFileName} não exportou uma função default. Recebido: ${typeof defineFunction}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return defineFunction;
};

export const initModels = async () => {
  if (db.initialized) {
    return db;
  }
  console.log('[initModels] Iniciando carregamento e definição dos modelos...');
  for (const modelDef of modelDefinitions) {
    try {
      const defineFunction = await loadModel(modelDef.file);
      const model = defineFunction(sequelize, DataTypes);
      db[modelDef.key] = model;
      console.log(`[initModels] Modelo db.${modelDef.key} carregado e definido.`);
    } catch (error) {
        console.error(`[initModels] FALHA ao carregar o modelo do arquivo ${modelDef.file}:`, error);
        process.exit(1);
    }
  }
  console.log('[initModels] Todos os modelos foram definidos e atribuídos ao objeto db.');

  console.log('[initModels] Iniciando execução das associações dos modelos...');
  Object.keys(db).forEach(modelName => {
    if (db[modelName] && typeof db[modelName].associate === 'function') {
      try {
        db[modelName].associate(db);
        console.log(`[initModels] Associação para ${modelName} executada.`);
      } catch (assocError) {
        console.error(`[initModels] ERRO ao executar associate() para ${modelName}:`, assocError);
      }
    }
  });
  console.log('[initModels] Associações dos modelos concluídas.');

  console.log('[DEBUG models/index.js] Chaves do objeto db após carregar modelos:', Object.keys(db));

  db.initialized = true;
  return db;
};

export default db;