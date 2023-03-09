async function Shuffle(interaction, subscription){
    if(subscription) {
        subscription.queue.sort(() => Math.random() - 0.5);
    }
    interaction.reply("Shuffled the queue")
}
export default Shuffle