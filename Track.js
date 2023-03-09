import ytdl from "ytdl-core";
import {createAudioResource, demuxProbe} from "@discordjs/voice";
import {MessageActionRow, MessageButton, MessageEmbed, TextInputComponent, Modal} from "discord.js";

class Track{

    constructor( url, details, onStart, onFinish, onError) {
        this.url = url
        this.details = details
        this.onStart = onStart
        this.onFinish = onFinish
        this.onError = onError
        this.noop = () => {}
        if(this.details.duration.minuteCount < 10) {
            this.details.duration.minuteCount = "0" + this.details.duration.minuteCount
        }
    }

    createAudioResource() {
        return new Promise((resolve, reject) => {
            let stream
            ytdl.getInfo(this.url).then(res => {
                if(res.videoDetails.isLiveContent) {
                    stream = ytdl(
                    this.url,
                    {
                        quality: "lowestaudio",
                        liveBuffer: 4900,
                        highWaterMark: 1 << 24
                    })
                } else {
                    stream = ytdl(
                    this.url,
                    {
                        quality: "lowestaudio",
                        highWaterMark: 1 << 24
                    })
                }
                const onError = (error) => {
                reject(error);
                };
                demuxProbe(stream)
                    .then((probe) => resolve(createAudioResource(probe.stream, {
                        metadata: this, inputType: probe.type}))).catch(onError)
                }) 
        })
    }

    static async from(url, methods, interaction, subscription){
        const info = await ytdl.getInfo(url);
        // The methods are wrapped so that we can ensure that they are only called once.
        let message
        const wrappedMethods = {
            async onStart() {
                wrappedMethods.onStart = this.noop;
                const embed = new MessageEmbed()
                    .setColor((Math.random() * 16777215))
                    .setTitle(`**Now baking:** ${info.videoDetails.title}`)
                    .setURL(url)
                    .setThumbnail(info.videoDetails.thumbnails[0].url)
                    .setDescription("**Author**\n" + info.videoDetails.ownerChannelName +
                        "\n\n**Duration**\n " + (info.videoDetails.isLiveContent ? "Live!" :
                            (this.details.duration.hourCount > 0 ?
                            this.details.duration.hourCount + ":" : "") +
                        this.details.duration.minuteCount + ":" + this.details.duration.secondCount))
                message = await subscription.getTextChannel().send({embeds: [embed],
                    components: [Track.createMessageRows()]}).catch(console.warn)
            },
            onFinish() {
                wrappedMethods.onFinish = this.noop;
                if(message){
                    message.delete()
                }
            },
            onError(error) {
                wrappedMethods.onError = this.noop;
                methods.onError(error);
            },
        };
        const durationSeconds = parseInt(info.videoDetails.lengthSeconds)
        return new Track(
            url,
            {title: info.videoDetails.title,
                channel: info.videoDetails.ownerChannelName,
                duration: {
                    totalSeconds: durationSeconds,
                    hourCount: parseInt(durationSeconds / 3600),
                    minuteCount: parseInt(durationSeconds / 60 % 60),
                    secondCount: durationSeconds % 60 < 10 ? ("0" + durationSeconds % 10) : durationSeconds % 60
                },
                thumbnail: info.videoDetails.thumbnails[0].url},
            wrappedMethods.onStart,
            wrappedMethods.onFinish,
            wrappedMethods.onError,
        );
    }

    static createMessageRows(){
        const btnPause = new MessageButton()
            .setCustomId('btnPause')
            .setEmoji("\u23F8")
            .setStyle('SECONDARY')

        const btnResume = new MessageButton()
            .setCustomId('btnResume')
            .setEmoji("\u25B6")
            .setStyle('SECONDARY')

        const btnSkip = new MessageButton()
            .setCustomId('btnSkip')
            .setEmoji("\u23ED\uFE0F")
            .setStyle('SECONDARY')

        const btnQueue = new MessageButton()
            .setCustomId('btnQueue')
            .setEmoji("\uD83D\uDCC4")
            .setStyle('SECONDARY')

        const btnSearch = new MessageButton()
            .setCustomId('btnSearch')
            .setEmoji("\uD83D\uDD0E")
            .setStyle('SECONDARY')

        return new MessageActionRow().addComponents(btnPause, btnResume, btnSkip, btnQueue, btnSearch)
    }

    static async createSearchModal(interaction){
        const modal = new Modal()
            .setCustomId("modalSearch")
            .setTitle("Search Song")

        const txtSearch = new TextInputComponent()
            .setLabel("Search songs here:")
            .setCustomId("txtSearch")
            .setStyle("SHORT")
            .setMaxLength(100)

        const row = new MessageActionRow().addComponents(txtSearch)

        modal.addComponents(row)
        await interaction.showModal(modal)
    }

}

export default Track