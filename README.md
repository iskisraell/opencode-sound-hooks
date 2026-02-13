# opencode-sound-hooks

Plugin de som para OpenCode com hooks de conclusao, erro e pergunta.

No Windows, o som de conclusao padrao agora usa:

- `C:\Windows\Media\Windows Proximity Notification.wav`

## Hooks cobertos

- `session.idle` -> `success` (conclusao)
- `session.error` -> `error` (falha)
- `permission.ask` -> `question` (pergunta/interrupcao)

## Volume padrao

- `30%` (`0.3`)

## Instalacao

No diretorio de config do OpenCode:

```bash
cd ~/.config/opencode
bun add opencode-sound-hooks@latest
```

No `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-sound-hooks"]
}
```

Reinicie o OpenCode.

## Configuracao por comando (sem modal)

Atualmente o SDK de plugins do OpenCode nao expoe API de modal no TUI para esse caso.
Por isso, a configuracao e feita por CLI:

- local: `opencode-sound-hooks ...`
- sem instalar binario global: `npx opencode-sound-hooks ...`

```bash
opencode-sound-hooks list
opencode-sound-hooks preview success
opencode-sound-hooks preview error
opencode-sound-hooks preview question
opencode-sound-hooks set success "C:\\Windows\\Media\\Windows Proximity Notification.wav"
opencode-sound-hooks volume 30
opencode-sound-hooks use-windows-default
```

Config salvo em:

- `~/.config/opencode/opencode-sound-hooks.json`

## O que cada som representa

- `success`: quando a sessao termina com sucesso (`session.idle`)
- `error`: quando a sessao falha (`session.error`)
- `question`: quando OpenCode pede confirmacao/permissao (`permission.ask`)

## Troubleshooting

- Se ouvir beep generico no Windows, rode `opencode-sound-hooks list` e valide o caminho do `success`.
- Use `opencode-sound-hooks preview success` para validar antes de testar no OpenCode.
- Confirme no log do plugin:
  - `[Sound Hooks] Success sound: C:\\Windows\\Media\\Windows Proximity Notification.wav`

## Desenvolvimento

```bash
bun install
bun run typecheck
bun run build
```
