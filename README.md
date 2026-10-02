# WANT

Repositório canônico do projeto WANT.

## Arquitetura atual

O produto foi separado em duas superfícies para evitar que respondentes do piloto acessem ferramentas operacionais:

- **Public**: landing, clusters, criação/apoio de demanda e tracking necessário.
- **Internal**: Project Control, B2B Intelligence, Pilot Lab e documentação operacional.

## Release preservado

Os pacotes completos v6.8 estão preservados em `archives/` como Base64 particionado, porque contêm arquivos binários e artifacts completos. Rode `python tools/reconstruct_archives.py` para recriar os ZIPs byte a byte.

Checksums esperados:

- `WANT_Public_v6_8.zip`: `1ccea89d1202cf471e07c560774b5270bd30fc680068c72706cf5dc6959078e5`
- `WANT_Internal_v6_8.zip`: `b3565fdcb67b1fb7fa7aa86cc8e83539ff68893dbb79f4fbccf17cd2776f1b86`

## Segurança

Nenhum valor secreto deve ser commitado. `APPS_SCRIPT_TOKEN` e `SHARED_TOKEN` devem existir apenas nos ambientes de execução.
