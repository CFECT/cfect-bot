import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";
import Constants from "../../Constants";

export default class FindUserCommand extends Command {
    constructor() {
        super("find-user", "Procura utilizadores");
    }

    private static readonly MAX_USERS = 8;

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const query = interaction.options.getString("query", true);

        const users = await Database.getAll("SELECT * FROM Users WHERE Nome LIKE ? OR NMec = ? OR NomeDeFaina LIKE ?", [`%${query}%`, query, `%${query}%`]);
        users.sort((a: any, b: any) => (a.NMec as number) - (b.NMec as number));


        if (users.length === 0) {
            await interaction.editReply({ content: "Não foi possível encontrar nenhum utilizador." });
            return;
        }

        const embedList = [];

        embedList.push(new EmbedBuilder()
            .setTitle("Utilizadores encontrados")
            .setColor(Constants.EMBED_COLORS.ACCEPTED));

        let userCount = 0;

        for (const user of users) {
            const discordUser = await interaction.guild?.members.fetch(user.DiscordID).catch(() => null);

            if (!discordUser) {
                continue;
            }

            if (userCount >= FindUserCommand.MAX_USERS) {
                embedList.push(new EmbedBuilder().setColor(Constants.EMBED_COLORS.ACCEPTED));
                userCount = 0;
            }

            embedList[embedList.length-1].addFields({
                name: "Discord",
                value: discordUser.user.toString(),
                inline: true
            }).addFields({
                name: "Nome",
                value: user.Nome,
                inline: true
            }).addFields({
                name: "Número mecanográfico",
                value: user.NMec,
                inline: true
            });

            userCount++;
        }

        embedList[embedList.length-1].setFooter({
            text: `Dados pedidos por ${interaction.user.tag} (${interaction.user.id})`,
            iconURL: interaction.user.displayAvatarURL()
        }).setTimestamp(Date.now());

        await interaction.editReply({ embeds: embedList });
    }
}
