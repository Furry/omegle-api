// Import and re-export everything

import { TextClient } from "./structs/TextClient.js";
import * as types from "./types/Omegle.js";

const toExport = { TextClient, types };

// @ts-ignore
TextClient.default = toExport;

// @ts-ignore
TextClient.__esModule = true;

// @ts-ignore
export = toExport;