import type { Client, Interaction } from "discord.js";
import { MessageFlags } from "discord.js";
import CommandRegistry from "../registry/CommandRegistry";
import ButtonRegistry from "../registry/ButtonRegistry";
import ModalRegistry from "../registry/ModalRegistry";
import UserContextMenuRegistry from "../registry/UserContextMenuRegistry";
import MentionableSelectMenuRegistry from "../registry/MentionableSelectMenuRegistry";

export function run(_: Client, interaction: Interaction) {
    if (interaction.isChatInputCommand()) runCommand(_, interaction);
    else if (interaction.isModalSubmit()) runModal(_, interaction);
    else if (interaction.isButton()) runButton(_, interaction);
    else if (interaction.isUserContextMenuCommand()) runUserContextMenu(_, interaction);
    else if (interaction.isMentionableSelectMenu()) runMentionableSelectMenu(_, interaction);
}

function runCommand(_: Client, interaction: Interaction) {
    // If the interaction is not a command, return
    if (!interaction.isChatInputCommand()) return;

    // Get the command from the collection
    const command = CommandRegistry.getCommand(interaction.commandName);

    // If the command does not exist, return
    if (!command) {
        interaction.reply({ content: "Command not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Try to run the command
    try {
        command.execute(interaction);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral });
    }
}

function runModal(_: Client, interaction: Interaction) {
    // If the interaction is not a modal, return
    if (!interaction.isModalSubmit()) return;

    // Get the modal from the collection
    const modal = ModalRegistry.getModal(interaction.customId);

    // If the modal does not exist, return
    if (!modal) {
        interaction.reply({ content: "Modal not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Try to run the modal
    try {
        modal.execute(interaction);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "There was an error while executing this modal!", flags: MessageFlags.Ephemeral });
    }
}

function runButton(_: Client, interaction: Interaction) {
    // If the interaction is not a button, return
    if (!interaction.isButton()) return;

    // Get the button from the collection
    const button = ButtonRegistry.getButton(interaction.customId);

    // If the button does not exist, return
    if (!button) {
        interaction.reply({ content: "Button not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Try to run the button
    try {
        button.execute(interaction);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "There was an error while executing this button!", flags: MessageFlags.Ephemeral });
    }
}

function runUserContextMenu(_: Client, interaction: Interaction) {
    // If the interaction is not a UserContextMenu, return
    if (!interaction.isUserContextMenuCommand()) return;

    // Get the userContextMenu from the collection
    const userContextMenu = UserContextMenuRegistry.getUserContextMenu(interaction.commandName);

    // If the userContextMenu does not exist, return
    if (!userContextMenu) {
        interaction.reply({ content: "User context menu not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Try to run the userContextMenu
    try {
        userContextMenu.execute(interaction);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "There was an error while executing this user context menu!", flags: MessageFlags.Ephemeral });
    }
}

function runMentionableSelectMenu(_: Client, interaction: Interaction) {
    // If the interaction is not a mentionableSelectMenu, return
    if (!interaction.isMentionableSelectMenu()) return;

    // Get the mentionableSelectMenu from the collection
    const mentionableSelectMenu = MentionableSelectMenuRegistry.getMentionableSelectMenu(interaction.customId);

    // If the mentionableSelectMenu does not exist, return
    if (!mentionableSelectMenu) {
        interaction.reply({ content: "Mentionable Select Menu not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Try to run the mentionableSelectMenu
    try {
        mentionableSelectMenu.execute(interaction);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "There was an error while executing this mentionableSelectMenu!", flags: MessageFlags.Ephemeral });
    }
}
