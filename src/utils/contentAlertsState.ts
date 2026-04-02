import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export type ContentAlertsState = {
  twitchLiveByLogin: Record<string, string>;
  youtubeLatestByChannel: Record<string, string>;
  bootstrappedTwitch: boolean;
  bootstrappedYoutube: boolean;
};

const defaultState: ContentAlertsState = {
  twitchLiveByLogin: {},
  youtubeLatestByChannel: {},
  bootstrappedTwitch: false,
  bootstrappedYoutube: false,
};

function statePath(): string {
  return join(process.cwd(), "data", "content-alerts-state.json");
}

export function loadContentAlertsState(): ContentAlertsState {
  const p = statePath();
  if (!existsSync(p)) return { ...defaultState, twitchLiveByLogin: {}, youtubeLatestByChannel: {} };
  try {
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw) as Partial<ContentAlertsState>;
    return {
      twitchLiveByLogin: parsed.twitchLiveByLogin ?? {},
      youtubeLatestByChannel: parsed.youtubeLatestByChannel ?? {},
      bootstrappedTwitch: parsed.bootstrappedTwitch ?? false,
      bootstrappedYoutube: parsed.bootstrappedYoutube ?? false,
    };
  } catch {
    return { ...defaultState, twitchLiveByLogin: {}, youtubeLatestByChannel: {} };
  }
}

export function saveContentAlertsState(state: ContentAlertsState): void {
  const p = statePath();
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2), "utf8");
}
