const PusherClient = require("pusher-js")

const PUSHER_KEY = "ff9f18c208855d77a152"
const PUSHER_CLUSTER = "mt1"

const pusherClient = new PusherClient(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
});

export const subscribeToPusher = (channelName: string, event: string, fn: Function) => {
    const client = pusherClient.subscribe(channelName).bind(event, fn)

    return client;
}

export const unsubscribe = (channelName:string) => {
    return pusherClient.unsubscribe(channelName);
}


