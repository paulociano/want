# T-011 · Mock do painel B2B

## Objetivo
Transformar clusters reais do MVP em uma superfície comercial que ajude uma PME/local ou rede regional a entender uma oportunidade sem ler dados brutos.

## Usuário
Owner, sócio, operador ou responsável por expansão.

## Decisão suportada
“Vale investigar esta demanda local com mais profundidade?”

## Dados exibidos
- cluster / necessidade;
- bairro;
- quantidade de pessoas;
- quantidade que declarou “eu seria cliente”;
- ticket;
- frequência;
- raio;
- momento de uso;
- atributos indispensáveis;
- confiança operacional do sinal.

## Confiança do sinal
Não é score estatístico nem previsão de mercado.

- **Forte**: 15+ apoiadores e >=55% de intenção explícita de cliente.
- **Moderada**: 8+ apoiadores e >=45% de intenção explícita.
- **Inicial**: sinal real abaixo dos thresholds acima.
- **Sem leitura**: ausência de volume.

Os thresholds são heurísticos para o mock e devem ser revisados com dados dos experimentos.

## Fonte
`GET /api/sheets?action=clusters`

## Acceptance
- painel abre dados reais compartilhados;
- mostra ticket, frequência, raio e confiança;
- permite filtrar categoria/bairro;
- permite abrir cluster consumidor;
- deixa explícita a limitação da confiança operacional.
