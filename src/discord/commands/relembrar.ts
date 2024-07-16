import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { Command } from "../registry/Command";
import Reminders from "../extras/Reminders";
import Duration from "../../Duration"

export default class RelembrarCommand extends Command {
    constructor() {
        super("relembrar", "Relembrar-te de algo");
    }

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const timeInput = interaction.options.getString("time", true);
        const messageInput = interaction.options.getString("message", true);
        const roleInput = interaction.options.getRole("role", false);

        const userId = interaction.user.id;
        const member = await interaction.guild?.members.fetch(userId);
        if (roleInput && !member?.permissions.has("MentionEveryone")) {
            await interaction.editReply("Não tens permissões para mencionar cargos.");
            return;
        }
        const guildId = interaction.guildId!;
        const channelId = interaction.channelId;
        const roleId = roleInput ? roleInput.id : null;
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

        try {
            await Reminders.saveReminder(userId, guildId, channelId, roleId, messageInput, time.getTime());
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

        if (roleInput) {
            embed.addFields({
                name: "Cargo mencionado",
                value: roleInput.toString(),
                inline: false
            });
        }

        await interaction.channel?.send({ embeds: [embed] });
        await interaction.editReply("Lembrete registado com sucesso.");
    }
}
