/* Import required modules and files */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { achievementAdd } = require('./../../util/functions.js');
const defaultData = require('./../../util/defaultData/users.js').main;
const { itemlist } = require('./../../util/constants.js');

module.exports = {
	name: 'give',
	description: 'Help out and support another user!',
	usage: '`/give cents <user> <amount>`\n`/give item <user> <item>`',

	permissions: [],
	ownerOnly: false,
	guildOnly: true,
	developerOnly: false,

	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Help out and support another user!')

		.addSubcommand(subcommand => subcommand
			.setName('cents')
			.setDescription('Give cents to another user!')

			.addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
			.addIntegerOption(option => option.setName('amount').setDescription('How much would you like to give?')
				.setRequired(true).setMinValue(5).setMaxValue(50_000)),
		)

		.addSubcommand(subcommand => subcommand
			.setName('item')
			.setDescription('Give an item to another user!')

			.addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
			.addStringOption(option => option.setName('item').setDescription('Which item to give away?').setRequired(true)),
		),

	error: false,

	/**
	 * Help out and support another user.
	 * 
	 * @param {object} interaction - Discord Slash Command object
	 * @param {object} firestore - Firestore database object
	 * @param {object} userData - Discord User's data/information
	 * 
	 * @returns {boolean}
	**/
	execute: async ({ interaction, userData, firestore }) => {

		/* Get all the users' information */
		const user = interaction.options.getUser('user');
		const collection = await firestore.collection('users').doc(user.id).get();
		const thierData = collection.data() || defaultData;

		/* Retrieve sub command option */
		const subCommandName = interaction.options.getSubcommand();
		if (!subCommandName) {
			interaction.followUp({ content: 'Woah, an unexpected error has occurred. Please try again!' });
			return false;
		}

		if (subCommandName == 'cents') {

			/* How much money to give */
			const amount = interaction.options.getInteger('amount');
			if (amount > userData.currencies.cents) {
				interaction.followUp({ content: 'You don\'t have that much!' });
				return false;
			}

			/* Swap the money over */
			userData.currencies.cents = Number(userData.currencies.cents) - Number(amount);
			thierData.currencies.cents = Number(thierData.currencies.cents) + Number(amount);

			userData.giveData.cents = Number(userData.giveData.cents) + Number(amount);
			userData.giveData.users = Number(userData.giveData.users) + Number(1);

			/* Did they earn a new achievement? */
			if (amount >= 10000) userData = achievementAdd(userData, 'generous');
			if (amount == 5) userData = achievementAdd(userData, 'ungenerous');

			/* Set the new balances in the database */
			await firestore.doc(`/users/${interaction.user.id}`).set(userData);
			await firestore.doc(`/users/${user.id}`).set(thierData);

			const embed = new EmbedBuilder()
				.setColor('Green')
				.setTitle('Every little helps!')
				.setDescription(`You gave <@${user.id}> **${amount}** cents!\n\nYou now have ${userData.currencies.cents} and ${user.username} has ${thierData.currencies.cents}.`);

			/* Return true to enable the cooldown */
			interaction.followUp({ embeds: [embed] });
			return true;
		}

		if (subCommandName == 'item') {

			/* Locate the selected item */
			const itemName = interaction.options.getString('item');
			const item = itemlist.filter((i) => i.name == itemName.toLowerCase() || i.aliases.includes(itemName.toLowerCase()))[0];

			/* Do they have that item */
			if (userData.inv[item.id] < 1) {
				interaction.followUp({ content: 'You do not have that item.' });
				return false;
			}

			/* swap the items over */
			userData.inv[item.id] = Number(userData.inv[item.id]) - Number(1);

			if (item.id == 'pin') thierData.inv['pingiven'] = Number(thierData.inv['pingiven'] || 0) + Number(1);
			else thierData.inv[item.id] = Number(thierData.inv[item.id] || 0) + Number(1);

			await firestore.doc(`/users/${interaction.user.id}`).set(userData);
			await firestore.doc(`/users/${user.id}`).set(thierData);

			/* returns true to enable the cooldown */
			interaction.followUp({ content: `You gave **${user.username}** 1x ${item.prof}!` });
			return true;
		}

		return false;
	},
};
