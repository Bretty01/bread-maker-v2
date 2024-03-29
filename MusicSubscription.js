import {
    AudioPlayerStatus,
    createAudioPlayer,
    entersState,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus
} from "@discordjs/voice";
import {subscriptions} from "./index.js";

class MusicSubscription {

    constructor(channel, voiceConnection, textChannelId) {
        this.voiceConnection = voiceConnection;
        this.channel = channel
        this.textChannel = textChannelId
        this.audioPlayer = createAudioPlayer();
        this.queue = [];
        this.queueLock = false
        this.readyLock = false;

        this.voiceConnection.on('stateChange', async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                console.log(newState.reason)
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    /**
                     * If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                     * but there is a chance the connection will recover itself if the reason of the disconnect was due to
                     * switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                     * so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                     * the voice connection.
                     */
                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
                        // Probably moved voice channel
                    } catch {
                        this.voiceConnection.destroy();
                        // Probably removed from voice channel
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    /**
                     * The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
                     */
                    await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
                    this.voiceConnection.rejoin();
                } else {
                    /**
                     * The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                     */
                    this.voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                /**
                 * Once destroyed, stop the subscription.
                 */
                this.stop();
            } else if (
                !this.readyLock &&
                (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
            ) {
                /**
                 * In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
                 * before destroying the voice connection. This stops the voice connection permanently existing in one of these
                 * states.
                 */
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
                } finally {
                    this.readyLock = false;
                }
            }
        });

        // Configure audio player
        this.audioPlayer.on('stateChange', async (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                (oldState.resource).metadata.onFinish();
                if(this.channel.guild.memberCount < 2){
                    return this.voiceConnection.destroy()
                }
                setTimeout(async () => {
                    let timeout = 0
                    while(timeout < 60 && this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
                        await new Promise(r => setTimeout(r, 1000));
                        timeout++
                    }
                    if(timeout >= 60) {
                        try{
                            this.voiceConnection.destroy()
                            subscriptions.delete(this.channel.guild.id);
                            return
                        } catch {
                            console.log ("Voice instance already destroyed")
                        }
                    }
                }, 4000)
                void await this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                await (newState.resource).metadata.onStart();
            }
        });

        this.audioPlayer.on('error', (error) => (error.resource).metadata.onError(error));

        voiceConnection.subscribe(this.audioPlayer);
    }

    /**
     * Adds a new Track to the queue.
     *
     * @param track The track to add to the queue
     */
    enqueue(track) {
        this.queue.push(track);
        this.processQueue();
    }

    pushTop(track) {
        this.queue.unshift(track)
        this.processQueue();
    }

    getTextChannel(){
        return this.textChannel
    }

    /**
     * Stops audio playback and empties the queue.
     */
    stop() {
        this.queueLock = true;
        this.queue = [];
        this.audioPlayer.stop(true);
    }

    /**
     * Attempts to play a Track from the queue.
     */
    async processQueue(){
        if(this.channel.members.size === 1) {
            try{
                this.voiceConnection.destroy()
                subscriptions.delete(this.channel.guild.id);
                return
            } catch {
                console.log ("Voice instance already destroyed")
                return
            }
        }
        // If the queue is locked (already being processed), is empty, or the audio player is already playing something
        if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
            return;
        }
        // Lock the queue to guarantee safe access
        this.queueLock = true;

        // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
        const nextTrack = this.queue.shift();
        try {
            // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
            const resource = await nextTrack.createAudioResource();
            this.audioPlayer.play(resource);
            this.queueLock = false;
        } catch (error) {
            // If an error occurred, try the next item of the queue instead
            nextTrack.onError(error);
            this.queueLock = false;
            return this.processQueue();
        }
    }
}
export default MusicSubscription