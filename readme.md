<h1 align="center">Omegle-API</h1>
<p align="center">
    <a href="https://discord.gg/tamVs2Ujrf">
        <img src="https://discordapp.com/api/guilds/769020183540400128/widget.png?style=banner2" alt="Discord Banner 2"/>
    </a>
    <div align="center">
        <img src="https://img.shields.io/bundlephobia/min/omegle-api">
        <a href="https://badge.fury.io/js/omegle-api"><img src="https://badge.fury.io/js/omegle-api.svg" alt="npm version" height="18"></a>
        <img src="https://img.shields.io/npm/dw/omegle-api">
    </div>
</p>

# About
Omegle-API is a single-depency wrapper around the 'chat roulette' website Omegle, allowing for easy automation & botting for the platform. There's some other libraries that do the same, but this one is built from the ground up using the javascript source with built in **Proxy Support**

# Usage:
<p>
    <ul>
        <li>
            <a href = "#Chat-Bot">Chat Bot</a>
        </li>
        <li>
            <a href = "#Specific-Topics">Multiple Renders / Selector</a>
        </li>
        <li>
            <a href = "#Proxy Support">Rendering embedded images</a>
        </li>
    </ul>
</p>

# Events
| Event | Content | Description |
|---|---|---|
| status | OmegleStatusObject | Fired when Omegle sends status information, usually at the end or start of a session. |
| connect | None | When the client successfully starts a session. |
| message | String | When the user sends a message to the bot. |
| captcha | String | When Omegle requests a captcha to be solved. |
| digest | String[] | An array containing hashed common interests between the two users. |
| disconnect | None | When a session ends. |
| typing | None | When a user starts typing. |
| blocked | None | When an IP address is blocked from creating sessions. |
| raw | string[] | The raw form of any event. |
# Examples

## Chat Bot
```js
const Omegle = require("omegle-api");

const client = new Omegle.TextClient();

client.on("message", async (message) => {
    client.send("You said: " + message);
})

client.connect();
```

## Specific Topics
```js
const Omegle = require("omegle-api");

const client = new Omegle.TextClient();
client.setTopics(["applebees", "programming"]);
client.connect();
```

## Proxy Support
```js
const Omegle = require("omegle-api");
const HttpProxyAgent = require("http-proxy-agent");

const client = new Omegle.TextClient();

// All requests will be routed through this proxy now.
client.setAgent(
    new HttpProxyAgent("http://proxy.example.com:8080")
);

// And this will remove the proxy agent.
client.setAgent();
```

## Recaptcha Support
Omegle throws recaptcha requirements when you do too many new sessions. To get around this, using proxies is advised but you can alternatively use services like 2captcha to solve them automatically, though this costs money.

```js
const Omegle = require("omegle-api");
const TwoCaptcha = require("2captcha");

const solver = new TwoCaptcha.Solver("<2captcha token here>");
const client = new Omegle.TextClient();

client.on("disconnect", async () => {
    await client.connect();
})

client.on("message", async () => {
    await client.send("Hiya!")
})

// Once you start getting captchas, you will get them every time you try to connect for 12-24 hours.
client.on("captcha", async (token) => {
    const solution = await solver.recaptcha(token, "https://omegle.com/");
    await client.sendCaptcha(solution);
    await client.connect();
})
```

# Commit Guidelines

The latest version of the code base will always be under the '**next**' branch!

- All pull requiests must provide a valid reason for the change or implementation
- All **CORE CHANGES** require an issue with reasoning made before a PR will even be addressed.
- All PR's must follow the general structure of the code base
- If you have questions, feel free to make an issue and i'll get to it right away!

<hr>
<div style="text-align: center">
<a href="https://www.buymeacoffee.com/ether" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
</div>