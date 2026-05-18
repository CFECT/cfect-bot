import { ActionRowBuilder, GuildMember, UserSelectMenuBuilder, type ChatInputCommandInteraction } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";

export default class BoteCommand extends Command {
    constructor() {
        super("set-cargo", "Atualiza os cargos da faina");
    }

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({});

        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand === "mc") {
            const newMc = interaction.options.getUser("utilizador", true);
            const oldMc = interaction.member as GuildMember;
            oldMc.fetch();

            await oldMc.roles.remove(Constants.ROLES.MESTRE_DE_CURSO);
            const newMcM = interaction.guild?.members.cache.get(newMc.id as string);
            await newMcM?.roles.add(Constants.ROLES.MESTRE_DE_CURSO);

            await interaction.editReply({ content: `Novo Mestre de Curso definido: ${newMc}` })
        }
        else if (subcommand == "cf") {
            const selectMenu = new UserSelectMenuBuilder()
                .setCustomId("set-cf-menu")
                .setPlaceholder("Selecionar pessoas")
                .setMinValues(5)
                .setMaxValues(10);
            const actionRow = new ActionRowBuilder<UserSelectMenuBuilder>();
            await interaction.editReply({
                content: "Seleciona no menu os novos elementos da Comissão de Faina",
                components: [actionRow.addComponents(selectMenu)]
            });
        }
    }
}
