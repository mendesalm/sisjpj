import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Livro = db.Biblioteca; // Usando o nome do modelo 'Biblioteca' como 'Livro' para clareza

// Função para remover arquivo, se existir
const removeFile = (filePath) => {
  const fullPath = path.resolve(__dirname, '../../', filePath); // Ajustar o path.resolve conforme a estrutura
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error(`Erro ao remover arquivo ${fullPath}:`, err);
    }
  }
};

// Criar um novo livro
export const createLivro = async (req, res) => {
  try {
    const {
      titulo,
      autores,
      editora,
      anoPublicacao,
      ISBN,
      numeroPaginas,
      classificacao,
      observacoes,
    } = req.body;

    const lodgeMemberId = req.user.id; // ID do usuário logado que está cadastrando
    let filePath = null;

    if (req.file) {
      filePath = req.file.path; // Path fornecido pelo Multer
    }

    const novoLivro = await Livro.create({
      titulo,
      autores,
      editora,
      anoPublicacao: anoPublicacao ? parseInt(anoPublicacao, 10) : null,
      ISBN,
      numeroPaginas: numeroPaginas ? parseInt(numeroPaginas, 10) : null,
      classificacao,
      observacoes,
      path: filePath,
      status: 'Disponível', // Default, mas o modelo já define isso
      lodgeMemberId,
    });

    res.status(201).json(novoLivro);
  } catch (error) {
    console.error('Erro ao criar livro:', error);
    if (req.file && req.file.path) {
      removeFile(req.file.path); // Remove o arquivo carregado se houver erro no cadastro
    }
    res.status(500).json({ message: 'Erro ao criar livro', error: error.message });
  }
};

// Obter todos os livros
export const getAllLivros = async (req, res) => {
  try {
    // Adicionar paginação e filtros no futuro, se necessário
    const livros = await Livro.findAll({
      include: [{ model: db.LodgeMember, attributes: ['id', 'NomeCompleto'] }], // Para saber quem cadastrou
      order: [['titulo', 'ASC']],
    });
    res.status(200).json(livros);
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    res.status(500).json({ message: 'Erro ao buscar livros', error: error.message });
  }
};

// Obter um livro pelo ID
export const getLivroById = async (req, res) => {
  try {
    const { id } = req.params;
    const livro = await Livro.findByPk(id, {
      include: [{ model: db.LodgeMember, attributes: ['id', 'NomeCompleto'] }],
    });

    if (!livro) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    res.status(200).json(livro);
  } catch (error) {
    console.error('Erro ao buscar livro por ID:', error);
    res.status(500).json({ message: 'Erro ao buscar livro por ID', error: error.message });
  }
};

// Atualizar um livro
export const updateLivro = async (req, res) => {
  try {
    const { id } = req.params;
    const livroExistente = await Livro.findByPk(id);

    if (!livroExistente) {
      if (req.file && req.file.path) {
        removeFile(req.file.path); // Remove o novo arquivo se o livro não existe
      }
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    const dadosAtualizados = { ...req.body };
    delete dadosAtualizados.id; // Não permitir atualização do ID
    delete dadosAtualizados.lodgeMemberId; // Não permitir alteração de quem cadastrou originalmente
    // delete dadosAtualizados.status; // O status será gerenciado pelo sistema de empréstimo

    if (req.file) {
      // Se um novo arquivo foi enviado, remover o antigo (se existir)
      if (livroExistente.path) {
        removeFile(livroExistente.path);
      }
      dadosAtualizados.path = req.file.path;
    }

    if (dadosAtualizados.anoPublicacao) {
        dadosAtualizados.anoPublicacao = parseInt(dadosAtualizados.anoPublicacao, 10);
    }
    if (dadosAtualizados.numeroPaginas) {
        dadosAtualizados.numeroPaginas = parseInt(dadosAtualizados.numeroPaginas, 10);
    }


    const [updatedRows] = await Livro.update(dadosAtualizados, { where: { id } });

    if (updatedRows === 0) {
        // Teoricamente, já checamos se o livro existe, mas é uma segurança adicional
        if (req.file && req.file.path && dadosAtualizados.path === req.file.path) {
            removeFile(req.file.path); // Remove o novo arquivo se a atualização falhou por outro motivo
        }
        return res.status(404).json({ message: 'Livro não encontrado ou nenhum dado modificado' });
    }
    
    const livroAtualizado = await Livro.findByPk(id);
    res.status(200).json(livroAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    if (req.file && req.file.path) {
      // Tenta remover o arquivo carregado em caso de erro na atualização,
      // mas verifica se o path no erro não é o path antigo.
      const livroOriginal = await Livro.findByPk(req.params.id, { attributes: ['path'], raw: true });
      if (!livroOriginal || req.file.path !== livroOriginal.path) {
        removeFile(req.file.path);
      }
    }
    res.status(500).json({ message: 'Erro ao atualizar livro', error: error.message });
  }
};

// Deletar um livro
export const deleteLivro = async (req, res) => {
  try {
    const { id } = req.params;
    const livro = await Livro.findByPk(id);

    if (!livro) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    // Remover arquivo de capa associado, se existir
    if (livro.path) {
      removeFile(livro.path);
    }

    await Livro.destroy({ where: { id } });
    res.status(200).json({ message: 'Livro deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    res.status(500).json({ message: 'Erro ao deletar livro', error: error.message });
  }
};