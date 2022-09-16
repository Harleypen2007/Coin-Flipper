/* Import required modules and files */
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const emojis = require('./../../util/emojis');
const { itemlist, joblist } = require('./../../util/constants');
const defaultData = require('./../../util/defaultData/users').main;

module.exports = {
	name: 'balance',
	description: 'View a user\'s balance!',
	usage: '`/balance [user]`',

	permissions: [],
	guildOnly: false,

	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('View a user\'s balance!')
		.setDMPermission(true)

		.addUserOption(option => option
			.setName('user').setDescription('Select a user').setRequired(false)),

	error: false,

	/**
	 * View a user's balance.
	 *
	 * @param {object} interaction - Discord Slash Command object
	 * @param {object} firestore - Firestore database object
	 *
	 * @returns {boolean}
	**/
	execute: async ({ interaction, firestore }) => {

		/* Grab the user's information */
		const user = interaction.options.getUser('user') || interaction.user;
		const collection = await firestore.collection('users').doc(user.id).get();
		const userData = collection.data() || defaultData;

		const embed = new EmbedBuilder()
			.setColor('Orange')
			.setTitle(`${user.username}'s Balance!`);

		/* Are they on compact mode? */
		if (userData?.compact == true) {
			embed.setDescription(`Cents: \`${userData?.currencies?.cents || 0}\`\nRegister: \`${userData?.currencies?.register || 0}\``);

			interaction.followUp({ embeds: [embed] });
			return true;
		}


		/* Sort and organise the user's badges */
		const badgeOrder = ['dev', 'partnered_dev', 'support', 'flip', 'flip_plus', 'minigame', 'minigame_plus', 'register', 'collector', 'collector_plus', 'rich', 'rich_plus', 'niceness', 'bughunter', 'bughunter_plus' ];
		const badgesList = [`${emojis.dev} Developer`, `${emojis.partnered_dev} Partnered Developer`, `${emojis.support} Supporter`, `${emojis.flip} Flipper`, `${emojis.flip_plus} Avid Flipper`, `${emojis.gamer} Gamer`, `${emojis.pro_gamer} Pro Gamer`, `${emojis.register} Registered`, `${emojis.rich} Wealthy`, `${emojis.rich_plus} Millionaire`, `${emojis.niceness} Niceness`, `${emojis.bughunter} Bug Hunter`, `${emojis.bughunter_plus} Bug Poacher`];

		const badges = [];
		for (const badgeId of badgeOrder) {
			if (userData?.badges[badgeId] == true && userData?.badges[`${badgeId}_plus`] != true) {
				badges.push(badgesList[badgeOrder.indexOf(badgeId)]);
			}
		}
		if (userData.donator == 1) badges.push(`${emojis.gold_tier} Gold Tier`);
		if (userData.donator == 2) badges.push(`${emojis.platinum_tier} Platinum Tier`);
		if (badges.length == 0) badges.push('There are no badges');


		/* Sort and organise the user's items */
		const items = [];
		for (const item of itemlist) {
			if (userData?.inv[item.id] > 0) items.push(`${item.prof}${userData?.inv[item.id] > 1 ? ` (${userData?.inv[item.id]})` : ''}`);
		}
		if (userData?.inv?.toolbox) items.push('🧰 toolbox');
		if (items.length == 0) items.push('There\'s nothing here');

		/* Do they have a job? */
		const jobObject = joblist.filter(job => job.name.toLowerCase() == userData?.job?.toLowerCase());
		const job = jobObject.emoji ? `${jobObject.emoji} ${jobObject.name}` : 'none';

		if (userData?.stats?.bio) embed.setDescription(userData.stats.bio);
		embed.addFields(
			{ name: 'Cents', value: `${userData?.currencies?.cents || 0}` },
			{ name: 'Inventory', value: items.join('\n') },
			{ name: 'Job', value: `${job}` },

			{ name: 'Coins Flipped', value: `${userData?.stats?.flipped || 0}` },
			{ name: 'Minigames Won', value: `${userData?.stats?.minigames_won || 0}` },
			{ name: 'Badges', value: badges.join('\n') },
		);

		/* return true to enable the cooldown */
		interaction.followUp({ embeds: [embed] });
		return true;

	},
};