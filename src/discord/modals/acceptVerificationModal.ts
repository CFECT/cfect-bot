import { EmbedBuilder, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { Modal } from "../registry/Modal";
import Constants from "../../Constants";
import Database from "../../Database";
import Utils from "../../Utils";

export default class AcceptVerificationModal extends Modal {
    constructor() {
        super("acceptVerificationModal-", true);
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        const values = interaction.fields.fields.map((field) => {
            return {
                name: field.customId,
                value: interaction.fields.getTextInputValue(field.customId),
            }
        });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const verification = await Database.get("SELECT * FROM Verifications WHERE ID = ?", [interaction.customId.split("-")[2]]);
        if (!verification) {
            await interaction.editReply({ content: "Não foi possível encontrar o pedido de verificação." });
            return;
        }
        const discordId = verification.DiscordID;
        if (!discordId) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const nome = values.find((value) => value.name === "nome");
        const sexo = values.find((value) => value.name === "sexo")?.value.toUpperCase();
        const numero = values.find((value) => value.name === "numero");
        const matricula = values.find((value) => value.name === "matricula");
        const nomeDeFaina = values.find((value) => value.name === "nome-faina");
        const interactionMessageId = interaction.message?.id;
        const message = await interaction.channel?.messages.fetch(interactionMessageId as string);

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

        await Database.run("INSERT INTO Users (DiscordID, Nome, Sexo, NMec, Matricula, NomeDeFaina, FainaCompleta) VALUES (?, ?, ?, ?, ?, ?, ?)",
                          [discordId, nome.value, sexo, numero.value, matricula.value, nomeDeFaina.value, interaction.customId.split("-")[1]]);
        await Database.run("DELETE FROM Verifications WHERE ID = ?", [interaction.customId.split("-")[2]]);

        await interaction.guild?.members.fetch(discordId).then(async (member) => {
            try {
                await Utils.updateNickname(member);
                if (interaction.customId.split("-")[1] === "1") {
                    await member.roles.add(Constants.ROLES.VETERANO);
                    if (Number(matricula.value) >= 5)
                        await member.roles.add(Constants.ROLES.MESTRE);
                } else {
                    await member.roles.add(Constants.ROLES.ALUVIAO);
                }
            } catch (error) {
                console.error(error);
            }
        });

        const originalEmbed = message?.embeds[0].toJSON();
        const newEmbed = new EmbedBuilder(originalEmbed)
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setFields(
                { name: "Nome", value: nome.value, inline: true },
                { name: "NMec", value: numero.value, inline: true },
                { name: "Matrícula", value: matricula.value, inline: true },
                { name: "Nome de Faina", value: nomeDeFaina.value, inline: true },
                { name: "Sexo", value: sexo, inline: true },
                { name: "Faina Completa", value: interaction.customId.split("-")[1] === "1" ? "Sim" : "Não", inline: true}
            )
            .setFooter({
                text: `Verificação aceite por ${interaction.user.tag} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp(Date.now());

        await message?.edit({ embeds: [newEmbed], components: [] });

        const user = interaction.client.users.cache.get(discordId);
        if (user) {
            const dmEmbed = new EmbedBuilder()
                .setTitle("Verificação Aceite")
                .setColor(Constants.EMBED_COLORS.ACCEPTED)
                .setDescription(`O teu pedido de verificação foi aceite!\nBem-vindo ${interaction.customId.split("-")[1] === "1" ? "veterano" : "aluvião"}!`);
            await user.send({ embeds: [dmEmbed] }).catch(() => {});
        }

        await interaction.editReply({ content: `Verificação aceite!` });
    }
}
