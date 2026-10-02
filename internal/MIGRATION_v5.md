# WANT Enterprise v5 · Tracking central

Esta versão mantém o Control Center na raiz e adiciona a landing pública em `/landing/`.

## O que muda

- nova aba `Events`, criada automaticamente no Google Sheets no primeiro evento;
- `POST /api/sheets?action=event` para ingestão de tracking;
- `GET /api/sheets?action=events&limit=150` para inspeção;
- eventos com `event_id` idempotente e `session_id` pseudônimo;
- `demand_qualified` com `qualification_completeness`;
- `source_context` em compartilhamentos;
- fila local e reenvio de eventos que falharam;
- landing disponível em `/landing/` no mesmo deployment, reutilizando o proxy seguro já existente.

## Publicação

1. Substitua o Apps Script atual por `apps-script-v5.gs`.
2. Preserve a Script Property `SHARED_TOKEN`.
3. Publique uma nova versão do Web App.
4. Se a URL `/exec` mudar, atualize `APPS_SCRIPT_URL` na Vercel.
5. Copie os arquivos desta v5 sobre a pasta local já vinculada ao projeto Vercel, preservando `.vercel`.
6. Rode `vercel --prod`.

## Verificação

- `/api/sheets?action=get` deve retornar `ok:true`.
- `/api/sheets?action=events` deve retornar `ok:true`.
- abra `/landing/` e gere um evento.
- consulte `/api/sheets?action=events&limit=10` e confirme que o evento aparece.
- abra a Google Sheet e confirme a aba `Events` com a mesma linha.

## Cabeçalhos da aba Events

Timestamp, Event ID, Event, Session ID, Cluster ID, Category, Neighborhood, Intent, Frequency, Price, Radius, Timing, Source Context, Qualification Completeness, Client Timestamp, Metadata
