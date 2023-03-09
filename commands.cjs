const { SlashCommandBuilder } = require('@discordjs/builders')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
require('dotenv').config()
const commands = [
    new SlashCommandBuilder().setName('play').setDescription('Play song!')
        .addStringOption(option => option.setName('song').setDescription('Youtube URL').setRequired(true)),
    new SlashCommandBuilder().setName('playtop').setDescription('Add song to the top of the queue')
        .addStringOption(option => option.setName('song').setDescription('Youtube URL').setRequired(true)),
    new SlashCommandBuilder().setName('skip').setDescription('Skip to the next song in the queue'),
    new SlashCommandBuilder().setName('queue').setDescription('See the music queue')
        .addNumberOption(option => option.setName('page').setDescription('Queue page number')),
    new SlashCommandBuilder().setName('pause').setDescription('Pauses the song that is currently playing'),
    new SlashCommandBuilder().setName('resume').setDescription('Resume playback of the current song'),
    new SlashCommandBuilder().setName('leave').setDescription('Leave the voice channel'),
    new SlashCommandBuilder().setName('shuffle').setDescription('Shuffles the music queue'),
    new SlashCommandBuilder().setName('clear').setDescription('Clear the music queue'),
    new SlashCommandBuilder().setName('search').setDescription('Search for a specific song to play')
        .addStringOption(option => option.setName('text').setDescription('Name of song to search for')
            .setRequired(true)),
    new SlashCommandBuilder().setName('splat').setDescription('Strict Protocol of Lovely Airy Trees')
        .addStringOption(option => option.setName('number').setDescription('Specific protocol number')),
    new SlashCommandBuilder().setName('connect').setDescription('Move bot to current voice channel'),
]
    .map(command => command.toJSON())

const rest = new REST({ version: '9' }).setToken(process.env.ABYSSTOKEN)

rest.put(Routes.applicationGuildCommands(process.env.ABYSSCLIENT, process.env.ABYSSGUILD), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error)