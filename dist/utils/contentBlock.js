"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectBlockedContentHaystacks = collectBlockedContentHaystacks;
exports.ensureDefaultContentBlockRules = ensureDefaultContentBlockRules;
exports.getMatchingContentBlockRules = getMatchingContentBlockRules;
exports.createContentBlockRule = createContentBlockRule;
const database_1 = __importDefault(require("./database"));
const URL_REGEX = /https?:\/\/[^\s<>"')]+/gi;
function collectBlockedContentHaystacks(message) {
    const set = new Set();
    if (message.content) {
        const lower = message.content.toLowerCase();
        set.add(lower);
        for (const m of message.content.matchAll(URL_REGEX)) {
            set.add(m[0].toLowerCase());
        }
    }
    for (const att of message.attachments.values()) {
        set.add(att.url.toLowerCase());
        set.add(att.proxyURL.toLowerCase());
        if (att.name)
            set.add(att.name.toLowerCase());
    }
    for (const e of message.embeds) {
        if (e.url)
            set.add(e.url.toLowerCase());
        if (e.image?.url)
            set.add(e.image.url.toLowerCase());
        if (e.thumbnail?.url)
            set.add(e.thumbnail.url.toLowerCase());
    }
    return [...set];
}
async function ensureDefaultContentBlockRules() {
    const defaults = [
        { pattern: "discord.gg", staffId: "system" },
        { pattern: "onlyfans.co.uk", staffId: "system" },
    ];
    for (const d of defaults) {
        await database_1.default.contentBlockRule.upsert({
            where: { pattern: d.pattern },
            create: d,
            update: {},
        });
    }
}
async function getMatchingContentBlockRules(message) {
    const rules = await database_1.default.contentBlockRule.findMany();
    if (rules.length === 0)
        return [];
    const haystacks = collectBlockedContentHaystacks(message);
    const matched = [];
    for (const rule of rules) {
        if (haystacks.some((s) => s.includes(rule.pattern))) {
            matched.push({ id: rule.id, pattern: rule.pattern });
        }
    }
    return matched;
}
async function createContentBlockRule(pattern, staffId) {
    try {
        await database_1.default.contentBlockRule.create({
            data: { pattern, staffId },
        });
        return { ok: true };
    }
    catch {
        return { ok: false, reason: "duplicate" };
    }
}
