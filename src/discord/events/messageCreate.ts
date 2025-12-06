import { Client, EmbedBuilder, Message, TextBasedChannel, TextChannel } from 'discord.js';
import Constants from '../../Constants';

export async function run(client: Client, message: Message) {
    if (message.author.bot) return;
    if (message.channel.isDMBased()) handleDmMessage(client, message);
    if (message.reference && message.channel.id === Constants.DMS_CHANNEL_ID) handleDmsChannelReplyMessage(client, message);
    if (message.channel.id === Constants.DMS_CHANNEL_ID) handleDmsChannelMessage(client, message);
}

async function handleDmMessage(client: Client, message: Message) {
    const dms_channel = await client.channels.fetch(Constants.DMS_CHANNEL_ID) as TextChannel;

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${message.author.tag} (${message.author.id})`,
            iconURL: message.author.displayAvatarURL()
        })
        .setColor("#0099ff")
        .setDescription(message.content)
        .setFooter({
            text: message.id
        })
        .setTimestamp(Date.now());

    if (message.reference) {
        const referenceMessageId = message.reference.messageId;
        const referenceMessage = await message.author.dmChannel?.messages.fetch(referenceMessageId as string).catch(() => null);
        if (referenceMessage) {
            const originalMessageId = referenceMessage.embeds[0].footer?.text;
            if (originalMessageId) {
                const originalMessage = await dms_channel.messages.fetch(originalMessageId).catch(() => null);
                if (originalMessage) {
                    originalMessage.reply({ embeds: [embed] });
                    return;
                }
            }
        }
    }

    await dms_channel.send({ embeds: [embed] });
}

async function handleDmsChannelReplyMessage(client: Client, message: Message) {
    const referenceMessage = await message.channel.messages.fetch(message.reference!.messageId as string);
    if (!referenceMessage.author.bot) return;

    const author_id = referenceMessage.embeds[0].author?.name?.split(' ')[1].replace('(', '').replace(')', '');
    if (!author_id) return;

    const author = await client.users.fetch(author_id);
    if (!author) return;

    const originalMessageId = referenceMessage.embeds[0].footer?.text;
    if (!originalMessageId) return;
    const originalMessage = await author.dmChannel?.messages.fetch(originalMessageId).catch(() => null);
    if (!originalMessage) return;

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${message.author.tag} (${message.author.id})`,
            iconURL: message.author.displayAvatarURL()
        })
        .setColor("#0099ff")
        .setDescription(message.content)
        .setFooter({
            text: message.id
        })
        .setTimestamp(Date.now());

    await originalMessage.reply({ embeds: [embed] });
}

async function handleDmsChannelMessage(client: Client, message: Message) {
    if (message.author.bot) return;

    if (message.content.startsWith('<@')) {
        const mentionedUser = message.mentions.users.first();
        if (!mentionedUser) return;

        const content = message.content.split(' ').slice(1).join(' ');

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${message.author.tag} (${message.author.id})`,
                iconURL: message.author.displayAvatarURL()
            })
            .setColor("#0099ff")
            .setDescription(content)
            .setFooter({
                text: message.id
            })
            .setTimestamp(Date.now());

        await mentionedUser.send({ embeds: [embed] });
    }
}
