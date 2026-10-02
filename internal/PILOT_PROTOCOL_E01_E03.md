# PILOT_PROTOCOL_E01_E03

## Coorte
Usuários reais qualificados do piloto em Setor Bueno e Setor Marista.

## Link oficial
`/landing/?src=pilot_e01_e03&cohort=bueno_marista_oct2026`

## Link de teste interno
`/landing/?src=internal&cohort=bueno_marista_oct2026`

Nunca enviar o link interno para participantes reais.

## Métricas
### E01
Unidade: sessão única da coorte.
Denominador: `landing_view`.
Numerador: `demand_submitted`.
Guardrail: `demand_qualified`.

### E02
Unidade: sessão única elegível.
Denominador: sessão com `demand_submitted` ou `demand_supported`.
Numerador: sessão com `share_clicked`.

### E03
Unidade: sessão única starter.
Denominador: `create_demand_started` ou `support_started`.
Numerador: `demand_qualified`.

## Amostra inicial
20 sessões elegíveis por experimento antes de aplicar a primeira regra de decisão.

## Regras pré-registradas
- E01: >=30% manter; 15–29% iterar; <15% reavaliar.
- E02: >=20% manter; 10–19% iterar; <10% reavaliar.
- E03: >=70% manter; 50–69% iterar; <50% revisar.

## Interpretação
Esses thresholds são gates operacionais iniciais, não testes de significância estatística.
