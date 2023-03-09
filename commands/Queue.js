import {MessageActionRow, MessageButton, MessageEmbed} from "discord.js";

async function Queue(interaction, subscription, page = 0) {
    let msg
    let pageNumber = page > 0 ? page : 1;
    const queueSize = 10
    // Print out the current queue.
    if (subscription) {
        if(pageNumber * queueSize - queueSize > subscription.queue.length) {
            pageNumber = 1
        }
        //Note: Character limit for a message is 2000. Don't increase the queue size more than about 30.
        const queue = subscription.queue
            .slice((queueSize * pageNumber - queueSize), (queueSize * pageNumber))
            .map((track, index) => `${queueSize * pageNumber - queueSize + 1 + index}. ` +
                `${track.details.title}`)
            .join('\n');
        const embed = new MessageEmbed()
            .setColor(parseInt(Math.random() * 16777215))
            .setTitle("Bread in the Queue")
            .setDescription(`Note: Buttons will fail to work after ~20 seconds of idling (this is intentional)\n\n${queue}
            \nPage ${pageNumber} on a total of ${subscription.queue.length} song(s) in the queue.`)

        const btnPrev = new MessageButton()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle('SECONDARY')
            .setDisabled(pageNumber === 1)

        const btnNext = new MessageButton()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle('SECONDARY')
            .setDisabled(pageNumber * queueSize  >= subscription.queue.length)

        const row = new MessageActionRow().addComponents( btnPrev,btnNext)

        const btnFilter = (buttonInt) => buttonInt.customId === "previous" || buttonInt.customId === "next"

        const collector = interaction.channel.createMessageComponentCollector({btnFilter, max: 1, time: 20000})
        msg = await interaction.editReply({embeds: [embed], components: [row], ephemeral: true})
        collector.on('collect', async (btn) => {
            try{
                await btn.update(" ")
                if(btn.customId === "previous") {
                    await Queue(interaction, subscription, pageNumber - 1)
                }
                else if(btn.customId === "next") {
                    await Queue(interaction, subscription, pageNumber + 1)
                }
            } catch(e){
                console.log("Unable to update queue." + e)
            }

        })

    } else {
        await interaction.reply('Not playing in this server!');
    }
}

export default Queue