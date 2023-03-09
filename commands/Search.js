import ytsr from "ytsr";
import {MessageActionRow, MessageButton} from "discord.js";
import Track from "../Track.js";
import {initializeBot} from "../index.js";

async function Search(interaction, subscription, searchValue){
    if(!subscription) {
        subscription = initializeBot(interaction)
    }
    if (!subscription) {
        await interaction.reply('Join a voice channel and then try that again!');
        return;
    }
    const row = []
    //Grabs the passed in search value
    //Filter is used to make sure that the only thing ytsr grabs is videos and not playlists/channels
    const filterGroup = await ytsr.getFilters(searchValue)
    const videoFilter = filterGroup.get('Type').get('Video')
    //Returned amount of playlists should never exceed 5 due to the 5 row limit in Slash Commands
    const results = await ytsr(videoFilter.url, {limit: 5})
    const itemCount = results.items.length < 5 ? results.items.length : 5
    for (let i = 0; i < itemCount; i++) {
        //The character limit of a button is 80. Cut the title string and add ellipsis if it potentially reaches
        //  the limit.
        let title = results.items[i].title.substring(0, 76)
        if(title.length >= 77) title = title + "..."
        //Create the button and add it to a row
        const searchButton = new MessageButton()
            .setCustomId(`searchButton${i}`)
            .setLabel(title)
            .setStyle("PRIMARY")
        row[i] = new MessageActionRow().addComponents(searchButton)
    }
    //Create the collector with the buttons defined and reply with the results
    const btnFilter = (buttonInt) => buttonInt.customId === "searchButton0" || buttonInt.customId === "searchButton1"
        || buttonInt.customId === "searchButton2" || buttonInt.customId === "searchButton3" ||
        buttonInt.customId === "searchButton4"
    const collector = interaction.channel.createMessageComponentCollector({btnFilter, max: 1, time: 20000})
    await interaction.reply({components: row, ephemeral: true})

    collector.on('collect', async (btn) => {
        const error = {
            onError(error) {
                console.warn(error);
                interaction.followUp({ content: `Error: ${error.message}`}).catch(console.warn)
            }}
        let track
        switch(btn.customId) {
            case "searchButton0":
                track = await Track.from(results.items[0].url, error, interaction, subscription)
                subscription.enqueue(track)
                btn.update({content:`Added ${results.items[0].title}`, components:[]})
                break
            case "searchButton1":
                track = await Track.from(results.items[1].url, error, interaction, subscription)
                subscription.enqueue(track)
                btn.update({content:`Added ${results.items[1].title}`, components:[]})
                break
            case "searchButton2":
                track = await Track.from(results.items[2].url, error, interaction, subscription)
                subscription.enqueue(track)
                btn.update({content:`Added ${results.items[2].title}`, components:[]})
                break
            case "searchButton3":
                track = await Track.from(results.items[3].url, error, interaction, subscription)
                subscription.enqueue(track)
                btn.update({content:`Added ${results.items[3].title}`, components:[]})
                break
            case "searchButton4":
                track = await Track.from(results.items[4].url, error, interaction, subscription)
                subscription.enqueue(track)
                btn.update({content:`Added ${results.items[4].title}`, components:[]})
                break
        }
    })
}
export default Search