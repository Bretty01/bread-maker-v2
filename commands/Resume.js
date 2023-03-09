async function Resume(interaction, subscription) {
    if (subscription) {
        subscription.audioPlayer.unpause();
        await interaction.reply({ content: `Unpaused!`});
    } else {
        await interaction.reply('Not playing in this server!');
    }
}
export default Resume