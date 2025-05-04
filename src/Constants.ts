import { ColorResolvable } from "discord.js"
import dotenv from 'dotenv';

dotenv.config();

type RanksType = {
    [key: number]: {
        M: string,
        F: string
    }
}

type EmbedColorsType = {
    ACCEPTED: ColorResolvable,
    DENIED: ColorResolvable,

    UPDATE_IN_PROGRESS: ColorResolvable,
    UPDATE_COMPLETED_WITH_NO_ERRORS: ColorResolvable,
    UPDATE_COMPLETED_WITH_ERRORS: ColorResolvable
}

class Constants {
    static ranks: RanksType = {
        1: {'M': 'Moliço', 'F': 'Moliço'},
        2: {'M': 'Junco', 'F': 'Caniça'},
        3: {'M': 'Moço', 'F': 'Moça'},
        4: {'M': 'Marnoto', 'F': 'Salineira'},
        5: {'M': 'Mestre', 'F': 'Mestre'}
    };

    static GUILD_ID = process.env.GUILD_ID as string;
    static VERIFICATION_CHANNEL_ID = process.env.VERIFICATIONS_CHANNEL_ID as string;
    static DMS_CHANNEL_ID = process.env.DMS_CHANNEL_ID as string;

    static BACKUPS = {
        INTERVAL_MINUTES: parseInt(process.env.BACKUP_INTERVAL_MINUTES as string),
        CHANNEL_ID: process.env.BACKUP_CHANNEL_ID as string
    }

    static EMBED_COLORS: EmbedColorsType = {
        ACCEPTED: "#00FF00",
        DENIED: "#FF0000",

        UPDATE_IN_PROGRESS: "#00bbff",
        UPDATE_COMPLETED_WITH_NO_ERRORS: "#00FF00",
        UPDATE_COMPLETED_WITH_ERRORS: "#ff9900"
    }

    static ROLES = {
        ALUVIAO: process.env.ALUVIAO_ROLE_ID as string,
        VETERANO: process.env.VETERANO_ROLE_ID as string,
        MESTRE: process.env.MESTRE_ROLE_ID as string,
        COMISSAO_DE_FAINA: process.env.CF_ROLE_ID as string,
        MESTRE_DE_CURSO: process.env.MC_ROLE_ID as string,
        CS_ST: process.env.CS_ST_ROLE_ID as string,
        MESTRE_DO_SALGADO: process.env.MS_ROLE_ID as string,
        MESTRE_PESCADOR: process.env.MP_ROLE_ID as string,
        MESTRE_ESCRIVAO: process.env.ME_ROLE_ID as string,
    }
}

export default Constants;
