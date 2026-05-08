"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentAlertMessageContent = getContentAlertMessageContent;
exports.resolveContentAlertPingRoleIds = resolveContentAlertPingRoleIds;
exports.buildContentAlertOutgoing = buildContentAlertOutgoing;
exports.diagnoseAnnounceChannel = diagnoseAnnounceChannel;
exports.startContentAlerts = startContentAlerts;
exports.runContentAlertsDiagnostics = runContentAlertsDiagnostics;
exports.buildContentAlertsPreviewEmbeds = buildContentAlertsPreviewEmbeds;
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../config.json"));
const contentAlertsState_1 = require("../utils/contentAlertsState");
const cfg = config_json_1.default;
let tokenCache = null;
let pollLock = false;
let contentAlertsPollerStarted = false;
function normalizeLogins(logins) {
    if (!logins?.length)
        return [];
    return [...new Set(logins.map((l) => l.toLowerCase().replace(/^#/, "").trim()).filter(Boolean))];
}
function normalizeChannelIds(ids) {
    if (!ids?.length)
        return [];
    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}
async function getTwitchAppToken(clientId, clientSecret) {
    const now = Date.now();
    if (tokenCache && now < tokenCache.expiresAt - 60000)
        return tokenCache.token;
    const res = await axios_1.default.post("https://id.twitch.tv/oauth2/token", null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
        },
    });
    tokenCache = {
        token: res.data.access_token,
        expiresAt: now + res.data.expires_in * 1000,
    };
    return tokenCache.token;
}
async function fetchTwitchStreams(clientId, clientSecret, logins) {
    if (logins.length === 0)
        return [];
    const token = await getTwitchAppToken(clientId, clientSecret);
    const chunks = [];
    for (let i = 0; i < logins.length; i += 100)
        chunks.push(logins.slice(i, i + 100));
    const out = [];
    for (const batch of chunks) {
        const params = new URLSearchParams();
        for (const login of batch)
            params.append("user_login", login);
        const res = await axios_1.default.get(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
            headers: {
                "Client-Id": clientId,
                Authorization: `Bearer ${token}`,
            },
        });
        out.push(...(res.data.data ?? []));
    }
    return out;
}
function entryAlternateHref(block) {
    const a = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/);
    if (a?.[1])
        return a[1];
    const b = block.match(/<link[^>]*href="([^"]+)"[^>]*rel="alternate"/);
    return b?.[1] ?? "";
}
function parseYoutubeFeedEntries(xml) {
    const raw = xml.match(/<entry>[\s\S]*?<\/entry>/g);
    if (!raw?.length)
        return [];
    const out = [];
    for (const block of raw) {
        const idM = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        if (!idM?.[1])
            continue;
        const titleM = block.match(/<title(?:[^>]*)>([^<]*)<\/title>/);
        const title = titleM?.[1]?.trim() || "Ny video";
        const href = entryAlternateHref(block);
        const isShort = href.includes("/shorts/");
        out.push({ id: idM[1], title, isShort });
    }
    return out;
}
function pickLatestNonShort(entries) {
    for (const e of entries) {
        if (!e.isShort)
            return { id: e.id, title: e.title };
    }
    return null;
}
async function fetchYoutubeLatestNonShort(channelId) {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const res = await axios_1.default.get(url, { responseType: "text", timeout: 20000 });
    return pickLatestNonShort(parseYoutubeFeedEntries(res.data));
}
function rememberYoutubeAnnouncement(state, videoId) {
    const prev = state.youtubeAnnouncedVideoIds ?? [];
    state.youtubeAnnouncedVideoIds = [videoId, ...prev.filter((x) => x !== videoId)].slice(0, 100);
}
function getContentAlertMessageContent(kind) {
    const ca = cfg.contentAlerts;
    const raw = kind === "twitch" ? ca?.twitchMessageContent : ca?.youtubeMessageContent;
    if (typeof raw !== "string")
        return undefined;
    const s = raw.trim();
    if (s.length === 0)
        return undefined;
    return s.length > 2000 ? s.slice(0, 2000) : s;
}
function normalizePingRoleIds(ids) {
    if (!ids?.length)
        return [];
    return [...new Set(ids.map((x) => x.trim()).filter(Boolean))];
}
function resolveContentAlertPingRoleIds(kind) {
    const ca = cfg.contentAlerts;
    if (kind === "twitch") {
        const fromArr = normalizePingRoleIds(ca?.twitchPingRoleIds);
        if (fromArr.length)
            return fromArr;
        const one = ca?.twitchPingRoleId?.trim();
        if (one)
            return [one];
        const r = cfg.roles.pingStream?.trim();
        return r ? [r] : [];
    }
    const fromArr = normalizePingRoleIds(ca?.youtubePingRoleIds);
    if (fromArr.length)
        return fromArr;
    const one = ca?.youtubePingRoleId?.trim();
    if (one)
        return [one];
    const r = cfg.roles.pingYoutube?.trim();
    return r ? [r] : [];
}
function extractMentionSnowflakes(content) {
    const userIds = new Set();
    const roleIds = new Set();
    const userRe = /<@!?(\d{17,20})>/g;
    const roleRe = /<@&(\d{17,20})>/g;
    let m;
    while ((m = userRe.exec(content)) !== null)
        userIds.add(m[1]);
    while ((m = roleRe.exec(content)) !== null)
        roleIds.add(m[1]);
    return { userIds: [...userIds], roleIds: [...roleIds] };
}
function buildContentAlertOutgoing(kind) {
    const base = getContentAlertMessageContent(kind);
    const pingRoleIds = resolveContentAlertPingRoleIds(kind);
    const roleLine = pingRoleIds.map((id) => `<@&${id}>`).join(" ");
    const parts = [];
    if (base)
        parts.push(base);
    if (roleLine)
        parts.push(roleLine);
    if (parts.length === 0)
        return {};
    const content = parts.join("\n").trim().slice(0, 2000);
    const extracted = extractMentionSnowflakes(content);
    const allRoleIds = [...new Set([...pingRoleIds, ...extracted.roleIds])];
    const needsMentionOpts = allRoleIds.length > 0 || extracted.userIds.length > 0;
    if (!needsMentionOpts)
        return { content };
    const allowedMentions = {
        parse: [],
        users: extracted.userIds,
        roles: allRoleIds,
    };
    return { content, allowedMentions };
}
function resolveAnnounceChannelIdFor(kind) {
    const ca = cfg.contentAlerts;
    const specific = kind === "twitch" ? ca?.twitchAnnounceChannelId?.trim() : ca?.youtubeAnnounceChannelId?.trim();
    if (specific)
        return specific;
    const legacy = ca?.announceChannelId?.trim();
    if (legacy)
        return legacy;
    const fallback = cfg.channels.watchchannel;
    return fallback?.trim() || null;
}
async function diagnoseAnnounceChannel(client, kind) {
    const label = kind === "twitch" ? "Twitch" : "YouTube";
    const announceId = resolveAnnounceChannelIdFor(kind);
    if (!announceId) {
        return {
            ok: false,
            text: `Ingen ${label}-announce-kanal (contentAlerts.${kind === "twitch" ? "twitchAnnounceChannelId" : "youtubeAnnounceChannelId"}, announceChannelId eller channels.watchchannel).`,
        };
    }
    const ch = await client.channels.fetch(announceId).catch(() => null);
    if (!ch?.isTextBased()) {
        return { ok: false, text: `${label}: Kanal ${announceId} findes ikke eller er ikke tekst.` };
    }
    if (ch.isDMBased()) {
        return { ok: false, text: `${label}: Announce-kanal kan ikke være en DM-kanal.` };
    }
    const perms = ch.permissionsFor(client.user.id);
    const canSend = perms?.has([
        discord_js_1.PermissionFlagsBits.ViewChannel,
        discord_js_1.PermissionFlagsBits.SendMessages,
        discord_js_1.PermissionFlagsBits.EmbedLinks,
    ]);
    return {
        ok: !!canSend,
        text: canSend
            ? `${label} OK: #${"name" in ch ? ch.name : announceId} (${announceId}).`
            : `${label}: Mangler rettigheder (ViewChannel, SendMessages, EmbedLinks).`,
    };
}
async function sendContentAlertEmbed(client, embed, kind) {
    const label = kind === "twitch" ? "Twitch" : "YouTube";
    const channelId = resolveAnnounceChannelIdFor(kind);
    if (!channelId) {
        console.warn(`[ContentAlerts] Ingen ${label}-announce-kanal (twitchAnnounceChannelId/youtubeAnnounceChannelId, announceChannelId eller channels.watchchannel).`);
        return;
    }
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (!ch?.isTextBased()) {
        console.warn(`[ContentAlerts] ${label}: Kunne ikke sende til kanal ${channelId}: findes ikke eller er ikke en tekstkanal.`);
        return;
    }
    try {
        const outgoing = buildContentAlertOutgoing(kind);
        const payload = { embeds: [embed] };
        if (outgoing.content !== undefined)
            payload.content = outgoing.content;
        if (outgoing.allowedMentions !== undefined)
            payload.allowedMentions = outgoing.allowedMentions;
        await ch.send(payload);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[ContentAlerts] ${label}: Kunne ikke sende embed til ${channelId}: ${msg}`);
    }
}
function twitchEmbed(stream) {
    const login = stream.user_login.toLowerCase();
    const thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-640x360.jpg`;
    return new discord_js_1.EmbedBuilder()
        .setColor(discord_js_1.Colors.Purple)
        .setTitle(`${stream.user_login} er live på Twitch`)
        .setURL(`https://www.twitch.tv/${login}`)
        .setDescription(stream.title || "—")
        .addFields({ name: "Kategori", value: stream.game_name || "—", inline: true })
        .setThumbnail(thumb)
        .setTimestamp(new Date(stream.started_at));
}
function youtubeEmbed(channelId, videoId, title) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    return new discord_js_1.EmbedBuilder()
        .setColor(discord_js_1.Colors.Red)
        .setTitle("Ny YouTube-video")
        .setURL(url)
        .setDescription(`**${title}**`)
        .setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
}
async function runTwitchTick(client, state) {
    const logins = normalizeLogins(cfg.contentAlerts?.twitchUserLogins);
    if (logins.length === 0)
        return;
    const clientId = process.env.TWITCH_CLIENT_ID?.trim();
    const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
        console.warn("[ContentAlerts] Twitch: mangler TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET i miljø.");
        return;
    }
    let streams = [];
    try {
        streams = await fetchTwitchStreams(clientId, clientSecret, logins);
    }
    catch (e) {
        console.error("[ContentAlerts] Twitch API fejl:", e);
        return;
    }
    const liveByLogin = new Map();
    for (const s of streams) {
        if (s.type === "live")
            liveByLogin.set(s.user_login.toLowerCase(), s);
    }
    if (!state.bootstrappedTwitch) {
        state.twitchLiveByLogin = {};
        for (const [login, stream] of liveByLogin) {
            state.twitchLiveByLogin[login] = stream.id;
        }
        state.bootstrappedTwitch = true;
        (0, contentAlertsState_1.saveContentAlertsState)(state);
        return;
    }
    for (const login of logins) {
        const stream = liveByLogin.get(login);
        const prevId = state.twitchLiveByLogin[login];
        if (stream) {
            if (prevId !== stream.id) {
                await sendContentAlertEmbed(client, twitchEmbed(stream), "twitch");
                state.twitchLiveByLogin[login] = stream.id;
            }
        }
        else if (prevId) {
            delete state.twitchLiveByLogin[login];
        }
    }
    (0, contentAlertsState_1.saveContentAlertsState)(state);
}
async function runYoutubeTick(client, state) {
    const channelIds = normalizeChannelIds(cfg.contentAlerts?.youtubeChannelIds);
    if (channelIds.length === 0)
        return;
    if (!state.bootstrappedYoutube) {
        for (const channelId of channelIds) {
            try {
                const latest = await fetchYoutubeLatestNonShort(channelId);
                if (latest)
                    state.youtubeLatestByChannel[channelId] = latest.id;
            }
            catch (e) {
                console.error(`[ContentAlerts] YouTube RSS fejl (${channelId}):`, e);
            }
        }
        state.bootstrappedYoutube = true;
        (0, contentAlertsState_1.saveContentAlertsState)(state);
        return;
    }
    for (const channelId of channelIds) {
        let latest = null;
        try {
            latest = await fetchYoutubeLatestNonShort(channelId);
        }
        catch (e) {
            console.error(`[ContentAlerts] YouTube RSS fejl (${channelId}):`, e);
            continue;
        }
        if (!latest)
            continue;
        const prev = state.youtubeLatestByChannel[channelId];
        const announced = state.youtubeAnnouncedVideoIds ?? [];
        if (prev && latest.id !== prev) {
            if (announced.includes(latest.id)) {
                state.youtubeLatestByChannel[channelId] = latest.id;
                (0, contentAlertsState_1.saveContentAlertsState)(state);
                continue;
            }
            await sendContentAlertEmbed(client, youtubeEmbed(channelId, latest.id, latest.title), "youtube");
            rememberYoutubeAnnouncement(state, latest.id);
            state.youtubeLatestByChannel[channelId] = latest.id;
            (0, contentAlertsState_1.saveContentAlertsState)(state);
        }
        else if (!prev) {
            state.youtubeLatestByChannel[channelId] = latest.id;
            (0, contentAlertsState_1.saveContentAlertsState)(state);
        }
    }
}
async function tick(client) {
    if (pollLock)
        return;
    pollLock = true;
    const state = (0, contentAlertsState_1.loadContentAlertsState)();
    try {
        await runTwitchTick(client, state);
        const stateAfterTwitch = (0, contentAlertsState_1.loadContentAlertsState)();
        await runYoutubeTick(client, stateAfterTwitch);
    }
    finally {
        pollLock = false;
    }
}
function startContentAlerts(client) {
    const ca = cfg.contentAlerts;
    if (ca?.enabled === false) {
        console.log("[ContentAlerts] Slået fra i config.");
        return;
    }
    if (contentAlertsPollerStarted) {
        console.warn("[ContentAlerts] Poller allerede startet — ignorerer dobbelt kald.");
        return;
    }
    contentAlertsPollerStarted = true;
    const intervalSec = Math.max(30, ca?.pollIntervalSeconds ?? 120);
    console.log(`[ContentAlerts] Starter (hver ${intervalSec}s).`);
    void tick(client);
    setInterval(() => {
        void tick(client);
    }, intervalSec * 1000);
    const twLogins = normalizeLogins(ca?.twitchUserLogins);
    const ytIds = normalizeChannelIds(ca?.youtubeChannelIds);
    if (twLogins.length > 0) {
        void diagnoseAnnounceChannel(client, "twitch").then((a) => {
            const prefix = "[ContentAlerts] Twitch-announce-kanal";
            if (a.ok)
                console.log(`${prefix}: ${a.text}`);
            else
                console.warn(`${prefix}: VIRKER IKKE — ${a.text}`);
        });
    }
    if (ytIds.length > 0) {
        void diagnoseAnnounceChannel(client, "youtube").then((a) => {
            const prefix = "[ContentAlerts] YouTube-announce-kanal";
            if (a.ok)
                console.log(`${prefix}: ${a.text}`);
            else
                console.warn(`${prefix}: VIRKER IKKE — ${a.text}`);
        });
    }
}
async function runContentAlertsDiagnostics(client) {
    const logins = normalizeLogins(cfg.contentAlerts?.twitchUserLogins);
    const clientId = process.env.TWITCH_CLIENT_ID?.trim();
    const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
    let twitch;
    if (logins.length === 0) {
        twitch = { ok: true, text: "Twitch API ikke kaldt (ingen twitchUserLogins i config)." };
    }
    else if (!clientId || !clientSecret) {
        twitch = { ok: false, text: "Mangler TWITCH_CLIENT_ID eller TWITCH_CLIENT_SECRET i .env." };
    }
    else {
        try {
            const streams = await fetchTwitchStreams(clientId, clientSecret, logins);
            const live = streams.filter((s) => s.type === "live");
            const names = live.map((s) => s.user_login).join(", ") || "ingen";
            twitch = {
                ok: true,
                text: `Helix OK. ${live.length} live af ${logins.length} fulgte logins. Live nu: ${names}.`,
            };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            twitch = { ok: false, text: `Helix fejl: ${msg}` };
        }
    }
    const ytIds = normalizeChannelIds(cfg.contentAlerts?.youtubeChannelIds);
    let youtube;
    if (ytIds.length === 0) {
        youtube = { ok: true, text: "YouTube RSS ikke kaldt (ingen youtubeChannelIds i config)." };
    }
    else {
        const lines = [];
        let allOk = true;
        for (const id of ytIds) {
            try {
                const latest = await fetchYoutubeLatestNonShort(id);
                if (latest) {
                    lines.push(`${id.slice(0, 8)}… → "${latest.title.slice(0, 60)}${latest.title.length > 60 ? "…" : ""}"`);
                }
                else {
                    allOk = false;
                    lines.push(`${id}: kunne ikke parse feed.`);
                }
            }
            catch (e) {
                allOk = false;
                const msg = e instanceof Error ? e.message : String(e);
                lines.push(`${id}: ${msg}`);
            }
        }
        youtube = { ok: allOk, text: lines.join("\n") };
    }
    let announceTwitch;
    if (logins.length === 0) {
        announceTwitch = { ok: true, text: "Ikke i brug (ingen twitchUserLogins)." };
    }
    else {
        announceTwitch = await diagnoseAnnounceChannel(client, "twitch");
    }
    let announceYoutube;
    if (ytIds.length === 0) {
        announceYoutube = { ok: true, text: "Ikke i brug (ingen youtubeChannelIds)." };
    }
    else {
        announceYoutube = await diagnoseAnnounceChannel(client, "youtube");
    }
    return { twitch, youtube, announceTwitch, announceYoutube };
}
const mockTwitchStream = {
    id: "test",
    user_login: "TestStreamer",
    title: "Eksempel — sådan ser et live-opslag ud",
    game_name: "Just Chatting",
    type: "live",
    started_at: new Date().toISOString(),
};
function buildContentAlertsPreviewEmbeds() {
    return {
        twitch: twitchEmbed(mockTwitchStream).setFooter({ text: "TEST — ikke et rigtigt live" }),
        youtube: youtubeEmbed("UCxxxxxxxxxxxxxxxxxxxxxxxx", "dQw4w9WgXcQ", "Eksempel — sådan ser en YouTube-besked ud").setFooter({
            text: "TEST — eksempel-video",
        }),
        twitchOutgoing: buildContentAlertOutgoing("twitch"),
        youtubeOutgoing: buildContentAlertOutgoing("youtube"),
    };
}
