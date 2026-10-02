# WANT Design System v1

## Visual thesis
WANT é um mapa vivo de intenção local: sóbrio o bastante para parecer dado, humano o bastante para parecer desejo.

## Princípios
1. **Sinal antes de decoração** — cada elemento expressivo deve reforçar demanda, proximidade ou intensidade.
2. **Território visível** — grid, órbitas e marcadores sugerem localização sem transformar a interface em mapa literal.
3. **Intenção legível** — pessoas, clientes, raio, frequência e preço têm prioridade sobre ornamento.
4. **Progressão sem gamificação vazia** — estágios como Sinal inicial, Ganhando força e Demanda qualificada resumem volume sem inventar score.
5. **Calma operacional** — motion curto e responsivo; reduced motion sempre disponível.

## Tokens semânticos
- `--brand`: ação e destaque primário.
- `--signal`: atividade/intenção viva.
- `--signal-deep`: estado de sinal e confirmação.
- `--graphite`: superfícies de contraste e marca.
- `--warm`: contexto humano/categoria.
- `--soft`: canvas territorial.

## Elementos assinatura
- **Signal Orbit**: círculos concêntricos + pontos, usado somente em superfícies de destaque.
- **Demand Strip**: barra de força qualitativa dos cards.
- **Signal Stage**: linguagem textual dos estágios.
- **Territory Grid**: grid sutil de fundo, nunca dominante.

## Component contracts
### Demand Card
Deve mostrar: categoria, bairro, estágio, título, descrição curta, pessoas, potenciais clientes, raio e CTA.

### Cluster Hero
Deve mostrar: categoria/local, título, contexto, número de pessoas e três fatos operacionais.

### Demand Wizard
Deve preservar: 4 passos, progresso, foco visível, Escape, feedback de sucesso/erro e reduced motion.

## Motion
- microtransições: 140–280ms;
- sem smooth-scroll obrigatório;
- hover nunca contém informação essencial;
- `prefers-reduced-motion` remove animações e transições.

## Autoridade
Implementação em `landing/index.html` + `landing/app.js` é a verdade operacional.
Este arquivo registra decisões e contratos, não duplica cada valor.


## Brand System v1 · applied in v6.0
Canonical model: `brand/brand-model.json`
Master logo: `brand/logo/source/want-logomark-master.svg`
Tokens: `brand/tokens.css`
Palette: Graphite #0B0F14, Indigo #1B2A4B, Mint #22D3A0, Coral #FF7A5C, Cream #F7F5F0, Stone #E5E7EB.
Signal Map is dominant; Civic Pulse enters only as controlled human warmth.

## Wordmark master · v6.1
The WANT wordmark is now custom vector geometry and no longer depends on live text or a font file.
Canonical source: `brand/logo/source/want-wordmark-master.svg`.

Below 96 px of wordmark width, use the logomark only.


## Brand application layer · v6.2
`brand/application.css` is the runtime owner of the WANT visual identity across product surfaces.
Legacy local color values may remain for compatibility, but this stylesheet has final visual authority.
New visual work should consume semantic WANT roles rather than introduce new purple/blue brand accents.
