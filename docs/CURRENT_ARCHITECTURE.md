# Current Architecture

## Trust boundaries

A aplicação pública e as ferramentas operacionais não devem compartilhar o mesmo deployment público.

### Public deployment

Disponível para respondentes. Não contém Control, B2B ou Pilot Lab. O proxy público aceita somente as operações necessárias à experiência consumidor.

### Internal deployment

Ambiente operacional separado. Deve ser publicado em projeto/domínio diferente e protegido com autenticação/deployment protection antes de uso recorrente.

## Data path

Landing pública → `/api/sheets` → Apps Script → Google Sheets.

O token compartilhado é injetado server-side e não deve ser exposto ao browser ou ao GitHub.
