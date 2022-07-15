// https://front48.omegle.com/status?nocache=0.5737329962560602&randid=K8DYNAZ5
export interface OmegleStatus {
    // Active Users
    count: number,
    // Image recognition for nudity(?)
    antinudeservers: string[],

    // Unsure.
    spyQueueTime: number,
    rtmfp: string,
    antinewdpercent: number,
    spyeeQueueTime: number,
    timestamp: number,
    servers: string[]
}

export interface GenericObject {
    [key: string]: any;
}

export enum PollResponseState {

}

export type PollState = "disconnect" | "connect" | "idle" | "digest" | "message" | "typing";
export type PollResponse<T> = 
    T extends "disconnect" ? { state: "disconnect", body: OmegleStatus } :
    T extends "digest" ? { state: "digest", body: string } :
    T extends "connect" ? { state: "connect" } :
    T extends "idle" ? { state: "idle" } :
    T extends "message" ? { state: "message", body: string } :
    T extends "typing" ? { state: "typing" } :
    T extends "status" ? { state: "status", body: OmegleStatus } :
    T extends "recaptcha" ? { state: "recaptcha", body: string } :
    never;

export interface TextClientEvents {
    "status": (status: OmegleStatus) => void;
    "raw": (content: string[]) => void;
    "connect": (session: string) => void;
    "message": (content: string) => void;
    "captcha": (token: string) => void;
    "digest": (digests: string[]) => void;
    "disconnect": () => void;
    "typing": () => void;
    "blocked": () => void;
}

export interface TextClientResponse {
    events: [
        string[]
    ],
    clientID?: string
}
