async function Pause(interaction, subscription) {
    if (subscription) {
        subscription.audioPlayer.pause();
        await interaction.reply({ content: `Paused!`});
    } else {
        await interaction.reply('Not playing in this server!');
    }
}
export default Pause