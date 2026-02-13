import { spawn } from "node:child_process";

const escapeSingleQuotes = (value: string) => value.replace(/'/g, "''");

const spawnSilently = (command: string[]) => {
  const [file, ...args] = command;
  const child = spawn(file, args, {
    stdio: "ignore",
    detached: true,
    windowsHide: true,
  });

  child.unref();
};

const playWindows = (filePath: string, volume: number) => {
  const volumePercent = Math.round(volume * 100);
  const escapedPath = escapeSingleQuotes(filePath);
  const wmPlayerScript =
    `$p=New-Object -ComObject WMPlayer.OCX.7;` +
    `$p.settings.volume=${volumePercent};` +
    `$p.URL='${escapedPath}';` +
    `$p.controls.play();` +
    `Start-Sleep -Milliseconds 1400`;

  try {
    spawnSilently([
      "powershell.exe",
      "-NoProfile",
      "-WindowStyle",
      "Hidden",
      "-Command",
      wmPlayerScript,
    ]);
    return;
  } catch {
    const soundPlayerScript =
      `$player=New-Object System.Media.SoundPlayer '${escapedPath}';` +
      `$player.Play()`;

    spawnSilently([
      "powershell.exe",
      "-NoProfile",
      "-WindowStyle",
      "Hidden",
      "-Command",
      soundPlayerScript,
    ]);
  }
};

export const playFile = (filePath: string, volume: number) => {
  if (process.platform === "darwin") {
    spawnSilently(["afplay", "-v", String(volume), filePath]);
    return;
  }

  if (process.platform === "linux") {
    spawnSilently(["paplay", filePath]);
    return;
  }

  if (process.platform === "win32") {
    playWindows(filePath, volume);
  }
};
