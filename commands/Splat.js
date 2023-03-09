import {splatGifs} from "../splatgifs.js";

async function Splat(interaction, subscription){
    let index = interaction.options.get('number')?.value
    if (!index || index < 1 || index > splatGifs.length) {
        index = Math.floor(Math.random() * splatGifs.length) + 1
    }
    await interaction.reply(`${splatGifs[index - 1]}`)
}
export default Splat