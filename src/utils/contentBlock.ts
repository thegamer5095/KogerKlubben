import { Message } from "discord.js";
import prisma from "./database";

const URL_REGEX = /https?:\/\/[^\s<>"')]+/gi;

export function collectBlockedContentHaystacks(message: Message): string[] {
  const set = new Set<string>();

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
    if (att.name) set.add(att.name.toLowerCase());
  }

  for (const e of message.embeds) {
    if (e.url) set.add(e.url.toLowerCase());
    if (e.image?.url) set.add(e.image.url.toLowerCase());
    if (e.thumbnail?.url) set.add(e.thumbnail.url.toLowerCase());
  }

  return [...set];
}

export async function ensureDefaultContentBlockRules(): Promise<void> {
  const defaults: { pattern: string; staffId: string }[] = [
    { pattern: "discord.gg", staffId: "system" },
    { pattern: "onlyfans.co.uk", staffId: "system" },
  ];
  for (const d of defaults) {
    await prisma.contentBlockRule.upsert({
      where: { pattern: d.pattern },
      create: d,
      update: {},
    });
  }
}

export async function getMatchingContentBlockRules(
  message: Message
): Promise<{ id: number; pattern: string }[]> {
  const rules = await prisma.contentBlockRule.findMany();
  if (rules.length === 0) return [];

  const haystacks = collectBlockedContentHaystacks(message);
  const matched: { id: number; pattern: string }[] = [];

  for (const rule of rules) {
    if (haystacks.some((s) => s.includes(rule.pattern))) {
      matched.push({ id: rule.id, pattern: rule.pattern });
    }
  }

  return matched;
}

export async function createContentBlockRule(
  pattern: string,
  staffId: string
): Promise<{ ok: true } | { ok: false; reason: "duplicate" }> {
  try {
    await prisma.contentBlockRule.create({
      data: { pattern, staffId },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "duplicate" };
  }
}
