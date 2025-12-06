import { EmbedBuilder, MessageFlags, UserContextMenuCommandInteraction } from "discord.js";
import Database from "../../Database";
import Constants from "../../Constants";
import { UserContextMenu } from "../registry/UserContextMenu";

export default class UserInfoUCM extends UserContextMenu {
    constructor() {
        super("Informações do utilizador")
    }

    public async execute(interaction: UserContextMenuCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const user = interaction.targetUser;
        const discordId = user?.id;
        const member = interaction.guild?.members.cache.get(discordId as string);

        if (!member) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [discordId]);
        if (!userDb) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setTitle("Informação do Utilizador")
            .setDescription(`<@${discordId}>`)
            .setAuthor({
                name: `${member.user.username} (${member.user.id})`,
                iconURL: member.user.displayAvatarURL()
            })
            .setFields(
                { name: "Nome", value: userDb.Nome, inline: true },
                { name: "NMec", value: userDb.NMec, inline: true },
                { name: "Matrícula", value: userDb.Matricula, inline: true },
                { name: "Nome de Faina", value: userDb.NomeDeFaina, inline: true },
                { name: "Sexo", value: userDb.Sexo, inline: true },
                { name: "Número de Aluvião", value: userDb.NumeroAluviao, inline: true },
            )
            .setFooter({
                text: `Dados pedidos por ${interaction.user.tag} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp(Date.now());

        await interaction.editReply({ embeds: [embed] });
    }
}
