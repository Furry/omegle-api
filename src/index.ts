import { TextClient } from "./structs/TextClient.js";

const client = new TextClient();
let timeout: any;

// client.getStatus().then((status) => {
//     console.log(status);
// });
client.launch().then(async () => {
    await client.connect("en");
})

client.on("message", (content) => {
    // client.send("Hiya there! Need something advertised? 1 dollar per 125 omegle messages. Contact me by email at 2solace@pm.me ~");
    console.log(content);
})

client.on("disconnect", () => {
    client.connect();
    // clear timeout
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
})

client.on("connect", async () => {
    await client.send("Hiya there! Need something advertised? 1 dollar per 125 omegle messages. Contact me by email at 2solace@pm.me ~ \n\n(Alternatively, reply here with another form of contact and I'll reach out <3)");
    timeout = setTimeout(() => {
        if (client.connected) {
            client.disconnect();
        }
    }, 5000);
})