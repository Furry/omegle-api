import { GenericObject } from "../types/Omegle.js";

export class UriBuilder {
    private uri: string;
    private query: GenericObject = {};

    constructor(uri: string) {
        this.uri = uri;
    }

    public static from(obj: {
        uri: string,
        query: GenericObject
    }) {
        const uri = new UriBuilder(obj.uri);
        uri.query = obj.query;
        return uri.build();
    };

    public addQuery(key: string, value: string): this {
        this.query[key] = value;
        return this;
    }

    public build(): string {
        let root = this.uri;

        if (Object.keys(this.query).length > 0) {
            root += "?";
            root += Object.keys(this.query).map(key => `${key}=${this.query[key]}`).join("&");
        }

        return root;
    }
}