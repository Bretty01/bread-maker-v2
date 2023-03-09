import {entersState, VoiceConnectionStatus} from "@discordjs/voice";
import ytpl from "ytpl";
import {MessageEmbed} from "discord.js";
import Track from "../Track.js";
import {initializeBot} from "../index.js";

async function Play(interaction, subscription) {
    await interaction.deferReply();
    // Extract the video URL from the command
    const url = interaction.options.get('song').value;

    // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
    // and create a subscription.
    if (!subscription) {
        subscription = initializeBot(interaction)
    }
    // If there is no subscription, tell the user they need to join a channel.
    if (!subscription) {
        await interaction.followUp('Join a voice channel and then try that again!');
        return;
    }
    // Make sure the connection is ready before processing the user's request
    try {
        await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
        console.warn(error);
        await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
        return;
    }

    //"&list=" and "?list=" indicate that the url contains the playlist.
    // If the url contains either substring, try to grab playlist.
    if(url.includes("&list=") || url.includes("?list")){
        let songCount = 0
        //Grab the playlist and add each individual song to the queue
        ytpl(url, {limit: Infinity}).then(async (pl)=> {
            pl.items.map(async (song) => {
                try{
                    let message
                    const wrappedMethods = {
                        async onStart() {
                            wrappedMethods.onStart = this.noop;
                            const embed = new MessageEmbed()
                                .setColor(parseInt(Math.random() * 16777215))
                                .setTitle(`**Now baking: ${song.title}**`)
                                .setURL(song.shortUrl)
                                .setThumbnail(song.bestThumbnail.url)
                                .setDescription("**Author**\n" + song.author.name +
                                    "\n\n**Duration**\n " + (this.details.duration.hourCount > 0 ?
                                        this.details.duration.hourCount + ":" : "") +
                                    this.details.duration.minuteCount + ":" + this.details.duration.secondCount)
                            message = await subscription.getTextChannel().send({embeds: [embed],
                                components: [Track.createMessageRows()]}).catch(console.warn)
                        },
                        onFinish() {
                            wrappedMethods.onFinish = this.noop;
                            if(message){
                                message.delete()
                            }
                        },
                        onError(error) {
                            wrappedMethods.onError = this.noop;
                            console.warn(error);
                            interaction.followUp({ content: `Error: ${error.message}`}).catch(console.warn);
                        },
                    };
                    subscription.enqueue(new Track(
                        song.shortUrl,
                        {
                            title: song.title,
                            channel: song.author.name,
                            duration: {
                                totalSeconds: song.durationSec,
                                hourCount: parseInt(song.durationSec / 3600),
                                minuteCount: parseInt(song.durationSec / 60 % 60),
                                secondCount: song.durationSec % 60 < 10 ? ("0" + song.durationSec % 10) : song.durationSec % 60
                            },
                            thumbnail: song.bestThumbnail.url},
                        wrappedMethods.onStart,
                        wrappedMethods.onFinish,
                        wrappedMethods.onError
                    ))
                    songCount = songCount + 1
                } catch (error){
                    console.warn(error)
                }
            })
            return await interaction.followUp(`Added ${songCount} songs to queue.`);
        }).catch(async (e) => {
            return await interaction.followUp(`Unable to add playlist ${e}`);
        })
    } else {
        try {
            // Attempt to create a Track from the user's video URL
            const track = await Track.from(url, {
                onError(error) {
                    console.warn(error);
                    interaction.followUp({ content: `Error: ${error.message}`}).catch(console.warn);
                }
            }, interaction, subscription);
            // Enqueue the track and reply a success message to the user
            subscription.enqueue(track);
            await interaction.followUp(`Enqueued **${track.details.title}**`);
        } catch (error) {
            console.warn(error);
            await interaction.followUp('Failed to play track, please try again later!');
        }

}
}

export default Play