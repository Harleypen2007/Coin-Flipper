const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'set-cost',
	description: 'Set the price of your custom addon!',
	usage: '`/set-cost <name> <cost>`',

	permissions: [],
	ownerOnly: false,
	guildOnly: true,
	developerOnly: false,

	data: new SlashCommandBuilder()
		.setName('set-cost')
		.setDescription('Set the price of your custom addon!')

		.addStringOption(option => option
			.setName('name').setDescription('What is the addon\'s name?').setRequired(true),
		)
		.addIntegerOption(option => option
			.setName('cost').setDescription('How much for?').setRequired(true),
		),

	error: false,
	execute: async ({ interaction, firestore, userData }) => {
		const name = interaction.options.getString('name');
		const invalid = ['none', 'null', 'undefined', 'nan'];

		if (name.length > 50 || invalid.includes(name.toLowerCase()) || name.includes(' ')) {
			interaction.followUp({ content: 'That is an invalid addon name.' });
			return;
		}

		const cost = interaction.options.getInteger('cost');
		if (cost > 500 && userData.donator == 0) {
			interaction.followUp({ content: 'Your addon can not cost more than 500 cents.' });
			return;
		}
		else if (cost > 1500) {
			interaction.followUp({ content: 'Your addon can not cost more than 1500 cents.' });
			return;
		}

		const paths = [
			'first',
			'second',
			'third',
		];

		let complete = false;
		for (const path of paths) {
			if (userData.addons.customaddons[path].name.toLowerCase() == name) {
				complete = true;
				userData.addons.customaddons[path].cost = Number(cost);
			}
		}

		if (complete == false) {
			return interaction.followUp({ content: 'You do not have an addon of that name.' });
		}

		const embed = new MessageEmbed()
			.setTitle('Updated Cost')
			.setDescription(`You set the cost of **${name}** to **${cost} cents**!`);

		interaction.followUp({ embeds: [embed] });
		await firestore.doc(`/users/${interaction.user.id}`).set(userData);

	},
};