import { MentionableSelectMenuInteraction, MessageFlags } from "discord.js";
import { MentionableSelectMenu } from "../registry/MentionableSelectMenu";
import Reminders from "../managers/Reminders";

export default class ReminderMention extends MentionableSelectMenu {
    constructor() {
        super("reminderMention-", true);
    }

    public async execute(interaction: MentionableSelectMenuInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reminderId = parseInt(interaction.customId.split("-")[1]);

        if (!Reminders.checkIfReminderExists(reminderId)) {
            await interaction.editReply("Este lembrete não existe.");
            return;
        }

        const rolesToMention = interaction.roles;
        const usersToMention = interaction.users;

        const values = [...rolesToMention.keys(), ...usersToMention.keys()];

        await Reminders.setMentionsOnReminder(reminderId, values);

        if (values.length === 0) {
            await interaction.editReply("Menções removidas com sucesso.\n\nPara adicionar menções, basta selecionar as opções acima.");
            return;
        }

        let content = "Menções registadas: \n";
        if (rolesToMention.size > 0)
            content += "- Cargos: " + rolesToMention.map(role => `<@&${role.id}>`).join(", ") + "\n";
        if (usersToMention.size > 0)
            content += "- Membros: " + usersToMention.map(user => `<@${user.id}>`).join(", ");
        content += "\n\nPara remover as menções, basta desmarcar as opções acima.\n";
        content += "Para adicionar mais menções, basta selecionar mais opções acima.";

        await interaction.editReply({ content });
    }
}
