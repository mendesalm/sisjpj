// backend/middlewares/authorizeExtended.middleware.js
import db from '../models/index.js';
const { CargoExercido } = db; // Apenas se precisarmos verificar cargos
// Op importado caso precise de queries mais complexas de data, mas para dataTermino: null não é estritamente necessário.
// import { Op } from 'sequelize';

/**
 * Middleware de autorização estendida.
 * Permite acesso se o usuário tiver uma das credenciaisAcesso permitidas
 * OU um dos cargosExercidos ativos permitidos.
 * @param {object} options - Opções de autorização.
 * @param {string[]} [options.allowedCredentials=[]] - Array de strings com credenciais de acesso permitidas.
 * @param {string[]} [options.allowedCargos=[]] - Array de strings com nomes de cargos exercidos ativos permitidos.
 */
export const authorizeExtended = ({ allowedCredentials = [], allowedCargos = [] }) => {
  if (
    (!Array.isArray(allowedCredentials) || allowedCredentials.length === 0) &&
    (!Array.isArray(allowedCargos) || allowedCargos.length === 0)
  ) {
    console.warn('[authorizeExtended] Nenhuma credencial ou cargo permitido foi especificado.');
    // Lançar erro ou permitir tudo? Por segurança, vamos negar se nada for especificado.
    // throw new Error('authorizeExtended requer um array de credenciais de acesso ou cargos permitidos.');
    // Ou, mais seguro, negar acesso se mal configurado:
    return (req, res, next) => {
        return res.status(500).json({ message: 'Erro de configuração de autorização.' });
    };
  }

  return async (req, res, next) => {
    // Garante que o usuário está autenticado e req.user existe
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Acesso não autorizado. Usuário não autenticado.' });
    }

    const { id: lodgeMemberId, credencialAcesso } = req.user;

    // 1. Verificar credencialAcesso
    if (allowedCredentials.length > 0 && credencialAcesso && allowedCredentials.includes(credencialAcesso)) {
      console.log(`[authorizeExtended] Acesso permitido para Maçom ID ${lodgeMemberId} via credencialAcesso: ${credencialAcesso}`);
      return next();
    }

    // 2. Se não permitido pela credencialAcesso, verificar cargos (se houver cargos a verificar)
    if (allowedCargos.length > 0) {
      if (!CargoExercido) {
        console.error("MODELO INDEFINIDO: db.CargoExercido não está disponível no authorizeExtended.middleware.");
        return res.status(500).json({ message: "Erro interno do servidor (modelo de cargos não pronto)." });
      }
      try {
        const cargosAtivos = await CargoExercido.findAll({
          where: {
            lodgeMemberId: lodgeMemberId,
            dataTermino: null // Considera ativo se dataTermino for NULL
            // Ou, para incluir cargos que terminam no futuro:
            // [Op.or]: [
            //   { dataTermino: null },
            //   { dataTermino: { [Op.gte]: new Date() } }
            // ]
          },
          attributes: ['nomeCargo']
        });

        if (cargosAtivos && cargosAtivos.length > 0) {
          const nomesCargosAtivos = cargosAtivos.map(cargo => cargo.nomeCargo);
          console.log(`[authorizeExtended] Maçom ID ${lodgeMemberId} - Cargos Ativos: ${nomesCargosAtivos.join(', ')} - Cargos Permitidos para Rota: ${allowedCargos.join(', ')}`);
          
          const hasRequiredCargo = nomesCargosAtivos.some(cargoDoUsuario => allowedCargos.includes(cargoDoUsuario));

          if (hasRequiredCargo) {
            console.log(`[authorizeExtended] Acesso permitido para Maçom ID ${lodgeMemberId} via cargo: ${nomesCargosAtivos.find(c => allowedCargos.includes(c))}`);
            return next();
          }
        } else {
            console.log(`[authorizeExtended] Maçom ID ${lodgeMemberId} não possui cargos ativos.`);
        }
      } catch (error) {
        console.error('Erro no middleware authorizeExtended ao verificar cargos:', error);
        return res.status(500).json({ message: 'Erro interno do servidor ao verificar permissões de cargo.' });
      }
    }

    // Se chegou aqui, nenhuma das condições de permissão foi atendida
    console.log(`[authorizeExtended] Acesso NEGADO para Maçom ID ${lodgeMemberId}. Credencial: ${credencialAcesso}. Cargos não suficientes ou não verificados.`);
    let requiredPermissionsMessage = [];
    if(allowedCredentials.length > 0) requiredPermissionsMessage.push(`credenciais: ${allowedCredentials.join(', ')}`);
    if(allowedCargos.length > 0) requiredPermissionsMessage.push(`cargos ativos: ${allowedCargos.join(', ')}`);
    
    return res.status(403).json({ message: `Acesso negado. Requer ${requiredPermissionsMessage.join(' OU ')}.` });
  };
};