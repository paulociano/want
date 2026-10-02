# WANT Project Control Enterprise v6.6

# WANT Project Control — Vercel Server Proxy

This version fixes browser CORS failures by moving Google Apps Script calls to a same-origin Vercel serverless function.

## Required Vercel environment variables

- `APPS_SCRIPT_URL`
  - value: the published Google Apps Script `/exec` URL
- `APPS_SCRIPT_TOKEN`
  - value: the same private `SHARED_TOKEN` configured in Apps Script

Set both for Production (and Preview if desired), then redeploy.

## Architecture

Browser → `/api/sheets` on Vercel → Google Apps Script → Google Sheet

The token is never stored in the browser.

## Smoke checks

1. Open `/api/sheets?action=get`
2. Expect JSON with `ok: true`
3. Open the app and click `↓ Sheet`
4. Edit a small task value and click `↑ Sheet`
5. Verify the Tasks sheet and Change History


## v4
- Experiments dentro do app
- criação, edição e exclusão via Google Sheets
- vínculo Task ↔ Experiment ↔ Gate ↔ Evidence
- botão de criação de experimento dentro do Task Brief
- regras de decisão obrigatórias antes do teste

## v5 · Tracking central da landing

A landing do MVP está em `/landing/` e envia eventos para o mesmo proxy server-side do Control Center. O Apps Script v5 cria e alimenta a aba `Events` automaticamente. Nenhum token é exposto no navegador.

## v5.2 · Persistência compartilhada de demanda
A v5.2 adiciona `Demand Clusters` e `Demand Intents` como fonte compartilhada do MVP. Consulte `PATCH_v5.2.md` para deploy e smoke test.
