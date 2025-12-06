import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";
import Utils from "../../Utils"
import Constants from "../../Constants";

export default class NomeDeFainaCommand extends Command {
    constructor() {
        super("nome-de-faina", "Efetua o pedido de mudança de nome no servidor");
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let newName = interaction.options.get('nome')?.value;

        const channel = interaction.guild?.channels.cache.get(Constants.VERIFICATION_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            await interaction.editReply({ content: "Não foi possível encontrar o canal de verificação. Por favor, contate um administrador." });
            return;
        }

        await Database.run("INSERT INTO NameChanges (DiscordID, NomeNovo) VALUES (?, ?)", [interaction.user.id, newName]);
        let id = await Database.getAll("SELECT * FROM NameChanges WHERE DiscordID = ? AND NomeNovo = ?", [interaction.user.id, newName]).catch(() => { return null; });
        if (!id || id.length === 0) {
            await interaction.editReply({ content: "Ocorreu um erro ao efetuar o pedido de mudança de nome. Por favor, contate um administrador." });
            return;
        }

        id = id.at(-1).ID;

        const acceptButton = new ButtonBuilder()
            .setCustomId(`acceptNameChange-${id}`)
            .setLabel('Aceitar')
            .setStyle(ButtonStyle.Success);
        const declineButton = new ButtonBuilder()
            .setCustomId(`declineNameChange-${id}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger);
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(acceptButton)
            .addComponents(declineButton);

        const user = await interaction.guild?.members.fetch(interaction.user.id);
        if (!user) {
            await interaction.editReply({ content: "Utilizador não encontrado!" });
            return;
        }
        const formattedNewName = await Utils.getFormattedName(user, newName as string);

        const embed = new EmbedBuilder()
            .setTitle(`Pedido de Mudança de Nome #${id}`)
            .setDescription(`Pedido de mudança de nome de ${interaction.user} para ${formattedNewName}`)
            .setAuthor({ name: `${interaction.user.tag} (${interaction.user.id})`, iconURL: interaction.user.displayAvatarURL() });

        await channel.send({ embeds: [embed], components: [actionRow] });

        await interaction.editReply({ content: `Pedido de mudança de nome com ID ${id} efetuado com sucesso! Aguarde a aprovação por parte de um elemento da Comissão de Faina.` });
    }
}
