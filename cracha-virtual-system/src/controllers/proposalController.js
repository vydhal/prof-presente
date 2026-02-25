const { sendEmail } = require("../utils/email");

const submitProposal = async (req, res) => {
    try {
        const { name, email, phone, topic, description } = req.body;

        if (!name || !email || !topic || !description) {
            return res.status(400).json({ error: "Nome, e-mail, curso/palestra e descrição são obrigatórios." });
        }

        const subject = `Nova Proposta de Formação: ${topic}`;
        const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #137fec;">Nova Proposta: Compartilhe seu saber</h2>
        <p>Você recebeu uma nova proposta de formação (workshop/palestra):</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Nome do Proponente:</strong> ${name}</p>
        <p><strong>E-mail de Contato:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
        <p><strong>Tema/Título:</strong> ${topic}</p>
        <p><strong>Descrição da Proposta:</strong><br/> ${description.replace(/\n/g, '<br/>')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Email automático enviado pelo sistema EduAgenda.</p>
      </div>
    `;

        // send to the specific formations email address
        await sendEmail({
            to: "formacoes.seduc@edu.campinagrande.pb.gov.br",
            subject,
            html
        });

        res.status(200).json({ message: "Proposta enviada com sucesso!" });
    } catch (error) {
        console.error("Erro ao enviar proposta:", error);
        res.status(500).json({ error: "Erro interno do servidor ao enviar proposta." });
    }
};

module.exports = {
    submitProposal
};
