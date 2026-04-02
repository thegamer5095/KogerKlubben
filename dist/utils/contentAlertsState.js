"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContentAlertsState = loadContentAlertsState;
exports.saveContentAlertsState = saveContentAlertsState;
const fs_1 = require("fs");
const path_1 = require("path");
const defaultState = {
    twitchLiveByLogin: {},
    youtubeLatestByChannel: {},
    bootstrappedTwitch: false,
    bootstrappedYoutube: false,
};
function statePath() {
    return (0, path_1.join)(process.cwd(), "data", "content-alerts-state.json");
}
function loadContentAlertsState() {
    const p = statePath();
    if (!(0, fs_1.existsSync)(p))
        return { ...defaultState, twitchLiveByLogin: {}, youtubeLatestByChannel: {} };
    try {
        const raw = (0, fs_1.readFileSync)(p, "utf8");
        const parsed = JSON.parse(raw);
        return {
            twitchLiveByLogin: parsed.twitchLiveByLogin ?? {},
            youtubeLatestByChannel: parsed.youtubeLatestByChannel ?? {},
            bootstrappedTwitch: parsed.bootstrappedTwitch ?? false,
            bootstrappedYoutube: parsed.bootstrappedYoutube ?? false,
        };
    }
    catch {
        return { ...defaultState, twitchLiveByLogin: {}, youtubeLatestByChannel: {} };
    }
}
function saveContentAlertsState(state) {
    const p = statePath();
    (0, fs_1.mkdirSync)((0, path_1.join)(process.cwd(), "data"), { recursive: true });
    (0, fs_1.writeFileSync)(p, JSON.stringify(state, null, 2), "utf8");
}
