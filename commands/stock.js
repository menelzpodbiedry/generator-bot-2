const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stock')
		.setDescription('Display the service stock.'),

	async execute(interaction) {
		try {
			// Fetch stock information
			const freeStock = await getStock(path.join(__dirname, '../free/'));
			const premiumStock = await getStock(path.join(__dirname, '../premium/'));

			// Create the embed
			const embed = new MessageEmbed()
				.setColor(config.color.default)
				.setTitle(`${interaction.guild.name} Service Stock`)
				.setDescription(`Hello **${interaction.user.username}**! Here is the stock information:`)
				.setFooter(config.footer)
				.setImage(config.banner);

			// Add free stock information
			if (freeStock.length > 0) {
				const freeStockInfo = await getServiceInfo(path.join(__dirname, '../free/'), freeStock);
				embed.addFields('Free Services', freeStockInfo, true);
			} else {
				embed.addFields('Free Services', 'No services available.', true);
			}

			// Add premium stock information
			if (premiumStock.length > 0) {
				const premiumStockInfo = await getServiceInfo(path.join(__dirname, '../premium/'), premiumStock);
				embed.addFields('Premium Services', premiumStockInfo, true);
			} else {
				embed.addFields('Premium Services', 'No services available.', true);
			}

			// Reply with the embed
			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error executing stock command:', error);
			await interaction.reply({ content: 'An error occurred while fetching the stock. Please try again later.', ephemeral: true });
		}
	},
};

// Function to get the list of stock files
async function getStock(directory) {
	try {
		const files = await fs.readdir(directory);
		return files.filter(file => file.endsWith('.txt'));
	} catch (err) {
		console.error(`Unable to scan directory ${directory}:`, err);
		return [];
	}
}

// Function to get stock information
async function getServiceInfo(directory, stock) {
	const info = [];
	for (const service of stock) {
		try {
			const serviceContent = await fs.readFile(path.join(directory, service), 'utf-8');
			const lines = serviceContent.split(/\r?\n/).filter(line => line.trim().length > 0);
			info.push(`**${service.replace('.txt', '')}:** \`${lines.length}\` items`);
		} catch (err) {
			console.error(`Error reading file ${service}:`, err);
		}
	}
	return info.length > 0 ? info.join('\n') : 'No services available.';
}
