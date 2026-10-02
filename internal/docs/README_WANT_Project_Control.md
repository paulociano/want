# WANT • Project Control

Arquivos:
- WANT_Project_Control.html — Kanban + timeline/Gantt + lista de tarefas.
- WANT_Project_Control.xlsx — workbook de gestão, com aba Tasks espelhando o HTML.
- WANT_Tasks_Sync.csv — formato de sincronização entre HTML e planilha.
- WANT_Plano_Mestre_e_Verificacao_de_Escopo.docx — documento mestre do projeto.

## Fluxo de atualização
1. Edite tarefas no HTML.
2. Clique em “Exportar CSV”.
3. Importe/substitua os dados da aba `Tasks` no Google Sheets usando o CSV.
4. Para trazer alterações da planilha ao HTML, exporte a aba `Tasks` como CSV e use “Importar CSV” no HTML.

## Limitação técnica
Um HTML estático salvo no Google Drive não consegue gravar diretamente em uma Google Sheet sem autenticação/API ou um backend. O CSV é o contrato de sincronização seguro e portátil desta versão.
