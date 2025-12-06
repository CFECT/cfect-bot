import { ActionRowBuilder, EmbedBuilder, MentionableSelectMenuBuilder, MessageFlags, PermissionsBitField, TextChannel, type ChatInputCommandInteraction } from "discord.js";
import { Command } from "../registry/Command";
import Reminders from "../managers/Reminders";
import Duration from "../../Duration"

export default class RelembrarCommand extends Command {
    constructor() {
        super("relembrar", "Relembrar-te de algo");
    }

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const timeInput = interaction.options.getString("time", true);
        const messageInput = interaction.options.getString("message", true);
        const channelInput = interaction.options.getChannel("channel");

        const userId = interaction.user.id;
        const guildId = interaction.guildId!;
        const channelId = channelInput?.id || interaction.channelId;
        const time = new Duration(timeInput).fromNow;

        if (isNaN(time.getTime()) || time.getTime() <= Date.now()) {
            await interaction.editReply("O tempo do lembrete é inválido.");
            setTimeout(() => {
                interaction.deleteReply();
            }, 2500);
            return;
        }
        if (time.getTime() < new Duration("1m").fromNow.getTime()) {
            await interaction.editReply("Meu puto, tás com alzheimer ou quê? A sério, um minuto? Se também fores assim na cama tás fodido.");
            return;
        }

        let reminderId;

        try {
            reminderId = await Reminders.saveReminder(userId, guildId, channelId, messageInput, time.getTime());
            if (!reminderId) throw new Error("Failed to save reminder.");
        } catch (error) {
            console.error(error);
            await interaction.editReply("Ocorreu um erro ao registar o lembrete.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("Lembrete registado")
            .setColor("#0099ff")
            .setTimestamp(time.getTime())
            .addFields({
                name: "Mensagem",
                value: messageInput,
                inline: false
            })
            .setFooter({
                text: `Lembrete de ${interaction.user.username} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const channel = interaction.channel as TextChannel;
        await channel.send({ embeds: [embed] });

        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.MentionEveryone)) {
            await interaction.editReply("Lembrete registado com sucesso.");
        } else {
            const selectMenu = new MentionableSelectMenuBuilder()
                .setCustomId("reminderMention-" + reminderId)
                .setPlaceholder("Mencionar pessoas ou cargos")
                .setMinValues(0)
                .setMaxValues(25);
            const actionRow = new ActionRowBuilder<MentionableSelectMenuBuilder>();
            await interaction.editReply({
                content: "Lembrete registado com sucesso.\n\nSe quiseres mencionar mais alguém no lembrete, seleciona-os aqui.\nPodes selecionar utilizadores individuais ou cargos.",
                components: [actionRow.addComponents(selectMenu)]
            });
        }
    }
}
