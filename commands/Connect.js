import { initializeBot } from "../index.js";

async function Connect(interaction, subscription) {
    const channel = interaction.member.voice.channel;
    if(!channel){
        return await interaction.reply('You are currently not in a voice channel');
    }
    if (!subscription) {
        subscription = initializeBot(interaction)
        console.log(subscription)
        await interaction.reply(`Connected to **${channel.name}**`, {ephemeral: true});
    } else {
        await interaction.reply(`Moved to **${channel.name}**`, {ephemeral: true});
        subscription.voiceConnection.rejoin({channelId: channel.id,
            guildId: channel.guild.id})
    }
}

export default Connect
