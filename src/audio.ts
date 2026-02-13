import { spawn } from "node:child_process";

const escapeSingleQuotes = (value: string) => value.replace(/'/g, "''");

const spawnSilently = (command: string[]) => {
  const [file, ...args] = command;
  spawn(file, args, {
    stdio: "ignore",
    windowsHide: true,
  });
};

const playWindows = (filePath: string, volume: number) => {
  const volumePercent = Math.round(volume * 100);
  const escapedPath = escapeSingleQuotes(filePath);
  const playbackScript =
    `$path='${escapedPath}';` +
    `try{` +
    `$p=New-Object -ComObject WMPlayer.OCX.7;` +
    `$p.settings.volume=${volumePercent};` +
    `$p.URL=$path;` +
    `$p.controls.play();` +
    `Start-Sleep -Milliseconds 1400` +
    `}catch{` +
    `try{` +
    `$sp=New-Object System.Media.SoundPlayer $path;` +
    `$sp.PlaySync()` +
    `}catch{}` +
    `}`;

  spawnSilently([
    "powershell.exe",
    "-NoProfile",
    "-WindowStyle",
    "Hidden",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    playbackScript,
  ]);
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
