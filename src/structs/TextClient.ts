import fetch from "node-fetch";
import { EventEmitter } from "events";
import { GenericObject, OmegleStatus, TextClientEvents, TextClientResponse } from "../types/Omegle.js";
import { UriBuilder } from "./Utils.js";

export interface TextClient {
    on<U extends keyof TextClientEvents>(
        event: U, listener: TextClientEvents[U]): this;
        
    once<U extends keyof TextClientEvents>(
        event: U, listener: TextClientEvents[U]): this;

    emit<U extends keyof TextClientEvents>(
        event: U, ...args: Parameters<TextClientEvents[U]>): boolean;
}

export class TextClient {
    /*
     Simple event emitter wrapper here, so we can use emit/on/once without exposing the other bloaty functions to the main class.
    */
    private emitter = new EventEmitter();
    public on<U extends keyof TextClientEvents>(
        event: U, listener: TextClientEvents[U]): this {
        this.emitter.on(event, listener);
        return this;
    }

    public emit<U extends keyof TextClientEvents>(
        event: U, ...args: Parameters<TextClientEvents[U]>): boolean {
        return this.emitter.emit(event, ...args);
    }

    public once<U extends keyof TextClientEvents>(
        event: U, listener: TextClientEvents[U]): this {
        this.emitter.once(event, listener);
        return this;
    }

    /*
        Actual methods here.
    */
    private headers: GenericObject = {};
    private fetchAgent?: any;

    private _randid?: string;
    private _server?: string;
    private _session?: string;

    /**
     * Generate a random ID for the client.
     * @returns A random ID.
     */
    private get randId(): string {
        if (!this._randid) {
            const set = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".split("");
            let id = "";
            for (let i = 0; i < 8; i++) {
                id += set[Math.floor(Math.random() * set.length)];
            }
            this._randid = id;
        }

        return this._randid;
    }

    /**
     * Get a server from omegle's server pool.
     * Omegle returns an array of servers, but based on ./decompOmegle, it seems to select the first one this way.
     * @returns A server from omegle's server pool.
     */
    private get server(): string {
        if (!this._server) {
            const n = Math.floor(Math.random() * 48) + 1;
            this._server = `front${n}`;
        }

        return this._server;
    }

    /**
     * Sets the http agent for all requests.
     * @param httpAgent An optional http agent to use for fetching. Removes the agent if undefined.
     */
    public setAgent(httpAgent?: any) {
        this.fetchAgent = httpAgent;
    }

    /**
     * Consructs an omegle url.
     * @returns An omegle url.
     */
    public get url() {
        return `https://${this.server}.omegle.com/`;
    }

    /**
     * Gets the current omegle status, including usercount, servers, and other info.
     * @returns The OmegleStatus object.
     * 
     */
    public async status(): Promise<OmegleStatus> {
        const url = UriBuilder.from({
            uri: this.url + "status",
            query: {
                nocache: Math.random(),
                randid: this.randId
            }
        });

        return await fetch(url, {
            headers: this.headers,
            ... (this.fetchAgent ? { agent: this.fetchAgent } : {})
        }).then((res) => res.json()) as OmegleStatus;
    }

    /**
     * Iterates through all events in the response, emitting them to the client.
     * @param response The response from omegle.
     */
    private async manageEvents(response: TextClientResponse) {
        for (const event of response.events) {
            const label = event[0];

            this.emit("raw", event);

            switch (label) {
                case "connected":
                    this._session = response.clientID;
                    this.emit("connect", this._session as string);
                    this.poll();
                break;
                case "identDigests":
                    this.emit("digest", event[1].split(","));
                break;
                case "typing":
                    this.emit("typing");
                break;
                case "gotMessage":
                    this.emit("message", event[1]);
                break;
                case "statusInfo":
                    this.emit("status", event[1] as unknown as OmegleStatus);
                break;
                case "strangerDisconnected":
                    this.emit("disconnect");
                    this._session = undefined;
                break;
                case "recaptchaRequired":
                    this.emit("captcha", event[1]);
                break;
                default:
                    console.log(`Unknown event: ${label}`);
                break;
            }
        }
    }

    /**
     * Starts a long-poll loop for the omegle events, breaking when the session is closed.
     */
    private async poll() {
        while (this._session) {
            const response = await fetch(this.url + "events", {
                method: "POST",
                headers: {
                    ...this.headers,
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "id=" + this._session,
                ... (this.fetchAgent ? { agent: this.fetchAgent } : {})
            }).then((res) => res.json());

            if (response == null) {
                this._session = undefined;
                this.emit("disconnect");
            } else {
                this.manageEvents({
                    events: response
                } as TextClientResponse);
            }

        }
    }

    /**
     * Sends a chat message.
     * @param message The message content to send.
     * 
     * @example
     * await <TextClient>.send("Hello, world!");
     */
    public async send(message: string) {
        if (!this._session) {
            throw new Error("Not in an active session!");
        }

        await fetch(this.url + "send", {
            method: "POST",
            body: `msg=${encodeURIComponent(message)}&id=${this._session}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        })
    }

    /**
     * Sends a chat typing event, lasting for 2 seconds.
     * @example
     * await <TextClient>.sendTyping();
     */
    public async sendTyping() {
        if (!this._session) {
            throw new Error("Not in an active session!");
        }

        await fetch(this.url + "typing", {
            method: "POST",
            body: `id=${this._session}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        });
    }

    /**
     * Disconnects from the current session, returning if no session is active.
     */
    public async disconnect() {
        if (!this._session) return;

        await fetch(this.url + "disconnect", {
            method: "POST",
            body: `id=${this._session}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        });
    }

    /**
     * Sends a captcha response back to Omegle.
     * @param answer The captcha solution.
     */
    public async sendCaptcha(solution: string) {
        await fetch(this.url + "recaptcha", {
            method: "POST",
            headers: {
                "content-type": "text/plain"
            },
            body: solution
        });
    }

    /**
     * Starts a new session.
     * @param topics The topics to search for when connecting. (Default none)
     * @param lang The language to use for the chat. (Default 'en')
     */
    public async connect(topics: string[] = [], lang = "en") {
        if (this._session) {
            throw new Error("Already in an active session!");
        }

        const url = UriBuilder.from({
            uri: this.url + "start",
            query: {
                caps: "recaptcha2,t",
                firstevents: 1,
                spid: "",
                randid: this.randId,
                topics: JSON.stringify(topics),
                lang: lang
            }
        })

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "dnt": "1",
                "sec-ch-ua": `".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"`,
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "Windows",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36"
            },
            ... (this.fetchAgent ? { agent: this.fetchAgent } : {})
        })

        const omegleResponse = await response.json() as TextClientResponse;
        if (omegleResponse.clientID) {
            this.manageEvents(omegleResponse);
        }
    }
}