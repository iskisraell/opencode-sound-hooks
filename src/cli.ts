#!/usr/bin/env node

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { playFile } from "./audio.js";
import {
  DEFAULT_CONFIG_PATH,
  DEFAULT_VOLUME,
  SOUND_NAMES,
  type SoundName,
  WINDOWS_PROXIMITY_NOTIFICATION,
  defaultSoundPath,
  resolveConfig,
  writeConfig,
} from "./config.js";

const runtimeFile = fileURLToPath(import.meta.url);
const runtimeDir = dirname(runtimeFile);
const packageDir = join(runtimeDir, "..");
const assetsDir = join(packageDir, "assets");

const soundLabel: Record<SoundName, string> = {
  success: "session.idle (conclusao)",
  error: "session.error (falha)",
  question: "permission.ask (pergunta/interrupcao)",
};

const aliases: Record<string, SoundName> = {
  success: "success",
  completion: "success",
  concluido: "success",
  concluida: "success",
  done: "success",
  error: "error",
  fail: "error",
  failed: "error",
  question: "question",
  ask: "question",
  prompt: "question",
};

const resolveSoundName = (value: string) => aliases[value.toLowerCase()];

const printHelp = () => {
  console.log(`opencode-sound-hooks

Comandos:
  list
    Mostra os sons atuais, evento de cada som e caminho.

  preview <success|error|question>
    Toca um som para teste imediato.

  set <success|error|question> <caminho>
    Define um arquivo .wav personalizado para o hook.

  volume <0-100>
    Define volume padrao do plugin (default: ${Math.round(DEFAULT_VOLUME * 100)}%).

  use-windows-default
    Define success para: ${WINDOWS_PROXIMITY_NOTIFICATION}

  reset <success|error|question>
    Restaura o som padrao desse hook.

Config:
  ${DEFAULT_CONFIG_PATH}
`);
};

const list = () => {
  const config = resolveConfig(assetsDir);
  console.log(`Config: ${config.path}`);
  console.log(`Volume: ${Math.round(config.volume * 100)}%`);
  SOUND_NAMES.forEach((name) => {
    const path = config.sounds[name];
    const status = existsSync(path) ? "ok" : "missing";
    console.log(`- ${name} -> ${soundLabel[name]} | ${status} | ${path}`);
  });
};

const preview = (name: SoundName) => {
  const config = resolveConfig(assetsDir);
  const path = config.sounds[name];
  if (!existsSync(path)) {
    console.error(`Arquivo nao encontrado: ${path}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Tocando ${name}: ${path}`);
  playFile(path, config.volume);
};

const setSound = (name: SoundName, path: string) => {
  if (!existsSync(path)) {
    console.error(`Arquivo nao encontrado: ${path}`);
    process.exitCode = 1;
    return;
  }

  writeConfig({
    sounds: {
      [name]: path,
    },
  });

  console.log(`Som atualizado: ${name} -> ${path}`);
};

const setVolume = (value: string) => {
  const percent = Number(value);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    console.error("Volume invalido. Use um valor entre 0 e 100.");
    process.exitCode = 1;
    return;
  }

  writeConfig({
    volume: percent / 100,
  });

  console.log(`Volume atualizado: ${percent}%`);
};

const resetSound = (name: SoundName) => {
  const path = defaultSoundPath(name, assetsDir);
  writeConfig({
    sounds: {
      [name]: path,
    },
  });

  console.log(`Som resetado: ${name} -> ${path}`);
};

const main = () => {
  const [command, ...args] = process.argv.slice(2);

  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    printHelp();
    return;
  }

  if (command === "list") {
    list();
    return;
  }

  if (command === "use-windows-default") {
    setSound("success", WINDOWS_PROXIMITY_NOTIFICATION);
    return;
  }

  if (command === "preview") {
    const sound = resolveSoundName(args[0] ?? "");
    if (!sound) {
      console.error("Som invalido para preview.");
      process.exitCode = 1;
      return;
    }

    preview(sound);
    return;
  }

  if (command === "set") {
    const sound = resolveSoundName(args[0] ?? "");
    const path = args[1];
    if (!sound || !path) {
      console.error("Uso: set <success|error|question> <caminho>");
      process.exitCode = 1;
      return;
    }

    setSound(sound, path);
    return;
  }

  if (command === "reset") {
    const sound = resolveSoundName(args[0] ?? "");
    if (!sound) {
      console.error("Uso: reset <success|error|question>");
      process.exitCode = 1;
      return;
    }

    resetSound(sound);
    return;
  }

  if (command === "volume") {
    const value = args[0];
    if (!value) {
      console.error("Uso: volume <0-100>");
      process.exitCode = 1;
      return;
    }

    setVolume(value);
    return;
  }

  console.error(`Comando desconhecido: ${command}`);
  printHelp();
  process.exitCode = 1;
};

main();
