"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_IMAGE = exports.RULE_LINK = void 0;
exports.collectScanTargets = collectScanTargets;
exports.ensureDefaultContentBlockRules = ensureDefaultContentBlockRules;
exports.getMatchingContentBlockRules = getMatchingContentBlockRules;
const database_1 = __importDefault(require("./database"));
const URL_REGEX = /https?:\/\/[^\s<>"')]+/gi;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|#|$)/i;
exports.RULE_LINK = "LINK";
exports.RULE_IMAGE = "IMAGE";
function isLikelyImageUrl(url) {
    try {
        const path = new URL(url).pathname;
        return IMAGE_EXT.test(path);
    }
    catch {
        return IMAGE_EXT.test(url);
    }
}
function hasAnyImagePayload(message) {
    for (const a of message.attachments.values()) {
        if (a.contentType?.startsWith("image/"))
            return true;
    }
    for (const e of message.embeds) {
        if (e.image?.url || e.thumbnail?.url)
            return true;
    }
    return false;
}
function collectScanTargets(message) {
    const link = new Set();
    const image = new Set();
    if (message.content) {
        const lower = message.content.toLowerCase();
        link.add(lower);
        for (const m of message.content.matchAll(URL_REGEX)) {
            const u = m[0].toLowerCase();
            link.add(u);
            if (isLikelyImageUrl(u))
                image.add(u);
        }
    }
    for (const att of message.attachments.values()) {
        const u = att.url.toLowerCase();
        const p = att.proxyURL.toLowerCase();
        const n = (att.name ?? "").toLowerCase();
        link.add(u);
        link.add(p);
        link.add(n);
        if (att.contentType?.startsWith("image/")) {
            image.add(u);
            image.add(p);
            image.add(n);
        }
    }
    for (const e of message.embeds) {
        if (e.url)
            link.add(e.url.toLowerCase());
        if (e.image?.url) {
            const x = e.image.url.toLowerCase();
            link.add(x);
            image.add(x);
        }
        if (e.thumbnail?.url) {
            const x = e.thumbnail.url.toLowerCase();
            link.add(x);
            image.add(x);
        }
    }
    return { link: [...link], image: [...image] };
}
async function ensureDefaultContentBlockRules() {
    const defaults = [
        { pattern: "discord.gg", ruleType: exports.RULE_LINK, staffId: "system" },
        { pattern: "onlyfans.co.uk", ruleType: exports.RULE_LINK, staffId: "system" },
    ];
    for (const d of defaults) {
        await database_1.default.contentBlockRule.upsert({
            where: {
                pattern_ruleType: { pattern: d.pattern, ruleType: d.ruleType },
            },
            create: d,
            update: {},
        });
    }
}
async function getMatchingContentBlockRules(message) {
    const rules = await database_1.default.contentBlockRule.findMany();
    if (rules.length === 0)
        return [];
    const { link, image } = collectScanTargets(message);
    const matched = [];
    for (const rule of rules) {
        if (rule.ruleType === exports.RULE_LINK) {
            if (link.some((s) => s.includes(rule.pattern))) {
                matched.push({
                    id: rule.id,
                    pattern: rule.pattern,
                    ruleType: rule.ruleType,
                });
            }
        }
        else if (rule.ruleType === exports.RULE_IMAGE) {
            if (rule.pattern === "*") {
                if (hasAnyImagePayload(message)) {
                    matched.push({
                        id: rule.id,
                        pattern: rule.pattern,
                        ruleType: rule.ruleType,
                    });
                }
            }
            else if (image.some((s) => s.includes(rule.pattern))) {
                matched.push({
                    id: rule.id,
                    pattern: rule.pattern,
                    ruleType: rule.ruleType,
                });
            }
        }
    }
    return matched;
}
