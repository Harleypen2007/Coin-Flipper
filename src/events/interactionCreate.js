/* Import required modules and files */
const { Collection, InteractionType } = require('discord.js');
const defaultData = require('./../util/defaultData/users').main;

/* Global variable definitions */
const cooldowns = new Collection();
const quotaExceeded = false;

module.exports = {
	name: 'interactionCreate',
	once: false,

	/**
	 * Triggered when an interaction is used.
	 * 
	 * @param {object} interaction - Discord interaction object
	 * @param {object} client - Discord Client object
	 * @param {object} firestore - Firestore database object
	 * 
	 * @returns {void}
	**/
	execute: async (interaction, client, firestore) => {
		const now = Date.now();

		/* Is interaction a command? */
		if (interaction.type === InteractionType.ApplicationCommand) {
			await interaction.deferReply();

			const cmd = client.commands.get(interaction.commandName);
			if (!cmd) return;

			/* Is the database available? */
			if (quotaExceeded == true) {
				interaction.followUp({ content: 'Sorry, we are experiencing some technical difficulties, please try again later.', ephemeral: true });
				return;
			}

			/* Is the command working? */
			if (cmd['error'] == true) {
				interaction.followUp({ content: 'Sorry, this command is currently unavailable. Please try again later.', ephemeral: true });
				return;
			}

			if (cmd['permissions'] != []) {
				for (const permission of cmd['permissions']) {
					/* Loops through and check permissions agasint the user */
					if (!interaction.member.permissions.has(permission)) {
						interaction.followUp({ content: 'Sorry, you do not have permission to run this command.', ephemeral: true });
						return;
					}
				}
			}


			/* Receive userdata from the Firestore Database */
			const collection = await firestore.collection('users').doc(interaction.user.id).get();
			const userData = collection.data() || defaultData;

			/* Work out the appropriate cooldown time */
			if (!cooldowns.has(cmd.name)) cooldowns.set(cmd.name, new Collection());
			const timestamps = cooldowns.get(cmd.name);
			let cooldownAmount = (cmd.cooldown || 0) * 1000;

			if (cmd.name == 'flip' && interaction.channel.id == '832245298969182246') cooldownAmount = 0;
			if (userData.donator == 1) cooldownAmount = Math.floor(cooldownAmount * 0.75);
			if (userData.donator == 2) cooldownAmount = Math.floor(cooldownAmount * 0.5);


			/* Execute the command file */
			cmd.execute({ interaction, client, firestore, userData })
			
				.then((res) => {
					if (res == true) {
						/* Set and delete the cooldown */
						timestamps.set(interaction.user.id, now);
						setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
					}
				})
				
				.catch((err) => {
					console.log(err);
				});

		}

	},
};
