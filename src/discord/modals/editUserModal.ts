import { ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import { Modal } from "../registry/Modal";
import Constants from "../../Constants";
import Database from "../../Database";
import Utils from "../../Utils";

export default class EditUserModal extends Modal {
    constructor() {
        super("editUserModal-", true);
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        const values = interaction.fields.fields.map((field) => {
            return {
                name: field.customId,
                value: interaction.fields.getTextInputValue(field.customId),
            }
        });

        await interaction.deferReply({ ephemeral: true });

        const verification = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [interaction.customId.split("-")[1]]);
        const discordId = verification.DiscordID;
        if (!discordId) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const nome = values.find((value) => value.name === "nome");
        const sexo = values.find((value) => value.name === "sexo");
        const numero = values.find((value) => value.name === "numero");
        const matricula = values.find((value) => value.name === "matricula");
        const nomeDeFaina = values.find((value) => value.name === "nome-faina");

        if (!nome || !sexo || !numero || !matricula || !nomeDeFaina) {
            await interaction.editReply({ content: "Por favor, preencha todos os campos." });
            return;
        }

        await Database.run("UPDATE Users SET Nome = ?, Sexo = ?, NMec = ?, Matricula = ?, NomeDeFaina = ? WHERE DiscordID = ?",
            [nome.value, sexo.value, numero.value, matricula.value, nomeDeFaina.value, discordId]);

        const user = await interaction.guild?.members.fetch(discordId);
        if (!user) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }
        await Utils.updateNickname(user);

        const member = await interaction.guild?.members.fetch(discordId);
        if (!member) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        if (Number(matricula.value) >= 5)
            await member?.roles.add(Constants.ROLES.MESTRE);
        else
            await member?.roles.remove(Constants.ROLES.MESTRE);

        const embed = new EmbedBuilder()
            .setTitle("Atualização de dados")
            .setDescription(`Os dados de ${user} foram atualizados.`)
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setFields(
                { name: "Nome", value: nome.value, inline: true },
                { name: "NMec", value: numero.value, inline: true },
                { name: "Matrícula", value: matricula.value, inline: true },
                { name: "Nome de Faina", value: nomeDeFaina.value, inline: true },
                { name: "Sexo", value: sexo.value, inline: true }
            )
            .setFooter({
                text: `Dados atualizados por ${interaction.user.tag} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setAuthor({ name: `${member?.displayName} (${member?.id})`, iconURL: member?.user.displayAvatarURL() })
            .setTimestamp(Date.now());

        await interaction.editReply({ embeds: [embed]});
    }
}
