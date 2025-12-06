import Constants from './Constants';
import axios from 'axios';
import { Readable } from 'node:stream';

interface FireflyTransactionData {
    error_if_duplicate_hash?: boolean;
    apply_rules?: boolean;
    fire_webhooks?: boolean;
    group_title?: string;
    transactions: Array<{
        type: 'withdrawal' | 'deposit';
        date: string;
        amount: string;
        description: string;
        category_name?: string;
        source_id?: string;
        destination_id?: string;
        source_name?: string;
        destination_name?: string;
    }>;
}

const firefly_headers = {
    'Authorization': `Bearer ${Constants.FIREFLY.API_TOKEN}`,
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/json'
};

class BankUtils {
    public static async getBalance(): Promise<{
        success: boolean,
        message: string,
        balance?: string,
        currency?: string
    }> {
        try {
            const response = await axios.get(
                `${Constants.FIREFLY.API_URL}/accounts/${Constants.FIREFLY.ACCOUNT_ID}`,
                {
                    headers: firefly_headers
                }
            );

            if (response.status === 200) {
                const data = response.data.data;
                const balance = data.attributes.current_balance;
                const currency = data.attributes.currency_symbol || data.attributes.currency_code;
                return {
                    success: true,
                    message: "Saldo obtido com sucesso.",
                    balance: balance,
                    currency: currency
                };
            } else {
                return {
                    success: false,
                    message: `Erro ao obter o saldo da conta do Firefly III: ${response.status} - ${response.statusText}`
                };
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    success: false,
                    message: `Erro ao aceder à API do Firefly III: ${error.response?.status} - ${error.response?.statusText}`
                };
            }
            return {
                success: false,
                message: `Erro desconhecido ao aceder à API do Firefly III: ${error}`
            };
        }
    }

    public static async getTransactionInfo(transactionId: string): Promise<{
        success: boolean;
        message: string;
        transaction?: any;
        attachments?: Array<{ buffer: Buffer; filename: string }>;
    }> {
        try {
            const transactionResponse = await axios.get(
                `${Constants.FIREFLY.API_URL}/transactions/${transactionId}`,
                {
                    headers: firefly_headers
                }
            );

            if (transactionResponse.status !== 200) {
                return {
                    success: false,
                    message: `Erro ao obter a transação: ${transactionResponse.status} - ${transactionResponse.statusText}`
                };
            }

            const transaction = transactionResponse.data.data.attributes.transactions[0];

            const attachmentsResponse = await axios.get(
                `${Constants.FIREFLY.API_URL}/transactions/${transactionId}/attachments`,
                {
                    headers: firefly_headers
                }
            );

            const attachmentsList: Array<{ buffer: Buffer; filename: string }> = [];

            if (attachmentsResponse.status === 200 && attachmentsResponse.data.data.length > 0) {
                for (const attachment of attachmentsResponse.data.data) {
                    const attachmentId = attachment.id;
                    const filename = attachment.attributes.filename;

                    try {
                        const downloadResponse = await axios.get(
                            `${Constants.FIREFLY.API_URL}/attachments/${attachmentId}/download`,
                            {
                                headers: firefly_headers,
                                responseType: 'arraybuffer'
                            }
                        );

                        if (downloadResponse.status === 200) {
                            attachmentsList.push({
                                buffer: Buffer.from(downloadResponse.data),
                                filename: filename
                            });
                        }
                    } catch (error) {
                        console.error(`Erro ao baixar anexo ${attachmentId}:`, error);
                    }
                }
            }

            return {
                success: true,
                message: "Transação obtida com sucesso.",
                transaction: transaction,
                attachments: attachmentsList.length > 0 ? attachmentsList : undefined
            };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    return {
                        success: false,
                        message: `Transação com ID ${transactionId} não encontrada.`
                    };
                }
                return {
                    success: false,
                    message: `Erro ao aceder à API do Firefly III: ${error.response?.status} - ${error.response?.statusText}`
                };
            }
            return {
                success: false,
                message: `Erro desconhecido: ${error}`
            };
        }
    }

    public static async generateTransactionsPDF(): Promise<{
        success: boolean;
        message: string;
        pdfBuffer?: Buffer
    }> {
        try {
            const PDFDocument = require('pdfkit');

            const response = await axios.get(
                `${Constants.FIREFLY.API_URL}/accounts/${Constants.FIREFLY.ACCOUNT_ID}/transactions`,
                {
                    headers: firefly_headers,
                    params: {
                        limit: 1000,
                        type: 'all'
                    }
                }
            );

            if (response.status !== 200) {
                return {
                    success: false,
                    message: `Erro ao obter transações: ${response.status} - ${response.statusText}`
                };
            }

            const transactions = response.data.data;

            const balanceResult = await this.getBalance();
            const currentBalance = balanceResult.success ? parseFloat(balanceResult.balance || '0') : 0;

            const doc = new PDFDocument({
                margin: 30,
                size: 'A4',
                layout: 'landscape'
            });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));

            return new Promise((resolve) => {
                doc.on('end', () => {
                    resolve({
                        success: true,
                        message: 'PDF gerado com sucesso.',
                        pdfBuffer: Buffer.concat(chunks)
                    });
                });

                doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Transações - BancoECT', { align: 'center' });
                doc.moveDown(0.75);
                doc.fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, { align: 'center' });
                doc.moveDown(0.75);
                doc.fontSize(11).font('Helvetica-Bold').text(`Saldo Atual: €${currentBalance.toFixed(2)}`, { align: 'center' });
                doc.moveDown(1.5);

                const tableTop = doc.y;
                const startX = 30;
                const rowHeight = 25;

                const colWidths = {
                    id: 30,
                    type: 90,
                    value: 50,
                    foreign: 120,
                    category: 100,
                    description: 390
                };

                const positions = {
                    id: startX,
                    type: startX + colWidths.id,
                    value: startX + colWidths.id + colWidths.type,
                    foreign: startX + colWidths.id + colWidths.type + colWidths.value,
                    category: startX + colWidths.id + colWidths.type + colWidths.value + colWidths.foreign,
                    description: startX + colWidths.id + colWidths.type + colWidths.value + colWidths.foreign + colWidths.category
                };

                const drawRow = (y: number, data: any, isHeader = false) => {
                    const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
                    const fontSize = isHeader ? 10 : 9;

                    doc.font(font).fontSize(fontSize);

                    doc.rect(positions.id, y, colWidths.id, rowHeight).stroke();
                    doc.rect(positions.type, y, colWidths.type, rowHeight).stroke();
                    doc.rect(positions.value, y, colWidths.value, rowHeight).stroke();
                    doc.rect(positions.foreign, y, colWidths.foreign, rowHeight).stroke();
                    doc.rect(positions.category, y, colWidths.category, rowHeight).stroke();
                    doc.rect(positions.description, y, colWidths.description, rowHeight).stroke();

                    const textY = y + 8;
                    const padding = 5;

                    doc.text(data.id, positions.id + padding, textY, {
                        width: colWidths.id - padding * 2,
                        align: 'left',
                        ellipsis: true
                    });
                    doc.text(data.type, positions.type + padding, textY, {
                        width: colWidths.type - padding * 2,
                        align: 'left',
                        ellipsis: true
                    });
                    doc.text(data.value, positions.value + padding, textY, {
                        width: colWidths.value - padding * 2,
                        align: 'right',
                        ellipsis: true
                    });
                    doc.text(data.foreign, positions.foreign + padding, textY, {
                        width: colWidths.foreign - padding * 2,
                        align: 'left',
                        ellipsis: true
                    });
                    doc.text(data.category, positions.category + padding, textY, {
                        width: colWidths.category - padding * 2,
                        align: 'left',
                        ellipsis: true
                    });
                    doc.text(data.description, positions.description + padding, textY, {
                        width: colWidths.description - padding * 2,
                        align: 'left',
                        ellipsis: true
                    });
                };

                drawRow(tableTop, {
                    id: 'ID',
                    type: 'Tipo Movimento',
                    value: 'Valor',
                    foreign: 'Conta Estrangeira',
                    category: 'Categoria',
                    description: 'Descrição'
                }, true);

                let currentY = tableTop + rowHeight;

                for (const transaction of transactions) {
                    const trans = transaction.attributes.transactions[0];

                    // if (trans.type === 'opening balance') continue;

                    if (currentY > 550) {
                        doc.addPage({ layout: 'landscape' });
                        currentY = 30;

                        drawRow(currentY, {
                            id: 'ID',
                            type: 'Tipo Movimento',
                            value: 'Valor',
                            foreign: 'Conta Estrangeira',
                            category: 'Categoria',
                            description: 'Descrição'
                        }, true);
                        currentY += rowHeight;
                    }

                    const id = trans.transaction_journal_id?.toString() || 'N/A';
                    const type = trans.type === 'withdrawal' ? 'Levantamento' :
                        trans.type === 'deposit' ? 'Depósito' :
                        trans.type === 'opening balance' ? 'Depósito Inicial' : 'Outro';
                    const amount = `€${parseFloat(trans.amount).toFixed(2)}`;
                    const foreignAccount = trans.type === 'withdrawal' ?
                        (trans.destination_name || 'N/A') :
                        (trans.source_name || 'N/A');
                    const category = trans.category_name || 'N/A';
                    const description = trans.description || 'N/A';

                    drawRow(currentY, {
                        id: id,
                        type: type,
                        value: amount,
                        foreign: foreignAccount,
                        category: category,
                        description: description
                    });

                    currentY += rowHeight;
                }

                const pageCount = doc.bufferedPageRange().count;
                const totalTransactions = transactions.filter((t: any) => t.attributes.transactions[0].type !== 'opening balance').length;

                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    const footerY = doc.page.height - 40;

                    doc.fontSize(8).font('Helvetica').text(
                        `Página ${i + 1} de ${pageCount} | Total de transações: ${totalTransactions}`,
                        0,
                        footerY,
                        {
                            align: 'center',
                            width: doc.page.width
                        }
                    );
                }

                doc.end();
            });

        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    success: false,
                    message: `Erro ao aceder à API do Firefly III: ${error.response?.status} - ${error.response?.statusText}`
                };
            }
            return {
                success: false,
                message: `Erro desconhecido: ${error}`
            };
        }
    }


    public static async createTransaction(
        type: 'withdrawal' | 'deposit',
        amount: number,
        description: string,
        foreignName: string,
        category?: string,
        attachment?: { buffer: Buffer; filename: string; contentType: string }
    ): Promise<{ success: boolean; message: string; transactionId?: string }> {
        try {
            const transactionData: FireflyTransactionData = {
                error_if_duplicate_hash: false,
                apply_rules: true,
                fire_webhooks: true,
                transactions: [
                    {
                        type: type,
                        date: new Date().toISOString(),
                        amount: amount.toFixed(2),
                        description: description,
                        category_name: category,
                        source_id: type === 'withdrawal' ? Constants.FIREFLY.ACCOUNT_ID : undefined,
                        destination_id: type === 'deposit' ? Constants.FIREFLY.ACCOUNT_ID : undefined,
                        source_name: type === 'deposit' ? foreignName : undefined,
                        destination_name: type === 'withdrawal' ? foreignName : undefined
                    }
                ]
            };

            const response = await axios.post(
                `${Constants.FIREFLY.API_URL}/transactions`,
                transactionData,
                {
                    headers: firefly_headers
                }
            );

            if (response.status === 200 || response.status === 201) {
                const transactionId = response.data.data?.attributes?.transactions?.[0]?.transaction_journal_id;

                if (attachment && transactionId) {
                    const uploadResult = await this.uploadAttachment(transactionId, attachment);
                    if (!uploadResult.success) {
                        return {
                            success: false,
                            message: `Transação criada, mas erro ao carregar o anexo: ${uploadResult.message}`,
                            transactionId: transactionId
                        };
                    }
                }

                return {
                    success: true,
                    message: "Transação criada com sucesso.",
                    transactionId: transactionId
                };
            }

            return {
                success: false,
                message: `Erro ao criar a transação no Firefly III: ${response.status} - ${response.statusText}`
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    success: false,
                    message: `Erro ao aceder à API do Firefly III: ${error.response?.status} - ${error.response?.statusText}`
                };
            }
            return {
                success: false,
                message: `Erro desconhecido ao aceder à API do Firefly III: ${error}`
            };
        }
    }

    public static async uploadAttachment(
        transactionId: string,
        attachment: { buffer: Buffer; filename: string; contentType: string }
    ): Promise<{ success: boolean; message: string }> {
        try {
            const existingAttachmentsResponse = await axios.get(
                `${Constants.FIREFLY.API_URL}/transactions/${transactionId}/attachments`,
                {
                    headers: firefly_headers
                }
            );

            const existingAttachments = existingAttachmentsResponse.data.data || [];

            const duplicateAttachment = existingAttachments.find(
                (att: any) => att.attributes.filename === attachment.filename
            );

            if (duplicateAttachment) {
                return {
                    success: false,
                    message: `Já existe um anexo com o nome "${attachment.filename}" nesta transação.`
                };
            }

            const stream = Readable.from(attachment.buffer);
            const response = await axios.post(
                `${Constants.FIREFLY.API_URL}/attachments`,
                {
                    filename: attachment.filename,
                    attachable_type: 'TransactionJournal',
                    attachable_id: transactionId,
                    title: attachment.filename,
                    notes: 'Attachment uploaded via Discord bot'
                },
                {
                    headers: firefly_headers
                }
            );

            if (response.status !== 200 && response.status !== 201) {
                return {
                    success: false,
                    message: `Erro ao carregar o anexo no Firefly III: ${response.status} - ${response.statusText}`
                };
            }

            const uploadResponse = await axios.post(
                `${Constants.FIREFLY.API_URL}/attachments/${response.data.data.id}/upload`,
                stream,
                {
                    headers: {
                        ...firefly_headers,
                        'Content-Type': 'application/octet-stream'
                    }
                }
            );

            if (uploadResponse.status !== 204) {
                await axios.delete(
                    `${Constants.FIREFLY.API_URL}/attachments/${response.data.data.id}`,
                    {
                        headers: firefly_headers
                    }
                );
                return {
                    success: false,
                    message: `Erro ao enviar o anexo para o Firefly III: ${uploadResponse.status} - ${uploadResponse.statusText}`
                };
            }

            const totalAttachments = existingAttachments.length + 1;
            return {
                success: true,
                message: `Anexo carregado com sucesso. Total de anexos: ${totalAttachments}.`
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    success: false,
                    message: `Erro ao aceder à API do Firefly III: ${error.response?.status} - ${error.response?.statusText}`
                };
            }
            return {
                success: false,
                message: `Erro desconhecido ao aceder à API do Firefly III: ${error}`
            };
        }
    }

    public static async deleteTransaction(
        transactionId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.delete(
                `${Constants.FIREFLY.API_URL}/transactions/${transactionId}`,
                {
                    headers: firefly_headers
                }
            );

            if (response.status === 204) {
                return {
                    success: true,
                    message: "Transação eliminada com sucesso."
                };
            } else {
                return {
                    success: false,
                    message: `Erro ao eliminar a transação no Firefly III: ${response.status} - ${response.statusText}`
                };
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    success: false,
                    message: `Erro ao aceder à API do Firefly III: ${error.response?.status} - ${error.response?.statusText}`
                };
            }
            return {
                success: false,
                message: `Erro desconhecido ao aceder à API do Firefly III: ${error}`
            };
        }
    }
}

export default BankUtils;
