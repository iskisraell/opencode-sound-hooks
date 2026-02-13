import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "@opencode-ai/plugin";
import {
  EVENT_TO_SOUND,
  SOUND_NAMES,
  type SoundName,
  WINDOWS_PROXIMITY_NOTIFICATION,
  defaultSoundPath,
  resolveConfig,
} from "./config.js";
import { playFile } from "./audio.js";

const runtimeFile = fileURLToPath(import.meta.url);
const runtimeDir = dirname(runtimeFile);
const packageDir = join(runtimeDir, "..");
const assetsDir = join(packageDir, "assets");
const windowsCacheDir = join(
  process.env.TEMP ?? process.env.TMP ?? join(packageDir, ".tmp"),
  "opencode-sound-hooks",
);

const config = resolveConfig(assetsDir);
const soundBufferCache = new Map<SoundName, Buffer>();
const windowsPathCache = new Map<SoundName, string>();

const ensureDirectory = (path: string) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
};

const loadSoundBuffers = () => {
  SOUND_NAMES.forEach((name) => {
    const configuredPath = config.sounds[name];
    const fallbackPath = defaultSoundPath(name, assetsDir);
    const path = existsSync(configuredPath) ? configuredPath : fallbackPath;

    if (!existsSync(path)) {
      return;
    }

    soundBufferCache.set(name, readFileSync(path));
    config.sounds[name] = path;
  });
};

const getWindowsPlayablePath = (name: SoundName) => {
  const cached = windowsPathCache.get(name);
  if (cached) {
    return cached;
  }

  if (name === "success" && existsSync(WINDOWS_PROXIMITY_NOTIFICATION)) {
    windowsPathCache.set(name, WINDOWS_PROXIMITY_NOTIFICATION);
    return WINDOWS_PROXIMITY_NOTIFICATION;
  }

  const sourcePath = config.sounds[name];
  if (!existsSync(sourcePath)) {
    return null;
  }

  const data = soundBufferCache.get(name);
  if (!data) {
    return sourcePath;
  }

  ensureDirectory(windowsCacheDir);
  const cachedPath = join(windowsCacheDir, `${name}.wav`);
  if (!existsSync(cachedPath)) {
    writeFileSync(cachedPath, data);
  }

  windowsPathCache.set(name, cachedPath);
  return cachedPath;
};

const warmWindowsCache = () => {
  if (process.platform !== "win32") {
    return;
  }

  SOUND_NAMES.forEach((name) => {
    getWindowsPlayablePath(name);
  });
};

const playSound = (name: SoundName) => {
  const path =
    process.platform === "win32"
      ? getWindowsPlayablePath(name)
      : config.sounds[name];

  if (!path || !existsSync(path)) {
    return;
  }

  playFile(path, config.volume);
};

loadSoundBuffers();
warmWindowsCache();

export const SoundHooksPlugin: Plugin = async () => {
  return {
    event: async ({ event }) => {
      const sound = EVENT_TO_SOUND[event.type as string];
      if (!sound) {
        return;
      }

      playSound(sound);
    },

    "permission.ask": async (_, output) => {
      if (output.status !== "ask") {
        return;
      }

      playSound("question");
    },
  };
};

export default SoundHooksPlugin;
