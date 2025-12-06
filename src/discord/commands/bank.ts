import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";
import BankUtils from "../../BankUtils";
import axios from "axios";

export default class BankCommand extends Command {
    constructor() {
        super("bank", "Controla o banco");
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === "account") {
            if (subcommand === "balance") {
                const result = await BankUtils.getBalance();

                const embed = new EmbedBuilder()
                    .setTimestamp()
                    .setFooter({ text: `BancoECT` });

                if (result.success) {
                    const balance = parseFloat(result.balance || '0');
                    const color = balance >= 0 ? Constants.EMBED_COLORS.ACCEPTED : Constants.EMBED_COLORS.DENIED;

                    embed
                        .setTitle("Saldo Atual do Banco")
                        .setDescription(`O saldo atual do banco é de **€${balance.toFixed(2)}**.`)
                        .setColor(color);
                } else {
                    embed
                        .setTitle("Erro ao Obter Saldo")
                        .setDescription("Ocorreu um erro ao tentar obter o saldo do banco: " + (result.message || "Erro desconhecido."))
                        .setColor(Constants.EMBED_COLORS.DENIED);
                }

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            if (subcommand === "report") {
                const embed = new EmbedBuilder()
                    .setTitle("Gerando Relatório")
                    .setDescription("A gerar o relatório de transações em PDF...")
                    .setColor(Constants.EMBED_COLORS.UPDATE_IN_PROGRESS)
                    .setTimestamp()
                    .setFooter({ text: `BancoECT` });

                await interaction.editReply({ embeds: [embed] });

                const result = await BankUtils.generateTransactionsPDF();

                if (result.success && result.pdfBuffer) {
                    const successEmbed = new EmbedBuilder()
                        .setTitle("Relatório Gerado com Sucesso")
                        .setDescription("O relatório de transações foi gerado com sucesso.")
                        .setColor(Constants.EMBED_COLORS.ACCEPTED)
                        .setTimestamp()
                        .setFooter({ text: `BancoECT` });

                    await interaction.editReply({
                        embeds: [successEmbed],
                        files: [{
                            attachment: result.pdfBuffer,
                            name: `transacoes_${new Date().toISOString().split('T')[0]}.pdf`
                        }]
                    });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle("Erro ao Gerar Relatório")
                        .setDescription(`Ocorreu um erro ao gerar o relatório: ${result.message}`)
                        .setColor(Constants.EMBED_COLORS.DENIED)
                        .setTimestamp()
                        .setFooter({ text: `BancoECT` });

                    await interaction.editReply({ embeds: [errorEmbed] });
                }
                return;
            }
        }

        if (subcommandGroup === "transaction") {
            if (subcommand === "info") {
                const transactionId = interaction.options.getString('id', true);

                const result = await BankUtils.getTransactionInfo(transactionId);

                if (result.success && result.transaction) {
                    const trans = result.transaction;

                    const type = trans.type === 'withdrawal' ? 'Levantamento' :
                        trans.type === 'deposit' ? 'Depósito' : trans.type;
                    const amount = `€${parseFloat(trans.amount).toFixed(2)}`;
                    const date = new Date(trans.date).toLocaleString('pt-PT');
                    const sourceAccount = trans.source_name || 'N/A';
                    const destinationAccount = trans.destination_name || 'N/A';
                    const description = trans.description || 'N/A';
                    const category = trans.category_name || 'N/A';

                    const embed = new EmbedBuilder()
                        .setTitle(`Informação da Transação #${transactionId}`)
                        .setColor(Constants.EMBED_COLORS.ACCEPTED)
                        .addFields(
                            { name: 'Tipo', value: type, inline: true },
                            { name: 'Valor', value: amount, inline: true },
                            { name: 'Data', value: date, inline: true },
                            { name: 'Categoria', value: category, inline: true },
                            { name: 'Conta de Origem', value: sourceAccount, inline: true },
                            { name: 'Conta de Destino', value: destinationAccount, inline: true },
                            { name: 'Descrição', value: description, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `BancoECT` });

                    if (result.attachments && result.attachments.length > 0) {
                        const attachmentsString = result.attachments.map((att) => `• ${att.filename}`).join('\n');
                        embed.addFields({
                            name: 'Anexos',
                            value: attachmentsString,
                            inline: false
                        });

                        await interaction.editReply({
                            embeds: [embed],
                            files: result.attachments.map(att => ({
                                attachment: att.buffer,
                                name: att.filename
                            }))
                        });
                    } else {
                        await interaction.editReply({ embeds: [embed] });
                    }
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle("Erro ao Obter Transação")
                        .setDescription(`Ocorreu um erro ao tentar obter a transação: ${result.message}`)
                        .setColor(Constants.EMBED_COLORS.DENIED)
                        .setTimestamp()
                        .setFooter({ text: `BancoECT` });

                    await interaction.editReply({ embeds: [errorEmbed] });
                }
                return;
            }

            if (subcommand === "add-attachment") {
                const transactionId = interaction.options.getString('id', true);
                const attachment = interaction.options.getAttachment('attachment', true);

                let attachmentData: { buffer: Buffer; filename: string; contentType: string };

                try {
                    const response = await axios.get(attachment.url, {
                        responseType: 'arraybuffer'
                    });
                    attachmentData = {
                        buffer: Buffer.from(response.data),
                        filename: attachment.name || 'anexo',
                        contentType: response.headers['content-type'] || 'application/octet-stream'
                    };
                } catch (error) {
                    await interaction.editReply({ content: "Erro ao baixar o anexo. Por favor, tenta novamente." });
                    return;
                }

                const result = await BankUtils.uploadAttachment(transactionId, attachmentData);

                const embed = new EmbedBuilder()
                    .setTimestamp()
                    .setFooter({ text: `BancoECT` });

                if (result.success) {
                    embed
                        .setTitle("Anexo Adicionado com Sucesso")
                        .setDescription(`O anexo foi adicionado à transação #${transactionId}.`)
                        .addFields({
                            name: 'Nome do Anexo',
                            value: attachment.name,
                            inline: false
                        })
                        .setColor(Constants.EMBED_COLORS.ACCEPTED);
                } else {
                    embed
                        .setTitle("Erro ao Adicionar Anexo")
                        .setDescription(`Ocorreu um erro ao tentar adicionar o anexo: ${result.message}`)
                        .setColor(Constants.EMBED_COLORS.DENIED);
                }

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            if (subcommand === "delete") {
                const transactionId = interaction.options.getString('id', true);

                const result = await BankUtils.deleteTransaction(transactionId);

                const embed = new EmbedBuilder()
                    .setTimestamp()
                    .setFooter({ text: `BancoECT` });

                if (result.success) {
                    embed
                        .setTitle("Transação Eliminada com Sucesso")
                        .setDescription(`A transação #${transactionId} foi eliminada com sucesso.`)
                        .setColor(Constants.EMBED_COLORS.ACCEPTED);
                } else {
                    embed
                        .setTitle("Erro ao Eliminar Transação")
                        .setDescription(`Ocorreu um erro ao tentar eliminar a transação: ${result.message}`)
                        .setColor(Constants.EMBED_COLORS.DENIED);
                }

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            if (subcommand === "deposit" || subcommand === "withdrawal") {
                const value = interaction.options.getInteger('amount', true);
                const description = interaction.options.getString('description', true);
                const foreignName = interaction.options.getString('foreign-name', true);
                const category = interaction.options.getString('category') || undefined;
                const attachment = interaction.options.getAttachment('comprovativo');

                let attachmentData: { buffer: Buffer; filename: string; contentType: string } | undefined;

                if (attachment) {
                    try {
                        const response = await axios.get(attachment.url, {
                            responseType: 'arraybuffer'
                        });
                        attachmentData = {
                            buffer: Buffer.from(response.data),
                            filename: attachment.name || 'comprovativo',
                            contentType: response.headers['content-type'] || 'application/octet-stream'
                        };
                    } catch (error) {
                        await interaction.editReply({ content: "Erro ao baixar o comprovativo. Por favor, tenta novamente." });
                        return;
                    }
                }

                const type = subcommand as 'deposit' | 'withdrawal';
                const result = await BankUtils.createTransaction(type, value, description, foreignName, category, attachmentData);

                const embed = new EmbedBuilder()
                    .setTimestamp()
                    .setFooter({ text: `BancoECT` });

                if (result.success) {
                    embed
                        .setTitle(`Sucesso no ${type === 'deposit' ? 'Depósito' : 'Levantamento'}`)
                        .addFields({
                            name: 'ID da Transação',
                            value: result.transactionId || 'N/A',
                            inline: true
                        })
                        .addFields({
                            name: 'Valor',
                            value: `€${value.toFixed(2)}`,
                            inline: true
                        })
                        .addFields({
                            name: 'Conta Estrangeira',
                            value: foreignName,
                            inline: true
                        })
                        .addFields({
                            name: 'Categoria',
                            value: category || 'N/A',
                            inline: true
                        })
                        .addFields({
                            name: 'Descrição',
                            value: description,
                            inline: true
                        })
                        .addFields({
                            name: 'Comprovativo',
                            value: attachment ? `[${attachment.name}](${attachment.url})` : 'N/A',
                            inline: false
                        })
                        .setColor(Constants.EMBED_COLORS.ACCEPTED);
                } else {
                    embed
                        .setTitle(`Erro no ${type === 'deposit' ? 'Depósito' : 'Levantamento'}`)
                        .setDescription(`Ocorreu um erro ao tentar realizar o ${type === 'deposit' ? 'depósito' : 'levantamento'}: ` + (result.message || "Erro desconhecido."))
                        .setColor(Constants.EMBED_COLORS.DENIED);
                }

                await interaction.editReply({ embeds: [embed] });
                return;
            }
        }

        await interaction.editReply({ content: "Subcomando não reconhecido. Por favor, tenta novamente." });
    }
}
