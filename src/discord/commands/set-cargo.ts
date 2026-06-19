import { ActionRowBuilder, GuildMember, UserSelectMenuBuilder, type ChatInputCommandInteraction } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";

export default class SetCargoCommand extends Command {
    constructor() {
        super("set-cargo", "Atualiza os cargos da faina");
    }

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({});

        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand === "mc") return this.executeMC(interaction);
        else if (subcommand == "cf") return this.executeCF(interaction);
    }

    public async executeMC(interaction: ChatInputCommandInteraction): Promise<void> {
        const newMc = interaction.options.getUser("utilizador", true);
        const oldMc = interaction.member as GuildMember;
        await oldMc.fetch();

        const newMcM = await interaction.guild?.members.fetch(newMc.id).catch(() => null);
        if (!newMcM) {
            await interaction.editReply({ content: "O novo Mestre de Curso não é um membro do servidor." });
            return;
        }

        await oldMc.roles.remove(Constants.ROLES.MESTRE_DE_CURSO);
        await newMcM.roles.add(Constants.ROLES.MESTRE_DE_CURSO);

        await interaction.editReply({ content: `Novo Mestre de Curso definido: ${newMc}` });


    }

    public async executeCF(interaction: ChatInputCommandInteraction): Promise<void> {
        const selectMenu = new UserSelectMenuBuilder()
            .setCustomId("set-cf-menu")
            .setPlaceholder("Selecionar pessoas")
            .setMinValues(5)
            .setMaxValues(10);
        const actionRow = new ActionRowBuilder<UserSelectMenuBuilder>();
        await interaction.editReply({
            content: "Seleciona no menu **todos** os novos elementos da Comissão de Faina",
            components: [actionRow.addComponents(selectMenu)]
        });
    }
}
