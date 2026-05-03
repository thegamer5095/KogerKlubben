"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PING_REACTION_DEFINITIONS = void 0;
exports.getConfiguredPingDefinitions = getConfiguredPingDefinitions;
exports.getRoleIdForReactionEmoji = getRoleIdForReactionEmoji;
const config_json_1 = __importDefault(require("../config.json"));
exports.PING_REACTION_DEFINITIONS = [
    {
        emoji: "🔴",
        label: "Stream",
        description: "Få ping når der streames.",
        configKey: "pingStream",
    },
    {
        emoji: "📰",
        label: "Nyheder",
        description: "Få ping ved nyheder og opslag.",
        configKey: "pingNyheder",
    },
    {
        emoji: "▶️",
        label: "YouTube",
        description: "Få ping når der uploades videoer.",
        configKey: "pingYoutube",
    },
];
function roleIdFromConfig(key) {
    const id = config_json_1.default.roles[key];
    if (typeof id !== "string" || !id.trim())
        return null;
    return id.trim();
}
function getConfiguredPingDefinitions() {
    return exports.PING_REACTION_DEFINITIONS.filter((d) => roleIdFromConfig(d.configKey));
}
function getRoleIdForReactionEmoji(name, id) {
    if (id)
        return null;
    if (!name)
        return null;
    for (const def of exports.PING_REACTION_DEFINITIONS) {
        if (name === def.emoji) {
            return roleIdFromConfig(def.configKey);
        }
    }
    return null;
}
