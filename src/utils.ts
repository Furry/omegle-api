export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
export const NUMERIC = "0123456789";

export function pick<T>(opts: T[]): T {
    return opts[Math.floor(Math.random() * opts.length)];
}

export function random(length: number, ...charset: string[]): string {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += pick(charset);
    }
    return result;
}

export function buildUrl(obj: {root: string, query: {[key: string]: any}}): string {
    const query = Object.keys(obj.query).map(key => {
        return `${key}=${obj.query[key]}`;
    }).join("&");
    return `${obj.root}?${query}`;
}