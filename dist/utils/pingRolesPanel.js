"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPingRolesPanel = getPingRolesPanel;
exports.setPingRolesPanel = setPingRolesPanel;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const FILE = (0, path_1.join)(process.cwd(), "data", "pingRolesPanel.json");
let cache;
async function getPingRolesPanel() {
    if (cache !== undefined)
        return cache;
    try {
        const raw = await (0, promises_1.readFile)(FILE, "utf8");
        cache = JSON.parse(raw);
        return cache;
    }
    catch {
        cache = null;
        return null;
    }
}
async function setPingRolesPanel(ref) {
    await (0, promises_1.mkdir)((0, path_1.join)(process.cwd(), "data"), { recursive: true });
    await (0, promises_1.writeFile)(FILE, JSON.stringify(ref, null, 2), "utf8");
    cache = ref;
}
