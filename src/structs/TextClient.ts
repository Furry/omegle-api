import EventEmitter from "events";
import fetch from "node-fetch";
import { OmegleStatus, PollResponse, PollState } from "../types/Omegle.js";
import { ALPHABET, buildUrl, NUMERIC, pick, random } from "../utils.js";

export class TextClient extends EventEmitter {
    private isConnected: boolean = false;
    private _status: OmegleStatus = null as any;
    private _session: string = null as any;

    constructor() {
        super();

        this.on("disconnect", () => {
            this.isConnected = false;
            this._session
        })
    }

    private parsePollResponse(content: any): PollResponse<PollState>[] {
        const entries = [];
        if (content == null) {
            return [{
                state: "idle"
            }]
        }

        for (const entry of content) {
            switch (entry[0]) {
                case "strangerDisconnected":
                    entries.push({
                        state: "disconnect",
                        body: entry[1]
                    }); break;
                case "identDigests":
                    entries.push({
                        state: "digest",
                        body: entry[1]
                    }); break;
                case "connected":
                    entries.push({
                        state: "connect"
                    }); break;
                case "gotMessage":
                    entries.push({
                        state: "message",
                        body: entry[1]
                    }); break;
                case "typing":
                    entries.push({
                        state: "typing"
                    }); break;
                case "statusInfo":
                    entries.push({
                        state: "status",
                        body: entry[1]
                    }); break;
                default:
                    console.log(entry);
                    entries.push({
                        state: "idle"
                    }); break;
            }
        }

        return entries as any;
    }

    private async poll() {
        while (this.isConnected) {
            try {
                const response = await fetch(`https://${pick(this.status.servers)}.omegle.com/events`, {
                    method: "POST",
                    // form body
                    body: "id=" + this._session,
                    headers: {
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                    }
                }).then((r) => r.json());
    
                for (const event of this.parsePollResponse(response)) {
                    const e: any = event;
                    if (e.body) {
                        this.emit(event.state, e.body);
                    } else {
                        this.emit(event.state);
                    }
                }
            } catch (_) {};
        }
    }

    public async getStatus(): Promise<OmegleStatus> {
        const response = await fetch(buildUrl({
            root: "https://front48.omegle.com/status",
            query: {
                nocache: Math.random(),
                randid: random(8, ...ALPHABET, ...NUMERIC)
            }
        })).then((r) => r.json());

        return response as OmegleStatus;
    }

    public async send(message: string) {
        if (!this.connected) {
            throw new Error("Not connected");
        }

        await fetch(`https://${pick(this.status.servers)}.omegle.com/send`, {
            method: "POST",
            body: `msg=${encodeURIComponent(message)}&id=${this._session}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        });
    }

    public async sendTyping() {
        if (!this.connected) {
            throw new Error("Not connected");
        }

        await fetch(`https://${pick(this.status.servers)}.omegle.com/send`, {
            method: "POST",
            body: `id=${this._session}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        });
    }

    public get connected(): boolean {
        return this.isConnected;
    }

    private get status(): OmegleStatus {
        if (this._status == null) {
            throw new Error("Not connected! Please use launch() first.");
        }

        return this._status;
    }

    public async launch() {
        this._status = await this.getStatus();
    }

    public async disconnect() {
        if (!this.connected) {
            throw new Error("Not connected");
        }

        await fetch(`https://${pick(this.status.servers)}.omegle.com/disconnect`, {
            method: "POST",
            body: `id=${this._session}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            }
        });

        this.emit("disconnect");
    }

    public async connect(lang: string = "en", topics: string[] = []) {
        if (this.connected) {
            throw new Error("Already connected");
        }

        const response = await fetch(buildUrl({
            "root": `https://${pick(this.status.servers)}.omegle.com/start`,
            "query": {
                caps: "recaptcha2,t",
                spid: "",
                randid: random(8, ...ALPHABET, ...NUMERIC),
                topics: JSON.stringify(topics),
                lang: lang
            }
        }), {
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
            }
        }).then((r) => r.json());

        this._session = (response as any);
        this.isConnected = true;
        await this.poll();
    }
}