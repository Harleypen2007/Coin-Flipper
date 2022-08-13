/* Import required modules and files */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('./../../util/emojis');
const defaultData = require('./../../util/defaultData/users').main;

module.exports = {
	name: 'userinfo',
	description: 'View a user\'s stats!',
	usage: '`/userinfo [user]`',

	permissions: [],
	ownerOnly: false,
	guildOnly: true,
	developerOnly: false,

	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('View a user\'s stats!')

		.addUserOption(option => option
			.setName('user')
			.setDescription('Select a user')
			.setRequired(false)),

	error: false,

	/**
	 * Collection of user-based, custom addons.
	 * 
	 * @param {object} interaction - Discord Slash Command object
	 * @param {object} firestore - Firestore database object
	 * 
	 * @returns {boolean}
	**/
	execute: async ({ interaction, firestore }) => {

		/* Get the user's information */
		const user = interaction.options.getUser('user') || interaction.user;
		const collection = await firestore.collection('users').doc(user.id).get();
		const userData = collection.data() || defaultData;

		/* Create the information embed */
		const embed = new EmbedBuilder()
			.setTitle(`${user.username}'s information`)
			.setColor('#cd7f32')
			.addFields(
				{ name: '**Settings**', value: `Evil mode: ${userData.evil ? emojis.true : emojis.false }\nCompact mode: ${userData.compact ? emojis.true : emojis.false }\nOnline mode: ${userData.online.online ? emojis.true : emojis.false }`, inline: false },
				{ name: '**Stats**', value: `Coins flipped: \`${userData.stats.flipped}\`\nMinigames won: \`${userData.stats.minigames_won}\`\nTimes worked: \`${userData.stats.timesWorked}\`\nKarate battles won: \`${userData.stats.timesWon}\`\nTrading sessions completed: \`${userData.stats.tradingSessionsCompleted || 0}\``, inline: false },
				{ name: '**Donator Status**', value: `${userData.donator == 0 ? 'None' : (userData.donator == 1 ? 'Gold' : 'Platinum')}`, inline: false },
			);

		/*  */
		interaction.followUp({ embeds: [embed] });
		return true;

	},
};