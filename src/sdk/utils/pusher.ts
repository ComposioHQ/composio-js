const PusherClient = require("pusher-js")

const PUSHER_KEY = "ff9f18c208855d77a152"
const PUSHER_CLUSTER = "mt1"

const pusherClient = new PusherClient(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    userAuthentication: {
        endpoint: "/pusher/user-auth",
        transport: "ajax",
        params: {},
        headers: {},
        paramsProvider: null,
        headersProvider: null,
        customHandler: null,
    },
});


/**
 * Subscribes to a Pusher channel and binds an event to a callback function.
 * @param {string} channelName - The name of the channel to subscribe to.
 * @param {string} event - The event to bind to the channel.
 * @param {(data: any) => void} fn - The callback function to execute when the event is triggered.
 * @returns {PusherClient} The Pusher client instance.
 */
export const subscribe = (channelName: string, event: string, fn: (data: any) => void): PusherClient => {
    const client = pusherClient.subscribe(channelName).bind(event, fn);
    console.log(`Subscribed to ${channelName} with event ${event}`);
    return client;
}

/**
 * Unsubscribes from a Pusher channel.
 * @param {string} channelName - The name of the channel to unsubscribe from.
 * @returns {void}
 */
export const unsubscribe = (channelName: string): void => {
    pusherClient.unsubscribe(channelName);
}

/**
 * Binds an event to a channel with support for chunked messages.
 * @param {PusherClient} channel - The Pusher channel to bind the event to.
 * @param {string} event - The event to bind to the channel.
 * @param {(data: any) => void} callback - The callback function to execute when the event is triggered.
 */
export function bindWithChunking(channel: typeof PusherClient, event: string, callback: (data: any) => void): void {
    channel.bind(event, callback); // Allow normal unchunked events.

    // Now the chunked variation. Allows arbitrarily long messages.
    const events: { [key: string]: { chunks: string[], receivedFinal: boolean } } = {};
    channel.bind("chunked-" + event, (data: { id: string, index: number, chunk: string, final: boolean }) => {
        if (!events.hasOwnProperty(data.id)) {
            events[data.id] = { chunks: [], receivedFinal: false };
        }
        const ev = events[data.id];
        ev.chunks[data.index] = data.chunk;
        if (data.final) ev.receivedFinal = true;
        if (ev.receivedFinal && ev.chunks.length === Object.keys(ev.chunks).length) {
            callback(JSON.parse(ev.chunks.join("")));
            delete events[data.id];
        }
    });
}


export interface TriggerData {
    appName: string;
    clientId: number;
    payload: {};
    originalPayload: Record<string, any>;
    metadata: {
        id: string;
        connectionId: string;
        triggerName: string;
        triggerData: string;
        triggerConfig: Record<string, any>;
        connection: {
            id: string;
            integrationId: string;
            clientUniqueUserId: string;
            status: string;
        }
    }
}
/**
 * Subscribes to a trigger channel for a client and handles chunked data.
 * @param {string} clientId - The unique identifier for the client subscribing to the events.
 * @param {(data: any) => void} fn - The callback function to execute when trigger data is received.
 */
export const triggerSubscribe = (clientId: string, fn: (data: TriggerData) => void) => {
    var channel = pusherClient.subscribe(`${clientId}_triggers`);
    bindWithChunking(channel, "trigger_to_client", fn);
}

export const triggerUnsubscribe = (clientId: string) => {
    pusherClient.unsubscribe(`${clientId}_triggers`);
}
