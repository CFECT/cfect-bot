import { UserSelectMenuInteraction, MessageFlags } from "discord.js";
import { UserSelectMenu } from "../registry/UserSelectMenu";
import Constants from "../../Constants";

export default class SetCFMenu extends UserSelectMenu {
    constructor() {
        super("set-cf-menu", false);
    }

    public async execute(interaction: UserSelectMenuInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.member) {
            await interaction.editReply("Erro: Não foi possível obter as informações do membro.");
            return;
        }

        let isMC = false;
        if ("roles" in interaction.member) {
            const roles = interaction.member.roles;
            if ("cache" in roles) isMC = roles.cache.has(Constants.ROLES.MESTRE_DE_CURSO);
            else isMC = roles.includes(Constants.ROLES.MESTRE_DE_CURSO);
        }
        if (!isMC) {
            await interaction.editReply("Apenas o Mestre de Curso pode usar este menu.");
            return;
        }

        const cfRole = await interaction.guild?.roles.fetch(Constants.ROLES.COMISSAO_DE_FAINA).catch(() => null);
        if (!cfRole) {
            await interaction.editReply("Erro: Não foi possível encontrar o cargo da Comissão de Faina.");
            return;
        }

        const newCFMembers = await Promise.all(
            interaction.users.map(async (user) => {
                const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
                return member;
            })
        ).then((members) => members.filter((m): m is any => !!m));

        const notAddedUsers = interaction.users.filter((user) => !newCFMembers.some((member) => member.id === user.id));
        const toRemoveMembers = cfRole.members.filter((member) => !newCFMembers.some((newMember) => newMember.id === member.id));

        for (let member of toRemoveMembers.values()) await member.roles.remove(cfRole);
        for (let member of newCFMembers) await member.roles.add(cfRole);

        let content = "Nova CF definida: \n";
        for (let member of newCFMembers) content += `- ${member} (\`${member.id}\`)\n`;
        if (notAddedUsers.size > 0) {
            content += "\nOs seguintes utilizadores não foram adicionados porque não são membros do servidor:\n";
            notAddedUsers.forEach((user) => {
                content += `- ${user} (\`${user.id}\`)\n`;
            });
        }

        await interaction.editReply({ content });
    }
}
