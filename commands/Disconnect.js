async function Disconnect(interaction, subscription, subscriptions) {
    try{
        if (subscription) {
            subscription.voiceConnection.destroy();
            subscriptions.delete(interaction.guildId);
            await interaction.reply({ content: `Left channel!`, ephemeral: true });
        } else {
            await interaction.reply('Not playing in this server!');
            subscriptions.delete(interaction.guildId)
        }
    } catch (e) {
        await interaction.reply(`Error: ${e}`)
    }

}
export default Disconnect