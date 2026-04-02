import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export type PingRolesPanelRef = {
  channelId: string;
  messageId: string;
};

const FILE = join(process.cwd(), "data", "pingRolesPanel.json");

let cache: PingRolesPanelRef | null | undefined;

export async function getPingRolesPanel(): Promise<PingRolesPanelRef | null> {
  if (cache !== undefined) return cache;
  try {
    const raw = await readFile(FILE, "utf8");
    cache = JSON.parse(raw) as PingRolesPanelRef;
    return cache;
  } catch {
    cache = null;
    return null;
  }
}

export async function setPingRolesPanel(ref: PingRolesPanelRef): Promise<void> {
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(FILE, JSON.stringify(ref, null, 2), "utf8");
  cache = ref;
}
