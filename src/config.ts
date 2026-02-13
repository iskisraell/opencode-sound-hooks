import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const SOUND_NAMES = ["success", "error", "question"] as const;
export type SoundName = (typeof SOUND_NAMES)[number];

export const EVENT_TO_SOUND: Record<string, SoundName> = {
  "session.idle": "success",
  "session.error": "error",
};

export const DEFAULT_VOLUME = 0.3;

const HOME_DIR = process.env.USERPROFILE ?? process.env.HOME ?? ".";
const WINDIR = process.env.WINDIR ?? "C:\\Windows";

export const WINDOWS_PROXIMITY_NOTIFICATION = join(
  WINDIR,
  "Media",
  "Windows Proximity Notification.wav",
);

export const DEFAULT_CONFIG_PATH =
  process.env.OPENCODE_SOUND_HOOKS_CONFIG ??
  join(HOME_DIR, ".config", "opencode", "opencode-sound-hooks.json");

export interface SoundHookConfig {
  volume?: number;
  sounds?: Partial<Record<SoundName, string>>;
}

export interface ResolvedSoundHookConfig {
  volume: number;
  sounds: Record<SoundName, string>;
  path: string;
}

const clampVolume = (volume: number) => Math.max(0, Math.min(1, volume));

export const defaultSoundPath = (name: SoundName, assetsDir: string) => {
  if (process.platform === "win32" && name === "success") {
    return WINDOWS_PROXIMITY_NOTIFICATION;
  }

  return join(assetsDir, `${name}.wav`);
};

export const readConfig = (path = DEFAULT_CONFIG_PATH): SoundHookConfig => {
  if (!existsSync(path)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(path, "utf8")) as SoundHookConfig;
  } catch {
    return {};
  }
};

export const resolveConfig = (
  assetsDir: string,
  path = DEFAULT_CONFIG_PATH,
): ResolvedSoundHookConfig => {
  const raw = readConfig(path);
  const defaults = SOUND_NAMES.reduce(
    (acc, name) => {
      acc[name] = defaultSoundPath(name, assetsDir);
      return acc;
    },
    {} as Record<SoundName, string>,
  );

  const sounds = SOUND_NAMES.reduce(
    (acc, name) => {
      acc[name] = raw.sounds?.[name] ?? defaults[name];
      return acc;
    },
    {} as Record<SoundName, string>,
  );

  return {
    path,
    sounds,
    volume: clampVolume(raw.volume ?? DEFAULT_VOLUME),
  };
};

export const writeConfig = (
  next: SoundHookConfig,
  path = DEFAULT_CONFIG_PATH,
) => {
  const current = readConfig(path);
  const merged: SoundHookConfig = {
    ...current,
    ...next,
    sounds: {
      ...current.sounds,
      ...next.sounds,
    },
  };

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
};
