import Track from "../Track.js";
import {initializeBot} from "../index.js";

async function Playtop(interaction, subscription) {
    //Get the passed in url
    const url = interaction.options.get('song').value;
    await interaction.deferReply()
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
    try {
        // Attempt to create a Track from the user's video URL
        const track = await Track.from(url, {
            onError(error) {
                console.warn(error);
                interaction.followUp({ content: `Error: ${error.message}`}).catch(console.warn);
            }
        }, interaction, subscription);
        // Enqueue the track and reply a success message to the user
        subscription.pushTop(track);
        await interaction.followUp(`Queued **${track.details.title}** to the top.`);
    } catch (error) {
        console.warn(error);
        await interaction.followUp('Failed to play track, please try again later!');
    }

}

export default Playtop