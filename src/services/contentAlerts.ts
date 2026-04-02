import axios from "axios";
import { Client, Colors, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import config from "../config.json";
import { loadContentAlertsState, saveContentAlertsState } from "../utils/contentAlertsState";
import type { ContentAlertsState } from "../utils/contentAlertsState";

type TwitchStream = {
  id: string;
  user_login: string;
  title: string;
  game_name: string;
  type: string;
  started_at: string;
};

type ContentAlertsConfig = {
  enabled?: boolean;
  pollIntervalSeconds?: number;
  announceChannelId?: string;
  twitchUserLogins?: string[];
  youtubeChannelIds?: string[];
};

const cfg = config as typeof config & { contentAlerts?: ContentAlertsConfig };

let tokenCache: { token: string; expiresAt: number } | null = null;
let pollLock = false;

function normalizeLogins(logins: string[] | undefined): string[] {
  if (!logins?.length) return [];
  return [...new Set(logins.map((l) => l.toLowerCase().replace(/^#/, "").trim()).filter(Boolean))];
}

function normalizeChannelIds(ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

async function getTwitchAppToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAt - 60_000) return tokenCache.token;
  const res = await axios.post<{ access_token: string; expires_in: number }>(
    "https://id.twitch.tv/oauth2/token",
    null,
    {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      },
    }
  );
  tokenCache = {
    token: res.data.access_token,
    expiresAt: now + res.data.expires_in * 1000,
  };
  return tokenCache.token;
}

async function fetchTwitchStreams(
  clientId: string,
  clientSecret: string,
  logins: string[]
): Promise<TwitchStream[]> {
  if (logins.length === 0) return [];
  const token = await getTwitchAppToken(clientId, clientSecret);
  const chunks: string[][] = [];
  for (let i = 0; i < logins.length; i += 100) chunks.push(logins.slice(i, i + 100));
  const out: TwitchStream[] = [];
  for (const batch of chunks) {
    const params = new URLSearchParams();
    for (const login of batch) params.append("user_login", login);
    const res = await axios.get<{ data: TwitchStream[] }>(
      `https://api.twitch.tv/helix/streams?${params.toString()}`,
      {
        headers: {
          "Client-Id": clientId,
          Authorization: `Bearer ${token}`,
        },
      }
    );
    out.push(...(res.data.data ?? []));
  }
  return out;
}

function parseFirstYoutubeEntry(xml: string): { id: string; title: string } | null {
  const entry = xml.match(/<entry>[\s\S]*?<\/entry>/);
  if (!entry) return null;
  const block = entry[0];
  const idM = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  if (!idM?.[1]) return null;
  const titleM = block.match(/<title(?:[^>]*)>([^<]*)<\/title>/);
  const title = titleM?.[1]?.trim() || "Ny video";
  return { id: idM[1], title };
}

async function fetchYoutubeLatest(channelId: string): Promise<{ id: string; title: string } | null> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const res = await axios.get<string>(url, { responseType: "text", timeout: 20_000 });
  return parseFirstYoutubeEntry(res.data);
}

function resolveAnnounceChannelId(): string | null {
  const id = cfg.contentAlerts?.announceChannelId?.trim();
  if (id) return id;
  const fallback = (cfg.channels as { watchchannel?: string }).watchchannel;
  return fallback?.trim() || null;
}

async function sendEmbed(client: Client, embed: EmbedBuilder): Promise<void> {
  const channelId = resolveAnnounceChannelId();
  if (!channelId) {
    console.warn("[ContentAlerts] Ingen announce-kanal sat (contentAlerts.announceChannelId eller channels.watchchannel).");
    return;
  }
  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch?.isTextBased()) return;
  await (ch as TextChannel).send({ embeds: [embed] });
}

function twitchEmbed(stream: TwitchStream): EmbedBuilder {
  const login = stream.user_login.toLowerCase();
  const thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-640x360.jpg`;
  return new EmbedBuilder()
    .setColor(Colors.Purple)
    .setTitle(`${stream.user_login} er live på Twitch`)
    .setURL(`https://www.twitch.tv/${login}`)
    .setDescription(stream.title || "—")
    .addFields({ name: "Kategori", value: stream.game_name || "—", inline: true })
    .setThumbnail(thumb)
    .setTimestamp(new Date(stream.started_at));
}

function youtubeEmbed(channelId: string, videoId: string, title: string): EmbedBuilder {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle("Ny YouTube-video")
    .setURL(url)
    .setDescription(`**${title}**`)
    .setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
}

async function runTwitchTick(client: Client, state: ContentAlertsState): Promise<void> {
  const logins = normalizeLogins(cfg.contentAlerts?.twitchUserLogins);
  if (logins.length === 0) return;
  const clientId = process.env.TWITCH_CLIENT_ID?.trim();
  const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.warn("[ContentAlerts] Twitch: mangler TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET i miljø.");
    return;
  }

  let streams: TwitchStream[] = [];
  try {
    streams = await fetchTwitchStreams(clientId, clientSecret, logins);
  } catch (e) {
    console.error("[ContentAlerts] Twitch API fejl:", e);
    return;
  }

  const liveByLogin = new Map<string, TwitchStream>();
  for (const s of streams) {
    if (s.type === "live") liveByLogin.set(s.user_login.toLowerCase(), s);
  }

  if (!state.bootstrappedTwitch) {
    state.twitchLiveByLogin = {};
    for (const [login, stream] of liveByLogin) {
      state.twitchLiveByLogin[login] = stream.id;
    }
    state.bootstrappedTwitch = true;
    saveContentAlertsState(state);
    return;
  }

  for (const login of logins) {
    const stream = liveByLogin.get(login);
    const prevId = state.twitchLiveByLogin[login];
    if (stream) {
      if (prevId !== stream.id) {
        await sendEmbed(client, twitchEmbed(stream));
        state.twitchLiveByLogin[login] = stream.id;
      }
    } else if (prevId) {
      delete state.twitchLiveByLogin[login];
    }
  }
  saveContentAlertsState(state);
}

async function runYoutubeTick(client: Client, state: ContentAlertsState): Promise<void> {
  const channelIds = normalizeChannelIds(cfg.contentAlerts?.youtubeChannelIds);
  if (channelIds.length === 0) return;

  if (!state.bootstrappedYoutube) {
    for (const channelId of channelIds) {
      try {
        const latest = await fetchYoutubeLatest(channelId);
        if (latest) state.youtubeLatestByChannel[channelId] = latest.id;
      } catch (e) {
        console.error(`[ContentAlerts] YouTube RSS fejl (${channelId}):`, e);
      }
    }
    state.bootstrappedYoutube = true;
    saveContentAlertsState(state);
    return;
  }

  for (const channelId of channelIds) {
    let latest: { id: string; title: string } | null = null;
    try {
      latest = await fetchYoutubeLatest(channelId);
    } catch (e) {
      console.error(`[ContentAlerts] YouTube RSS fejl (${channelId}):`, e);
      continue;
    }
    if (!latest) continue;
    const prev = state.youtubeLatestByChannel[channelId];
    if (prev && latest.id !== prev) {
      await sendEmbed(client, youtubeEmbed(channelId, latest.id, latest.title));
      state.youtubeLatestByChannel[channelId] = latest.id;
      saveContentAlertsState(state);
    } else if (!prev) {
      state.youtubeLatestByChannel[channelId] = latest.id;
      saveContentAlertsState(state);
    }
  }
}

async function tick(client: Client): Promise<void> {
  if (pollLock) return;
  pollLock = true;
  const state = loadContentAlertsState();
  try {
    await runTwitchTick(client, state);
    const stateAfterTwitch = loadContentAlertsState();
    await runYoutubeTick(client, stateAfterTwitch);
  } finally {
    pollLock = false;
  }
}

export function startContentAlerts(client: Client): void {
  const ca = cfg.contentAlerts;
  if (ca?.enabled === false) {
    console.log("[ContentAlerts] Slået fra i config.");
    return;
  }

  const intervalSec = Math.max(30, ca?.pollIntervalSeconds ?? 120);
  console.log(`[ContentAlerts] Starter (hver ${intervalSec}s).`);

  void tick(client);
  setInterval(() => {
    void tick(client);
  }, intervalSec * 1000);
}

export type ContentAlertsDiagnosticLine = { ok: boolean; text: string };

export async function runContentAlertsDiagnostics(
  client: Client
): Promise<{ twitch: ContentAlertsDiagnosticLine; youtube: ContentAlertsDiagnosticLine; announce: ContentAlertsDiagnosticLine }> {
  const logins = normalizeLogins(cfg.contentAlerts?.twitchUserLogins);
  const clientId = process.env.TWITCH_CLIENT_ID?.trim();
  const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();

  let twitch: ContentAlertsDiagnosticLine;
  if (logins.length === 0) {
    twitch = { ok: true, text: "Twitch API ikke kaldt (ingen twitchUserLogins i config)." };
  } else if (!clientId || !clientSecret) {
    twitch = { ok: false, text: "Mangler TWITCH_CLIENT_ID eller TWITCH_CLIENT_SECRET i .env." };
  } else {
    try {
      const streams = await fetchTwitchStreams(clientId, clientSecret, logins);
      const live = streams.filter((s) => s.type === "live");
      const names = live.map((s) => s.user_login).join(", ") || "ingen";
      twitch = {
        ok: true,
        text: `Helix OK. ${live.length} live af ${logins.length} fulgte logins. Live nu: ${names}.`,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      twitch = { ok: false, text: `Helix fejl: ${msg}` };
    }
  }

  const ytIds = normalizeChannelIds(cfg.contentAlerts?.youtubeChannelIds);
  let youtube: ContentAlertsDiagnosticLine;
  if (ytIds.length === 0) {
    youtube = { ok: true, text: "YouTube RSS ikke kaldt (ingen youtubeChannelIds i config)." };
  } else {
    const lines: string[] = [];
    let allOk = true;
    for (const id of ytIds) {
      try {
        const latest = await fetchYoutubeLatest(id);
        if (latest) {
          lines.push(`${id.slice(0, 8)}… → "${latest.title.slice(0, 60)}${latest.title.length > 60 ? "…" : ""}"`);
        } else {
          allOk = false;
          lines.push(`${id}: kunne ikke parse feed.`);
        }
      } catch (e) {
        allOk = false;
        const msg = e instanceof Error ? e.message : String(e);
        lines.push(`${id}: ${msg}`);
      }
    }
    youtube = { ok: allOk, text: lines.join("\n") };
  }

  const announceId = resolveAnnounceChannelId();
  let announce: ContentAlertsDiagnosticLine;
  if (!announceId) {
    announce = { ok: false, text: "Ingen announce-kanal (contentAlerts.announceChannelId eller channels.watchchannel)." };
  } else {
    const ch = await client.channels.fetch(announceId).catch(() => null);
    if (!ch?.isTextBased()) {
      announce = { ok: false, text: `Kanal ${announceId} findes ikke eller er ikke tekst.` };
    } else if (ch.isDMBased()) {
      announce = { ok: false, text: "Announce-kanal kan ikke være en DM-kanal." };
    } else {
      const perms = ch.permissionsFor(client.user!.id);
      const canSend = perms?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
      ]);
      announce = {
        ok: !!canSend,
        text: canSend
          ? `Kanal OK: #${"name" in ch ? ch.name : announceId} (${announceId}).`
          : `Mangler rettigheder (ViewChannel, SendMessages, EmbedLinks) i announce-kanalen.`,
      };
    }
  }

  return { twitch, youtube, announce };
}

const mockTwitchStream: TwitchStream = {
  id: "test",
  user_login: "TestStreamer",
  title: "Eksempel — sådan ser et live-opslag ud",
  game_name: "Just Chatting",
  type: "live",
  started_at: new Date().toISOString(),
};

export function buildContentAlertsPreviewEmbeds(): { twitch: EmbedBuilder; youtube: EmbedBuilder } {
  return {
    twitch: twitchEmbed(mockTwitchStream).setFooter({ text: "TEST — ikke et rigtigt live" }),
    youtube: youtubeEmbed("UCxxxxxxxxxxxxxxxxxxxxxxxx", "dQw4w9WgXcQ", "Eksempel — sådan ser en YouTube-besked ud").setFooter({
      text: "TEST — eksempel-video",
    }),
  };
}
