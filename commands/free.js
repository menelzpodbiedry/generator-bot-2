const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs/promises');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();
const generated = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('free')
        .setDescription('Generate a specified service if stocked')
        .addStringOption(option =>
            option.setName('service')
                .setDescription('The name of the service to generate')
                .setRequired(true)),

    async execute(interaction) {
        const service = interaction.options.getString('service');
        const member = interaction.member;

        // Sprawdzenie poprawności kanału
        if (interaction.channelId !== config.genChannel) {
            const wrongChannelEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Wrong command usage!')
                .setDescription(`You cannot use the \`/free\` command in this channel! Try it in <#${config.genChannel}>!`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();

            return interaction.reply({ embeds: [wrongChannelEmbed], ephemeral: true });
        }

        // Sprawdzenie cooldownu
        if (generated.has(member.id)) {
            const cooldownEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Cooldown!')
                .setDescription(`Please wait **${config.genCooldown}** seconds before executing that command again!`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();

            return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
        }

        const filePath = `${__dirname}/../free/${service}.txt`;

        try {
            // Odczyt pliku usługi
            const data = await fs.readFile(filePath, 'utf-8');
            const lines = data.split(/\r?\n/).filter(line => line.trim());

            if (lines.length === 0) {
                const emptyServiceEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Generator error!')
                    .setDescription(`The \`${service}\` service is empty!`)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();

                return interaction.reply({ embeds: [emptyServiceEmbed], ephemeral: true });
            }

            const generatedAccount = lines.shift();

            // Zapis zaktualizowanych danych do pliku
            await fs.writeFile(filePath, lines.join('\n'));

            const embedMessage = new MessageEmbed()
                .setColor(config.color.green)
                .setTitle('Generated Free Account')
                .addFields(
                    { name: 'Service', value: `\`\`\`${service[0].toUpperCase()}${service.slice(1).toLowerCase()}\`\`\``, inline: true },
                    { name: 'Account', value: `\`\`\`${generatedAccount}\`\`\``, inline: true }
                )
                .setImage(config.banner)
                .setTimestamp();

            await member.send({ embeds: [embedMessage] });

            interaction.reply({
                content: `**Check your DM ${member}!** __If you do not receive the message, please unlock your private messages!__`,
                ephemeral: false,
            });

            generated.add(member.id);
            setTimeout(() => {
                generated.delete(member.id);
            }, config.genCooldown * 1000);
        } catch (error) {
            log.error(error);

            const errorEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Generator error!')
                .setDescription(`Service \`${service}\` does not exist or an error occurred.`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
                    
