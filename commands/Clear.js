async function Clear(interaction, subscription){
    //Place an empty array if it exists
    if(subscription) {
        subscription.queue = []
    }
    interaction.reply('Queue cleared')
}
export default Clear