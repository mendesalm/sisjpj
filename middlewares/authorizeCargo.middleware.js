// backend/middlewares/authorizeCargo.middleware.js
import db from '../models/index.js';
const { CargoExercido } = db;
// Não precisa do Sequelize.Op se compararmos dataTermino com null ou com new Date() diretamente.
// Se precisar de comparações mais complexas (como "maior que"):
// import { Op } from 'sequelize';

/**
 * Middleware para autorizar acesso baseado nos cargos exercidos atualmente pelo maçom.
 * @param {string[]} allowedCargos - Um array de strings com os nomes dos cargos permitidos
 * (ex: ['Tesoureiro', 'Venerável Mestre']).
 */
export const authorizeCargo = (allowedCargos) => {
  if (!Array.isArray(allowedCargos) || allowedCargos.length === 0) {
    throw new Error('authorizeCargo requer um array de nomes de cargos permitidos.');
  }

  return async (req, res, next) => {
    // Garante que o usuário está autenticado e req.user existe (colocado pelo authMiddleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Acesso não autorizado. Usuário não autenticado.' });
    }

    if (!CargoExercido) {
        console.error("MODELO INDEFINIDO: db.CargoExercido não está disponível no authorizeCargo.middleware.");
        return res.status(500).json({ message: "Erro interno do servidor (modelo de cargos não pronto)." });
    }

    try {
      const lodgeMemberId = req.user.id;

      // Busca todos os cargos ativos do maçom logado
      // Um cargo é ativo se dataTermino for NULL
      const cargosAtivos = await CargoExercido.findAll({
        where: {
          lodgeMemberId: lodgeMemberId,
          dataTermino: null // Considera ativo se dataTermino for NULL
          // Se quiser considerar também dataTermino no futuro:
          // [Op.or]: [
          //   { dataTermino: null },
          //   { dataTermino: { [Op.gte]: new Date() } } // Maior ou igual à data atual
          // ]
        },
        attributes: ['nomeCargo'] // Só precisamos do nome do cargo
      });

      if (!cargosAtivos || cargosAtivos.length === 0) {
        console.log(`[authorizeCargo] Maçom ID ${lodgeMemberId} não possui cargos ativos.`);
        return res.status(403).json({ message: 'Acesso negado. Você não possui um cargo ativo necessário.' });
      }

      const nomesCargosAtivos = cargosAtivos.map(cargo => cargo.nomeCargo);
      console.log(`[authorizeCargo] Maçom ID ${lodgeMemberId} - Cargos Ativos: ${nomesCargosAtivos.join(', ')} - Cargos Permitidos para Rota: ${allowedCargos.join(', ')}`);

      // Verifica se o usuário possui pelo menos um dos cargos permitidos
      const hasRequiredCargo = nomesCargosAtivos.some(cargoDoUsuario => allowedCargos.includes(cargoDoUsuario));

      if (hasRequiredCargo) {
        next(); // Usuário tem um dos cargos permitidos, pode prosseguir
      } else {
        res.status(403).json({ message: `Acesso negado. Requer um dos seguintes cargos ativos: ${allowedCargos.join(', ')}.` });
      }
    } catch (error) {
      console.error('Erro no middleware authorizeCargo:', error);
      res.status(500).json({ message: 'Erro interno do servidor ao verificar permissões de cargo.' });
    }
  };
};