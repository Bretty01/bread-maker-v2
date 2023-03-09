async function Remove(interaction, subscription){
    let index = interaction.options.get('position')?.value
    //Place an empty array if it exists
    if(subscription) {
        if(index > subscription.queue.length || index <= 0){
            return await interaction.reply("Invalid position. Either an invalid number or a number outside the current number of songs" +
                " in queue.")
        } else {
            subscription.queue.splice(index - 1, 1)
            return await interaction.reply(`Removed song at position ${index}`)
        }
    }
    interaction.reply('Bread Maker not active right now.')
}
export default Remove