# WANT Operating System v3 — Regras de automação

## Dependências
- Uma tarefa com dependências pendentes não pode entrar em Ready, In Progress, Review ou Done.
- Quando a última dependência termina, a tarefa dependente vai automaticamente para Ready se sua data de início já tiver chegado.
- Bloqueios manuais não são removidos automaticamente.

## Conclusão
- Done exige resultado entregue, pelo menos uma evidência e confirmação do critério de aceite.
- Ao concluir: progresso = 100%, data de conclusão é registrada e a próxima ação pode ser atualizada.
- Evidências entram na aba Evidence.
- O registro completo entra em Task Completions.
- Decisões preenchidas entram no Decision Log.
- BR gates podem ser fechados somente quando o usuário marca explicitamente a autorização de fechamento.

## Governança
- Task Brief explica objetivo, contexto, passos, critério de aceite, evidência esperada e contexto do Knowledge.
- Activity continua sendo trilha de auditoria de alterações de campo.
- Google Sheets permanece como fonte operacional canônica.
