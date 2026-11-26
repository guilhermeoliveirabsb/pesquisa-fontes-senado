# Fontes: endereços técnicos e limites conhecidos

Verificado em novembro de 2026. Os sites mudam; se algo deixar de funcionar, confira na própria página.

## Diários do Senado Federal e do Congresso Nacional

Acervo: <https://legis.senado.leg.br/diarios>

| Uso | Endereço |
|---|---|
| Edições de um mês | `/diarios/resources/calendario-html?mes=M&ano=A&veiculo=V&tipo=T` |
| Página de uma edição | `/diarios/ver/{codigo}` — o HTML traz `"quantidadePaginas":N` |
| PDF de um trecho | `/diarios/BuscaPaginasDiario?codDiario={codigo}&seqPaginaInicial=a&seqPaginaFinal=b` |

- `veiculo`: 1 = Diário do Senado Federal (inclui o antigo DCN, Seção II); 2 = Diário do Congresso Nacional.
- `tipo`: 1 = data da sessão; 2 = data de publicação.
- O calendário devolve links `/diarios/ver/{codigo}`; o texto do link é o dia do mês.
- O texto de OCR traz vários espaços entre as palavras; normalize antes de procurar.
- O site aceita scripts de `cdn.jsdelivr.net`, mas não de `cdnjs.cloudflare.com` (política de segurança de conteúdo).
- Há verificação contra robôs; um navegador comum passa por ela.

## Anais do Senado (República)

`https://www.senado.leg.br/publicacoes/anais/pdf/Anais_Republica/{ano}/{ano}%20Livro%20{n}.pdf`

Volumes só digitalizados ficam em `.../pdf-digitalizado/...` com o mesmo padrão.
A função `listarAnais(ano)` do `leitor-pdfs.js` testa os dois.

## Dados Abertos do Senado

Documentação: <https://legis.senado.leg.br/dadosabertos/docs/>

| Uso | Endereço |
|---|---|
| Senadores de uma legislatura | `/dadosabertos/senador/lista/legislatura/{n}.json` |
| Cadastro de um senador | `/dadosabertos/senador/{codigo}.json` |

- No cadastro: `DadosBasicosParlamentar.DataNascimento`, `Naturalidade`, `UfNaturalidade`.
- Limite de acessos: resposta 429. Cerca de 45 consultas por minuto (pausa de 0,25 a 0,5 s) funcionaram.
- As listas das legislaturas 47 e 48 (1983-1991) estão incompletas. Os códigos que faltam aparecem nas
  páginas `https://www25.senado.leg.br/web/senadores/legislaturas-anteriores/-/a/47` (e `/48`).
- Datas como `1000-01-01` e `1900-01-01` são preenchimento padrão, não datas reais.

## Biblioteca Digital do Senado Federal (BDSF)

- Busca: `https://www2.senado.leg.br/bdsf/discover?query=...`
- Os PDFs (`/bdsf/bitstream/...`) passam por uma "Verificação de segurança". Abra um PDF numa aba antes de
  usar o `leitor-pdfs.js`; depois disso, os demais carregam.
- Obras úteis: *Senadores: dados biográficos* (registros 511980, 511981, 82008, 243061) e *Senadoras: dados
  biográficos* (650542).

## CPDOC/FGV

- Dicionário da Elite Política Republicana (1889-1930), lista de PDFs:
  <https://cpdoc.fgv.br/acervo/dicionarios/dhbpr/pdfs>
- Dicionário Histórico-Biográfico Brasileiro (pós-1930), verbetes:
  `https://www18.fgv.br/cpdoc/acervo/dicionarios/verbete-biografico/{nome-em-minusculas-com-hifens}`.
  O endereço varia (com ou sem partículas, nome parlamentar ou completo); teste variantes.
  O formulário de busca do site é lento.
