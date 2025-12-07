import { Routes, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import { REST } from "@discordjs/rest"
require("dotenv").config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
    console.error("Missing environment variables. Please check your .env file.");
    process.exit(1);
}

const global_commands = [
    new SlashCommandBuilder().setName('relembrar').setDescription('Relembrar-te de algo')
        .addStringOption(option => option.setName('time').setDescription('Tempo para relembrar-te').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('Mensagem a relembrar-te').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('Canal onde será enviado o lembrete')),

    new SlashCommandBuilder().setName('eval').setDescription('Evaluates javascript code')
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('logs').setDescription('Fetches the system logs for the bot service')
        .addIntegerOption(option => option.setName('lines').setDescription('Number of lines to fetch').setRequired(false))
        .addStringOption(option => option.setName('since').setDescription('Fetch logs since a specific time (e.g., "1h", "1w", etc.)').setRequired(false))
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

    new SlashCommandBuilder().setName('delete-user').setDescription('Deletes a user from the database')
        .addStringOption(option => option.setName('nmec').setDescription('Número mecanográfico do utilizador a eliminar'))
        .addStringOption(option => option.setName('discord-id').setDescription('ID do Discord do utilizador a eliminar'))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('backup-database').setDescription('Backs up the database')
        .setDefaultMemberPermissions(0),
].map(command => command.toJSON());

const cfect_commands = [
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

    new SlashCommandBuilder().setName('bote').setDescription('Botes')
        .addSubcommand(subcommand =>
            subcommand.setName('random').setDescription('Escolhe um bote aleatório')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add').setDescription('Adiciona um bote')
            .addStringOption(option => option.setName('autor').setDescription('Autor do bote').setRequired(true))
            .addStringOption(option => option.setName('bote').setDescription('Bote').setRequired(true))
        ),

    new SlashCommandBuilder().setName('edit-user').setDescription('Edita os dados de um utilizador')
        .addUserOption(option => option.setName('utilizador').setDescription('Utilizador a editar').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('user-info').setDescription('Consulta os dados de um utilizador')
        .addUserOption(option => option.setName('utilizador').setDescription('Utilizador a consultar').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('find-user').setDescription('Procura utilizadores')
        .addStringOption(option => option.setName('query').setDescription('Query a procurar (número mecanográfico ou parte do nome)').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('bank').setDescription('Controla o banco')
        .addSubcommandGroup(group =>
            group.setName('account').setDescription('Operações da conta')
                .addSubcommand(subcommand =>
                    subcommand.setName('balance').setDescription('Mostra o saldo atual do banco'))
                .addSubcommand(subcommand =>
                    subcommand.setName('report').setDescription('Gera um relatório de transações em PDF')))
        .addSubcommandGroup(group =>
            group.setName('transaction').setDescription('Operações de transações')
                .addSubcommand(subcommand =>
                    subcommand.setName('info').setDescription('Mostra a informação de uma transação específica')
                        .addStringOption(option => option.setName('id').setDescription('ID da transação').setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('deposit').setDescription('Deposita dinheiro no banco')
                        .addIntegerOption(option => option.setName('amount').setDescription('Quantia a depositar').setRequired(true))
                        .addStringOption(option => option.setName('description').setDescription('Descrição do depósito').setRequired(true))
                        .addStringOption(option => option.setName('foreign-name').setDescription('Nome estrangeiro associado ao depósito').setRequired(true))
                        .addStringOption(option => option.setName('category').setDescription('Categoria do depósito').setRequired(false))
                        .addAttachmentOption(option => option.setName('comprovativo').setDescription('Comprovativo do depósito').setRequired(false)))
                .addSubcommand(subcommand =>
                    subcommand.setName('withdrawal').setDescription('Levanta dinheiro do banco')
                        .addIntegerOption(option => option.setName('amount').setDescription('Quantia a levantar').setRequired(true))
                        .addStringOption(option => option.setName('description').setDescription('Descrição do levantamento').setRequired(true))
                        .addStringOption(option => option.setName('foreign-name').setDescription('Nome estrangeiro associado ao levantamento').setRequired(true))
                        .addStringOption(option => option.setName('category').setDescription('Categoria do levantamento').setRequired(false))
                        .addAttachmentOption(option => option.setName('comprovativo').setDescription('Comprovativo do levantamento').setRequired(false)))
                .addSubcommand(subcommand =>
                    subcommand.setName('add-attachment').setDescription('Adiciona um anexo a uma transação existente')
                        .addStringOption(option => option.setName('id').setDescription('ID da transação').setRequired(true))
                        .addAttachmentOption(option => option .setName('attachment').setDescription('Anexo a adicionar').setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('delete').setDescription('Elimina uma transação existente')
                        .addStringOption(option => option.setName('id').setDescription('ID da transação').setRequired(true))))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('numero-aluviao-bulk').setDescription('Define o número de aluvião de vários utilizadores')
        .addAttachmentOption(option => option.setName('ficheiro').setDescription('Ficheiro CSV com os números mecanográficos e de aluvião').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('completar-faina-bulk').setDescription('Completa a faina de vários utilizadores')
        .addAttachmentOption(option => option.setName('ficheiro').setDescription('Ficheiro CSV com os números mecanográficos').setRequired(true))
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('update-matriculas').setDescription('Atualiza a matrícula de todos os utilizadores')
        .setDefaultMemberPermissions(0),

    new SlashCommandBuilder().setName('enforce-member-structure').setDescription('Atualiza os nomes e roles dos utilizadores')
        .setDefaultMemberPermissions(0),

    new ContextMenuCommandBuilder().setName('Completar faina').setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(0).setDMPermission(false),

    new ContextMenuCommandBuilder().setName('Número de aluvião').setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(0).setDMPermission(false),

    new ContextMenuCommandBuilder().setName('Editar utilizador').setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(0).setDMPermission(false),

    new ContextMenuCommandBuilder().setName('Informações do utilizador').setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(0).setDMPermission(false),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token!);

rest.put(Routes.applicationCommands(clientId!), { body: global_commands })
    .then((data: any) => console.log(`Successfully registered ${data.length} global application commands.`))
    .catch(console.error);

if (guildId) {
    rest.put(Routes.applicationGuildCommands(clientId!, guildId), { body: cfect_commands })
    .then((data: any) => console.log(`Successfully registered ${data.length} application commands on guild ${guildId}.`))
    .catch(console.error);
}
