# WANT — Production Launch Checklist

## Já concluído
- [x] UI/UX premium do Project Control
- [x] Kanban, Timeline/Gantt, lista e Overview
- [x] contrato de tarefas compatível com Google Sheets
- [x] Google Sheet canônica
- [x] timezone America/Sao_Paulo
- [x] aba Change History
- [x] Apps Script v2 com diff por campo
- [x] token compartilhado para primeira versão privada
- [x] pacote estático compatível com Vercel

## Requer autorização externa
- [ ] conectar um team/projeto Vercel
- [ ] publicar o Google Apps Script como Web App
- [ ] substituir SHARED_TOKEN por segredo forte
- [ ] configurar URL `/exec` + token no painel
- [ ] fazer primeira sincronização bidirecional
- [ ] verificar logs e comportamento após publicação

## Evolução multiusuário
Depois do piloto privado:
- autenticação Google/OAuth/SSO
- usuários e roles (Admin, Product, Commercial, Viewer)
- ator real no Change History
- controle de edição por role
- optimistic concurrency / versão do record
- notificações e activity feed
