import { Routes, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import { REST } from "@discordjs/rest"
require("dotenv").config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env["COMMANDS_GUILD_ID"];

if (!token || !clientId) {
    console.error("Missing environment variables. Please check your .env file.");
    process.exit(1);
}

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Check the bot ping'),

    new SlashCommandBuilder().setName('relembrar').setDescription('Relembrar-te de algo')
        .addStringOption(option => option.setName('time').setDescription('Tempo para relembrar-te').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('Mensagem a relembrar-te').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('Relembra também um cargo').setRequired(false)),

    new SlashCommandBuilder().setName('nome-de-faina').setDescription('Efetua o pedido de mudança de nome de faina no servidor')
        .addStringOption(option => option.setName('nome').setDescription('Novo nome de faina').setRequired(true)),

    new SlashCommandBuilder().setName('completar-faina').setDescription('Marca/desmarcar a faina de um utilizador como completa')
        .addUserOption(option => option.setName('utilizador').setDescription('Utilizador cuja faina será marcada/desmarcada como completa').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('numero-aluviao').setDescription('Define o número de aluvião de um utilizador')
        .addUserOption(option => option.setName('utilizador').setDescription('Utilizador cujo número de aluvião será alterado').setRequired(true))
        .addStringOption(option => option.setName('numero').setDescription('Novo número de aluvião').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('caderno').setDescription('Controla o caderno')
        .addSubcommand(subcommand =>
            subcommand.setName('get').setDescription('Mostra o caderno atual')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reset').setDescription('Reinicia o caderno')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('set').setDescription('Define o valor do caderno')
                .addIntegerOption(option => option.setName('amount').setDescription('Novo valor do caderno').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add').setDescription('Adiciona traços ao caderno')
                .addIntegerOption(option => option.setName('amount').setDescription('Valor a adicionar ao caderno').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove').setDescription('Remove traços do caderno')
                .addIntegerOption(option => option.setName('amount').setDescription('Valor a remover ao caderno').setRequired(true))
        )
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('edit-user').setDescription('Edita os dados de um utilizador')
        .addUserOption(option => option.setName('utilizador').setDescription('Utilizador a editar').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('user-info').setDescription('Consulta os dados de um utilizador')
        .addUserOption(option => option.setName('utilizador').setDescription('Utilizador a consultar').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('send-verify-message').setDescription('Sends the message to setup the verification channel')
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('run-db').setDescription('Runs a command on the database')
        .addSubcommand(subcommand =>
            subcommand.setName('get').setDescription('Gets data from tables on the database')
                .addStringOption(option => option.setName('query').setDescription('Query to run on the database').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('run').setDescription('Runs a command on the database')
                .addStringOption(option => option.setName('query').setDescription('Query to run on the database').setRequired(true))
        )
        .setDefaultMemberPermissions(0),

    new ContextMenuCommandBuilder().setName('Completar faina').setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(0).setDMPermission(false),

    new ContextMenuCommandBuilder().setName('Número de aluvião').setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(0).setDMPermission(false),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token!);

if (guildId) {
    rest.put(Routes.applicationGuildCommands(clientId!, guildId), { body: commands })
        .then((data: any) => console.log(`Successfully registered ${data.length} application commands on guild ${guildId}.`))
        .catch(console.error);
} else {
    rest.put(Routes.applicationCommands(clientId!), { body: commands })
        .then((data: any) => console.log(`Successfully registered ${data.length} global application commands.`))
        .catch(console.error);
}
