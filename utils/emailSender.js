// backend/utils/emailSender.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path'; // Opcional, mas útil se precisar construir caminhos mais complexos para o .env
import { fileURLToPath } from 'url'; // Para obter __dirname em ES Modules

// Configurar __dirname para ES Modules (se for usá-lo para o path do .env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
// Ajuste o caminho se seu .env não estiver dois níveis acima (na raiz do projeto SysJPJ/)
// Se o seu .env estiver na pasta backend/, o caminho seria '../.env'
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Cria uma instância do transporter do Nodemailer.
 * Tenta usar as credenciais do .env para SMTP.
 * Se não estiverem configuradas e NODE_ENV for 'development', usa Ethereal.email para teste.
 * @returns {Promise<nodemailer.Transporter>}
 */
async function createTransporter() {
    // Verifica se as variáveis de ambiente para email estão configuradas
    const useRealSmtp = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (useRealSmtp) {
        // Configuração para servidor SMTP real
        console.log('Usando configuração SMTP real para envio de emails.');
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || "587", 10),
            secure: process.env.EMAIL_SECURE === 'true', // true para porta 465 (SSL)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            // tls: { // Descomente se necessário
            //   rejectUnauthorized: process.env.NODE_ENV === 'production' 
            // }
        });
    } else if (process.env.NODE_ENV === 'development') {
        // Se não houver config SMTP e estiver em desenvolvimento, usa Ethereal
        console.warn('Variáveis de ambiente para email (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) não configuradas. Usando Ethereal.email para desenvolvimento.');
        try {
            let testAccount = await nodemailer.createTestAccount();
            console.log('--------------------------------------------------------------------------------------');
            console.log('CONTA DE TESTE ETHEREAL CRIADA (para desenvolvimento de envio de emails):');
            console.log(`Usuário Ethereal: ${testAccount.user}`);
            console.log(`Senha Ethereal: ${testAccount.pass}`);
            console.log('Os emails enviados via Ethereal NÃO CHEGARÃO a caixas de entrada reais.');
            console.log('Uma URL de PREVIEW será exibida no console após o envio de cada email de teste.');
            console.log('--------------------------------------------------------------------------------------');

            return nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } catch (etherealError) {
            console.error('Falha ao criar conta de teste Ethereal:', etherealError);
            throw new Error('Falha ao configurar o serviço de email de desenvolvimento (Ethereal). Verifique sua conexão com a internet.');
        }
    } else {
        // Em produção, se não houver config SMTP, lança um erro ou retorna um transporter que falhará.
        console.error('ERRO CRÍTICO: Configuração de email (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) não encontrada para o ambiente de produção.');
        throw new Error('Serviço de email não configurado para produção.');
        // Alternativamente, para não quebrar a aplicação, mas logar o erro:
        // return {
        //     sendMail: () => Promise.reject(new Error('Serviço de email não configurado.'))
        // };
    }
}

/**
 * Envia um email.
 * @param {Object} mailDetails - Detalhes do email.
 * @param {string} mailDetails.to - Destinatário(s) do email.
 * @param {string} mailDetails.subject - Assunto do email.
 * @param {string} mailDetails.text - Corpo do email em texto puro.
 * @param {string} mailDetails.html - Corpo do email em HTML.
 * @returns {Promise<Object>} - Informações sobre o email enviado.
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Seu App" <no-reply@example.com>`, // Remetente (configure EMAIL_FROM no .env)
            to: to,
            subject: subject,
            text: text,
            html: html,
        };

        let info = await transporter.sendMail(mailOptions);

        console.log('Email enviado com sucesso: %s', info.messageId);

        // Se estiver usando Ethereal, exibe a URL de preview
        if (transporter.options && transporter.options.host === 'smtp.ethereal.email') {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('Preview URL (Ethereal): %s', previewUrl);
            }
        }
        return info;
    } catch (error) {
        console.error('Erro detalhado ao enviar email:', error);
        // Empacota o erro para que o chamador possa identificá-lo se necessário
        const emailSendingError = new Error(`Falha no serviço de envio de email. Detalhes: ${error.message}`);
        emailSendingError.originalError = error;
        throw emailSendingError; // Re-lança o erro para ser tratado pela função que chamou sendEmail
    }
};

export default sendEmail; // Exporta a função sendEmail como default