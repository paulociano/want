# WANT Brand Guidelines v1.1

## 1. Essence
**Brand anchor:** um sinal local ficando visível.

WANT torna desejos locais dispersos legíveis como sinais de demanda.  
A identidade usa **Signal Map** como direção dominante e **Civic Pulse** como camada humana controlada.

## 2. Logo system
### Canonical masters
- Logomark: `brand/logo/source/want-logomark-master.svg`
- Wordmark: `brand/logo/source/want-wordmark-master.svg`
- Horizontal lockup: `brand/logo/source/want-lockup-horizontal-master.svg`
- Stacked lockup: `brand/logo/source/want-lockup-stacked-master.svg`

### Construction
O wordmark é geometria vetorial própria, sem dependência de uma fonte para formar WANT.
O `A` permanece aberto e o ponto coral funciona como pulso humano. Não é um pin de localização.

### Clear space
Usar no mínimo **1x** de área livre ao redor do logo, onde `x` é o diâmetro do ponto coral do wordmark.

### Minimum digital sizes
- logomark: 24 × 24 px
- wordmark: 96 px de largura
- horizontal lockup: 180 px de largura
Abaixo disso, usar somente o logomark.

### Backgrounds
Preferidos:
- Cream / branco
- Graphite
- fotografia escura com contraste controlado

### Monochrome
Versões mono existem para situações em que cor não é confiável ou permitida.

### Do not
- esticar, condensar ou rotacionar;
- mover ou ampliar arbitrariamente o pulso coral;
- transformar a marca em pin/map marker;
- aplicar glow, bevel ou gradiente dentro do master;
- reescrever WANT usando fonte parecida;
- colocar o logo sobre textura que elimine contraste.

## 3. Color system
- Graphite `#0B0F14`: marca, texto forte, superfícies premium
- Indigo `#1B2A4B`: território, profundidade, apoio digital
- Mint `#22D3A0`: sinal vivo, atividade, intenção emergente
- Coral `#FF7A5C`: pulso humano, ação e proximidade
- Cream `#F7F5F0`: canvas primário
- Stone `#E5E7EB`: suporte, divisores, superfícies neutras

### Proportion
- 55–70% Cream/white
- 15–25% Graphite/Indigo
- 5–10% Mint
- 2–6% Coral

Cor nunca é o único portador de estado.

## 4. Typography
### Product UI
System sans / Inter-compatible stack.

### Display
Heavy grotesk, tracking compacto, frases curtas.

### Body
Regular/medium sans com legibilidade acima de expressão.

### Labels
Caixa alta somente para metadados curtos.

O wordmark **não** é texto tipográfico e não deve ser reconstruído com fonte.

## 5. Graphic language
### Signal Orbit
Círculos concêntricos e pontos de atividade. Uso em hero, mapas abstratos e superfícies de destaque.

### Demand Strip
Barra qualitativa de intensidade. Não deve parecer score financeiro.

### Signal Stage
Vocabulário: Sinal inicial, Ganhando força, Demanda qualificada.

### Territory Grid
Grid sutil. Nunca competir com conteúdo.

## 6. Imagery
Preferir:
- cenas locais reais;
- fachadas, comércio, ruas e pessoas em contexto;
- enquadramentos urbanos próximos;
- overlays territoriais discretos.

Evitar:
- mapas satélite excessivamente futuristas;
- neon cyberpunk;
- bancos de imagem corporativos genéricos;
- multidões abstratas sem conexão com território.

## 7. Iconography
- stroke simples e consistente;
- cantos levemente arredondados;
- ícones funcionais devem ser neutros;
- o logomark não deve virar um estilo obrigatório para todos os ícones.

## 8. Layout
- estrutura editorial limpa;
- alta hierarquia;
- cards compactos;
- dados primeiro, decoração depois;
- contraste entre superfícies claras e blocos graphite.

## 9. Motion
- feedback de 140–280 ms;
- motion explica estado, não decora;
- Signal Orbit pode pulsar em destaque, de forma discreta;
- `prefers-reduced-motion` é obrigatório.

## 10. Voice
WANT fala curto, direto e concreto.

### Preferred language
- sinal
- demanda
- perto de você
- ganhando força
- quero que exista
- oportunidade
- mapa de intenção

### Avoid
- jargão de startup na experiência consumidor;
- afirmar representatividade estatística sem base;
- linguagem grandiosa;
- gamificação vazia.

## 11. Core messages
Consumidor:
**O que você gostaria que existisse perto de você?**

B2B:
**Veja onde existe demanda antes de existir oferta.**

Brand statement:
**WANT = o mapa do que as pessoas querem que exista.**

## 12. Application matrix
### Landing / Cluster
Consumidor primeiro, calor humano controlado, mint + coral em pequenos sinais.

### B2B Intelligence
Graphite/Indigo dominantes, dados legíveis, confiança operacional com ressalvas explícitas.

### Pilot Lab
Neutro e instrumental. Marca presente sem transformar experimento em campanha.

### Project Control
Marca discreta. Ferramenta operacional não deve competir visualmente com o estado do trabalho.

## 13. Authority and governance
Source of truth:
`brand/brand-model.json`

Assets:
`brand/logo/`

Derived product tokens:
`brand/tokens.css`

Human guidelines:
`BRAND_GUIDELINES_v1.md`

Mudanças no símbolo, wordmark, cores canônicas ou regras objetivas devem atualizar primeiro o brand model e os masters, depois derivados e produto.


## 14. Product application v1.2

A identidade deixa de ser apenas asset/brand layer e passa a governar o runtime por `brand/application.css`.

### Mapping operacional
- Graphite: navegação, dark panels, CTA estrutural e contraste.
- Indigo: território, hierarquia e leitura de inteligência.
- Mint: sinal vivo, status positivo, progressão e atividade.
- Coral: pulso humano, CTA de declaração/apoio e destaques pontuais.
- Cream: canvas principal e redução da sensação de SaaS genérico.

### Surface grammar
- Landing: cream + graphite signal card + coral CTA + mint signal.
- B2B: hero graphite/indigo + mint intelligence layer + coral opportunity cues.
- Pilot: instrumental cream canvas + dark hero + multi-signal progress.
- Project Control: graphite navigation + cream workspace + brand accents sem comprometer leitura operacional.


## 15. Experience application v1.3
- landing uses a dark Signal Map-first runtime with map pins, floating demand cards and live-neighborhood framing.
- the wordmark T geometry was refined for better balance in digital headers.
- B2B, Pilot and Control now inherit the same visual language using runtime imagery from the approved concept direction.
