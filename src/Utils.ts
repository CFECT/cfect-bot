import { EmbedBuilder, Guild, GuildMember, Message, MessageEditOptions } from 'discord.js';
import Constants from './Constants';
import Database from './Database.js';

class Utils {
    public static async getFormattedName(user: GuildMember, name?: string): Promise<string> {
        const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [user.id]);
        if (!userDb)
            return name ? name : user.displayName;

        const year = userDb.Matricula >= 5 || userDb.Matricula <= 0 ? 5 : userDb.Matricula as number;
        const sex = userDb.Sexo === 'F' ? 'F' : 'M';
        if (name) {
            for (let rank of Object.values(Constants.ranks))
                if (Object.values(rank).includes(name.split(' ')[0]))
                    name = name.split(' ').slice(1).join(' ');
        }

        let rank = userDb.FainaCompleta ? Constants.ranks[year][sex] : `[A${userDb.NumeroAluviao}]`
        if (userDb.FainaCompleta) {
            if (user.roles.cache.has(Constants.ROLES.CS_ST)) rank = "Conselheiro";
            if (user.roles.cache.has(Constants.ROLES.MESTRE_DO_SALGADO)) rank = "Mestre do Salgado";
            if (user.roles.cache.has(Constants.ROLES.MESTRE_PESCADOR)) rank = "Mestre Pescador";
            if (user.roles.cache.has(Constants.ROLES.MESTRE_ESCRIVAO)) rank = "Mestre Escrivão";
            if (user.roles.cache.has(Constants.ROLES.MESTRE_DE_CURSO)) {
                if (userDb.Matricula >= 5)
                    rank = "Mestre de Curso";
                else
                    rank = userDb.Sexo === 'F' ? "Varina" : "Arrais";
            }
        }

        return `${rank} ${name ? name : userDb.NomeDeFaina}`;
    }

    public static async updateNickname(user: GuildMember): Promise<void> {
        if (!user.manageable) return;
        const newName = await Utils.getFormattedName(user);
        await user.setNickname(newName);
    }

    public static async updateMatriculas(message: Message): Promise<void> {
        const getEmbedFields = (memberBeingUpdated: GuildMember, current: number, total: number) => {
            return [
                { name: "A atualizar", value: memberBeingUpdated.toString(), inline: true },
                { name: "Progresso", value: `${current}/${total}`, inline: true }
            ]
        }

        const getEmbed = (memberBeingUpdated: GuildMember, current: number, total: number) => {
            return new EmbedBuilder()
                .setTitle("Atualização de matrículas")
                .setDescription("A atualizar as matrículas de todos os utilizadores...")
                .setFields(getEmbedFields(memberBeingUpdated, current, total))
                .setColor(Constants.EMBED_COLORS.UPDATE_IN_PROGRESS)
                .setTimestamp(Date.now());
        }

        const not_found: string[] = [];
        const processing_errors: string[] = [];

        const query = "UPDATE Users SET Matricula = ? WHERE DiscordID = ?";
        const members = await message.guild?.members.fetch();
        const total = members!.size;
        let current = 0;
        for (const member of members!.values()) {
            await message.edit({ content: "", embeds: [getEmbed(member, current, total)] });
            current++;
            const user = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [member.id]);
            if (!user) {
                not_found.push(`- ${member.displayName} - ${member.id}`);
                continue;
            }
            const year = parseInt(user.Matricula) + 1;

            await Database.run(query, [year, member.id]).then(async () => {
                if (year <= 5)
                    await Utils.updateNickname(member);
                if (year >= 5)
                    await member.roles.add(Constants.ROLES.MESTRE);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }).catch((error) => {
                processing_errors.push(`- ${member.displayName} - ${member.id} - ${error}`);
            });
        }

        if (not_found.length === 0 && processing_errors.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("Atualização de matrículas")
                .setDescription("As matrículas de todos os utilizadores foram atualizadas.")
                .setColor(Constants.EMBED_COLORS.UPDATE_COMPLETED_WITH_NO_ERRORS)
                .setTimestamp(Date.now());
            await message.edit({ content: "", embeds: [embed], components: [] });
            return;
        }

        let messageContent = "";
        if (not_found.length > 0)
            messageContent += `## Users not found on the database:\n${not_found.join("\n")}\n\n`;
        if (processing_errors.length > 0)
            messageContent += `## Errors processing users:\n${processing_errors.join("\n")}`;

        const embed = new EmbedBuilder()
            .setTitle("Atualização de matrículas")
            .setDescription("As matrículas de todos os utilizadores foram atualizadas.\nNo entanto, ocorreram alguns erros, que podem ser vistos no anexo.")
            .setColor(Constants.EMBED_COLORS.UPDATE_COMPLETED_WITH_ERRORS)
            .setTimestamp(Date.now());

        const messageToSend: MessageEditOptions = {
            content: "",
            embeds: [embed],
            files: [{
                attachment: Buffer.from(messageContent),
                name: "errors.md"
            }]
        }

        await message.edit(messageToSend);
    }

    public static async updateNumerosAluviaoBulk(message: Message, text: string): Promise<void> {
        const getEmbedFields = (nmec: string, memberBeingUpdated: GuildMember | null, current: number, total: number) => {
            const member = memberBeingUpdated ? memberBeingUpdated : { toString: () => "N/A" };
            return [
                { name: "Número Mecanográfico", value: nmec, inline: true },
                { name: "Utilizador", value: member.toString(), inline: true },
                { name: "Progresso", value: `${current}/${total}`, inline: true }
            ]
        }

        const getEmbed = (nmec: string, memberBeingUpdated: GuildMember | null, current: number, total: number) => {
            return new EmbedBuilder()
                .setTitle("Atualização de Números de Aluvião")
                .setDescription("A atualizar números de aluvião...")
                .setFields(getEmbedFields(nmec, memberBeingUpdated, current, total))
                .setColor(Constants.EMBED_COLORS.UPDATE_IN_PROGRESS)
                .setTimestamp(Date.now());
        }

        const invalid_lines: string[] = [];
        const not_found: string[] = [];
        const processing_errors: string[] = [];

        const query = "UPDATE Users SET NumeroAluviao = ? WHERE NMec = ?";
        const lines = text.split("\n");
        const total = lines.length;
        let current = 0;
        for (const line of lines) {
            current++;
            if (line === "") continue;
            await new Promise(resolve => setTimeout(resolve, 1000));
            const [nmec, naluviao] = line.split(',');

            await message.edit({ content: "", embeds: [getEmbed(nmec ?? "N/A", null, current, total)] });

            if (!nmec || !naluviao) {
                invalid_lines.push(`- Line ${current} - ${line}`);
                continue;
            }

            const user = await Database.get("SELECT * FROM Users WHERE NMec = ?", [nmec]);
            if (!user) {
                not_found.push(`- ${nmec}`);
                continue;
            }
            const discordUserId = user.DiscordID;
            await message.edit({ content: "", embeds: [getEmbed(nmec, (await message.guild?.members.fetch(discordUserId).catch(() => {})) ?? null, current, total)] });

            await Database.run(query, [naluviao, nmec]).then(async () => {
                if (!user.FainaCompleta) {
                    const member = await message.guild?.members.fetch(discordUserId as string) as GuildMember;
                    await Utils.updateNickname(member);
                }
            }).catch((error) => {
                processing_errors.push(`- Line ${current} - ${line} - ${error}`);
            });
        }

        if (invalid_lines.length === 0 && not_found.length === 0 && processing_errors.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("Atualização de Números de Aluvião")
                .setDescription("Os números de aluvião de todos os utilizadores foram atualizados com sucesso.")
                .setColor(Constants.EMBED_COLORS.UPDATE_COMPLETED_WITH_NO_ERRORS)
                .setTimestamp(Date.now());
            await message.edit({ content: "", embeds: [embed], components: [] });
            return;
        }

        let messageContent = "";
        if (invalid_lines.length > 0)
            messageContent += `## Invalid lines:\n${invalid_lines.join("\n")}\n\n`;
        if (not_found.length > 0)
            messageContent += `## Users not found on the database:\n${not_found.join("\n")}\n\n`;
        if (processing_errors.length > 0)
            messageContent += `## Errors processing lines:\n${processing_errors.join("\n")}`;

        const embed = new EmbedBuilder()
            .setTitle("Atualização de Números de Aluvião")
            .setDescription("Os números de aluvião de todos os utilizadores foram atualizados com sucesso.\nNo entanto, ocorreram alguns erros, que podem ser vistos no anexo.")
            .setColor(Constants.EMBED_COLORS.UPDATE_COMPLETED_WITH_ERRORS)
            .setTimestamp(Date.now());

        const messageToSend: MessageEditOptions = {
            content: "",
            embeds: [embed],
            files: [{
                attachment: Buffer.from(messageContent),
                name: "errors.md"
            }]
        }

        await message.edit(messageToSend);
    }

    public static async completarFainaBulk(message: Message, text: string): Promise<void> {
        const getEmbedFields = (nmec: string, memberBeingUpdated: GuildMember | null, current: number, total: number) => {
            const member = memberBeingUpdated ? memberBeingUpdated : { toString: () => "N/A" };
            return [
                { name: "Número Mecanográfico", value: nmec, inline: true },
                { name: "Utilizador", value: member.toString(), inline: true },
                { name: "Progresso", value: `${current}/${total}`, inline: true }
            ]
        }

        const getEmbed = (nmec: string, memberBeingUpdated: GuildMember | null, current: number, total: number) => {
            return new EmbedBuilder()
                .setTitle("Completar Faina")
                .setDescription("A marcar a faina de utilizadores como completa...")
                .setFields(getEmbedFields(nmec, memberBeingUpdated, current, total))
                .setColor(Constants.EMBED_COLORS.UPDATE_IN_PROGRESS)
                .setTimestamp(Date.now());
        }

        const invalid_lines: string[] = [];
        const not_found: string[] = [];
        const processing_errors: string[] = [];

        const query = "UPDATE Users SET FainaCompleta = true WHERE NMec = ?";
        const lines = text.split("\n");
        const total = lines.length;
        let current = 0;
        for (const nmec of lines) {
            current++;
            if (nmec === "") continue;
            await new Promise(resolve => setTimeout(resolve, 1000));

            await message.edit({ content: "", embeds: [getEmbed(nmec ?? "N/A", null, current, total)] });

            if (!nmec || nmec.length <= 4 || nmec.length >= 7 || isNaN(parseInt(nmec))) {
                invalid_lines.push(`- Line ${current} - ${nmec}`);
                continue;
            }

            const user = await Database.get("SELECT * FROM Users WHERE NMec = ?", [nmec]);
            if (!user) {
                not_found.push(`- ${nmec}`);
                continue;
            }
            const discordUserId = user.DiscordID;
            const member = await message.guild?.members.fetch(discordUserId as string).catch(() => {});
            if (!member) {
                not_found.push(`- ${nmec}`);
                continue;
            }
            await message.edit({ content: "", embeds: [getEmbed(nmec, member ?? null, current, total)] });

            await Database.run(query, [nmec]).then(async () => {
                await member.roles.remove(Constants.ROLES.ALUVIAO);
                await member.roles.add(Constants.ROLES.VETERANO);
                if (user.Matricula >= 5)
                    await member.roles.add(Constants.ROLES.MESTRE);
                await Utils.updateNickname(member);
            }).catch((error) => {
                processing_errors.push(`- Line ${current} - ${nmec} - ${error}`);
            });
        }

        if (invalid_lines.length === 0 && not_found.length === 0 && processing_errors.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("Completar Faina")
                .setDescription("A faina de todos os utilizadores foi marcada como completa com sucesso.")
                .setColor(Constants.EMBED_COLORS.UPDATE_COMPLETED_WITH_NO_ERRORS)
                .setTimestamp(Date.now());
            await message.edit({ content: "", embeds: [embed], components: [] });
            return;
        }

        let messageContent = "";
        if (invalid_lines.length > 0)
            messageContent += `## Invalid lines:\n${invalid_lines.join("\n")}\n\n`;
        if (not_found.length > 0)
            messageContent += `## Users not found on the database:\n${not_found.join("\n")}\n\n`;
        if (processing_errors.length > 0)
            messageContent += `## Errors processing lines:\n${processing_errors.join("\n")}`;

        const embed = new EmbedBuilder()
            .setTitle("Completar Faina")
            .setDescription("A faina de todos os utilizadores foi marcada como completa com sucesso.\nNo entanto, ocorreram alguns erros, que podem ser vistos no anexo.")
            .setColor(Constants.EMBED_COLORS.UPDATE_COMPLETED_WITH_ERRORS)
            .setTimestamp(Date.now());

        const messageToSend: MessageEditOptions = {
            content: "",
            embeds: [embed],
            files: [{
                attachment: Buffer.from(messageContent),
                name: "errors.md"
            }]
        }

        await message.edit(messageToSend);
    }

    public static async *enforceMemberStructure(guild: Guild): AsyncGenerator<GuildMember> {
        const users = await guild.members.fetch();
        for (const user of users?.values() || []) {
            if (user.user.bot) continue;
            if (!user.manageable) continue;
            if (user.roles.cache.size === 0) continue;

            const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [user.id]);
            if (!userDb) continue;

            yield user;

            const formattedName = await Utils.getFormattedName(user);
            if (user.nickname !== formattedName) await user.setNickname(formattedName, "Correção de nomes automática");
            if (userDb.Matricula >= 5 && !user.roles.cache.has(Constants.ROLES.MESTRE))
                await user.roles.add(Constants.ROLES.MESTRE);
            else if (userDb.Matricula < 5 && user.roles.cache.has(Constants.ROLES.MESTRE))
                await user.roles.remove(Constants.ROLES.MESTRE);
        }
    }
}

export default Utils;
