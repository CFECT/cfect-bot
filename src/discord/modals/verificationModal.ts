import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { Modal } from "../registry/Modal";
import Constants from "../../Constants";
import Database from "../../Database";

export default class VerificationModal extends Modal {
    constructor() {
        super("verificationModal");
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        const values = interaction.fields.fields.map((field) => {
            return {
                name: field.customId,
                value: interaction.fields.getTextInputValue(field.customId),
            }
        });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.guild?.channels.cache.get(Constants.VERIFICATION_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            await interaction.editReply({ content: "O canal de verificações não foi encontrado. Por favor, contacte um administrador." });
            return;
        }

        const discordId = interaction.user.id;
        const nome = values.find((value) => value.name === "nome");
        const sexo = values.find((value) => value.name === "sexo")?.value.toUpperCase();
        const numero = values.find((value) => value.name === "numero");
        const matricula = values.find((value) => value.name === "matricula");
        const nomeDeFaina = values.find((value) => value.name === "nome-faina");

        if (!nome || !sexo || !numero || !matricula || !nomeDeFaina) {
            await interaction.editReply({ content: "Por favor, preencha todos os campos." });
            return;
        }
        if (isNaN(Number(matricula.value))) {
            await interaction.editReply({ content: "A matrícula deve ser um número." });
            return;
        }
        if (sexo !== "M" && sexo !== "F") {
            await interaction.editReply({ content: "O sexo deve ser M ou F." });
            return;
        }

        await Database.run("INSERT INTO Verifications (DiscordID, Nome, Sexo, NMec, Matricula, NomeDeFaina, InteractionMessageID) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           [discordId, nome.value, sexo, numero.value, matricula.value, nomeDeFaina.value, "-1"]);
        let id = await Database.getAll("SELECT * FROM Verifications WHERE DiscordID = ? AND Nome = ? AND Sexo = ? AND NMec = ? AND Matricula = ? AND NomeDeFaina = ?",
                                       [discordId, nome.value, sexo, numero.value, matricula.value, nomeDeFaina.value]).catch(() => { return null; });
        if (!id || id.length === 0) {
            await interaction.editReply({ content: "Ocorreu um erro ao efetuar o pedido de verificação. Por favor, contate um administrador." });
            return;
        }

        id = id.at(-1).ID;

        const verifyButton1 = new ButtonBuilder()
            .setCustomId(`acceptVerification-0-${id}`)
            .setLabel('Verificar Aluvião')
            .setStyle(ButtonStyle.Primary);
        const verifyButton2 = new ButtonBuilder()
            .setCustomId(`acceptVerification-1-${id}`)
            .setLabel('Verificar Veterano')
            .setStyle(ButtonStyle.Success);
        const declineButton = new ButtonBuilder()
            .setCustomId(`declineVerification-${id}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger);
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(verifyButton1)
            .addComponents(verifyButton2)
            .addComponents(declineButton);

        const embed = new EmbedBuilder()
            .setTitle(`Pedido de Verificação #${id}`)
            .setDescription(`Pedido de verificação de ${interaction.user}`)
            .addFields(
                { name: "Nome", value: nome.value, inline: true },
                { name: "NMec", value: numero.value, inline: true },
                { name: "Matrícula", value: matricula.value, inline: true },
                { name: "Nome de Faina", value: nomeDeFaina.value, inline: true },
                { name: "Sexo", value: sexo, inline: true }
            )
            .setAuthor({ name: `${interaction.user.tag} (${interaction.user.id})`, iconURL: interaction.user.displayAvatarURL() });

        await channel.send({ embeds: [embed], components: [actionRow] });
        await interaction.editReply({ content: "Pedido de verificação enviada com sucesso!" });
    }
}
