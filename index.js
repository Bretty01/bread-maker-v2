import Discord, {
    GuildMember,
    MessageEmbed,
    MessageActionRow,
    MessageButton
} from 'discord.js';
import {
    AudioPlayerStatus, createAudioPlayer, demuxProbe,
    entersState, joinVoiceChannel, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource
} from '@discordjs/voice'
import ytdl from 'ytdl-core';
import ytpl from 'ytpl'
import ytsr from 'ytsr'
import {splatGifs} from './splatgifs.js'
import dotenv from 'dotenv'
import MusicSubscription from "./MusicSubscription.js";
import Track from "./Track.js";
import Play from "./commands/Play.js";
import Playtop from "./commands/Playtop.js";
import Connect from "./commands/Connect.js";
import Skip from "./commands/Skip.js";
import Queue from "./commands/Queue.js";
import Pause from "./commands/Pause.js";
import Resume from "./commands/Resume.js";
import Disconnect from "./commands/Disconnect.js";
import Shuffle from "./commands/Shuffle.js";
import Clear from "./commands/Clear.js";
import Search from "./commands/Search.js";
import Splat from "./commands/Splat.js";
import Remove from "./commands/Remove.js";
dotenv.config()

const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const client2 = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
client.on('ready', () => console.log('Ready!'));
client2.on('ready', () => console.log('Second Client Ready!'));

/**
 * Maps guild IDs to music subscriptions, which exist if the bot has an active VoiceConnection to the guild.
 */
export const subscriptions = new Map()


// Handles slash command interactions
client.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction)
})
client2.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction)
})

const handleInteraction = async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton() && !interaction.isModalSubmit() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if(interaction.isCommand()){
        switch (interaction.commandName) {
            case 'play':
                await Play(interaction, subscription)
                break
            case 'playtop':
                await Playtop(interaction, subscription)
                break
            case 'connect':
                await Connect(interaction, subscription)
                break
            case 'skip':
                await Skip(interaction, subscription)
                break
            case 'queue':
                await interaction.deferReply({ephemeral: true})
                await Queue(interaction, subscription, interaction.options.get('page')?.value)
                break
            case 'pause':
                await Pause(interaction, subscription)
                break
            case 'resume':
                await Resume(interaction, subscription)
                break
            case 'disconnect':
                await Disconnect(interaction, subscription, subscriptions)
                break
            case 'shuffle':
                await Shuffle(interaction, subscription)
                break
            case 'clear':
                await Clear(interaction, subscription)
                break
            case 'search':
                await Search(interaction, subscription, interaction.options.get('text').value)
                break
            case 'splat':
                await Splat(interaction, subscription)
                break
            case 'remove':
                await Remove(interaction, subscription)
                break
            default:
                await interaction.reply('Unknown command');
        }
    } else if(interaction.isButton()) {
        switch(interaction.customId){
            case 'btnPause':
                await Pause(interaction, subscription)
                break
            case 'btnResume':
                await Resume(interaction, subscription)
                break
            case 'btnSkip':
                await Skip(interaction, subscription)
                break
            case 'btnQueue':
                await interaction.deferReply({ephemeral: true})
                await Queue(interaction, subscription, 0)
                break
            case 'btnSearch':
                await Track.createSearchModal(interaction)
                break
            case "searchButton0":
            case "searchButton1":
            case "searchButton2":
            case "searchButton3":
            case "searchButton4":
            case "previous":
            case "next":
                break
            default:
                await interaction.reply("unknown")
        }
    } else if(interaction.isModalSubmit()) {
        if (interaction.customId === "modalSearch"){
            await Search(interaction, subscription, interaction.fields.getTextInputValue("txtSearch"))
        }
    }
}

export const initializeBot = (interaction) => {
    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        const channel = interaction.member.voice.channel;
        let subscription = new MusicSubscription(channel,
            joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            }), interaction.channel
        );
        subscription.voiceConnection.on('error', console.warn);
        //Remove this later
        subscription.voiceConnection.on('stateChange', (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');
            const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
                const newUdp = Reflect.get(newNetworkState, 'udp');
                clearInterval(newUdp?.keepAliveInterval);
            }
            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
        });
        //*End
        subscriptions.set(interaction.guildId, subscription);
        return subscription
    }
}

client.on('error', console.warn);
client2.on('error', console.warn);
client.login(process.env.ABYSSTOKEN);
client2.login(process.env.CRABTOKEN);

