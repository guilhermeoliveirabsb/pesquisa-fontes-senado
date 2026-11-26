---
name: pesquisa-fontes-senado
description: Pesquisa da trajetória de senadores brasileiros (posses, licenças, suplências, nascimento, naturalidade) nos Diários e Anais do Senado, Dados Abertos, Biblioteca Digital do Senado e CPDOC/FGV.
---

# Pesquisa em fontes primárias do Senado Federal

Use esta skill quando a tarefa pedir datas ou dados biográficos de senadores da República — posse,
compromisso regimental, licença, convocação de suplente, renúncia, perda de mandato, falecimento, data e
local de nascimento — e for preciso prová-los com fontes oficiais.

Responda em português, com a linguagem da política institucional. Para contagens não exatas, use
"pelo menos".

## Ordem de consulta

1. **Dados Abertos** (`legis.senado.leg.br/dadosabertos`): cadastro por legislatura e por senador.
   Respeite o limite de acessos (resposta 429): no máximo cerca de 45 consultas por minuto.
   As legislaturas 47 e 48 estão incompletas; complete pelos códigos em
   `www25.senado.leg.br/web/senadores/legislaturas-anteriores/-/a/47`.
2. **Páginas biográficas do Senado** e obras *Senadores: dados biográficos* na BDSF.
3. **CPDOC/FGV**: DHBPR (1889-1930, PDFs) e DHBB (verbetes em `www18.fgv.br/cpdoc/...`).
4. **Diários e Anais**: fonte primária para datas. Prevalecem sobre as fontes secundárias.

Os endereços técnicos de cada fonte estão em `docs/fontes.md` do repositório
<https://github.com/guilhermeoliveirabsb/pesquisa-fontes-senado>.

## Como ler os Diários

- Edições de um mês: `/diarios/resources/calendario-html?mes=M&ano=A&veiculo=V&tipo=T`
  (veículo 1 = DSF, incluindo o DCN Seção II; 2 = DCN; tipo 1 = sessão, 2 = publicação).
- Número de páginas: `"quantidadePaginas":N` no HTML de `/diarios/ver/{codigo}`.
- PDF de um trecho: `/diarios/BuscaPaginasDiario?codDiario=X&seqPaginaInicial=a&seqPaginaFinal=b`.
- Os sites do Senado bloqueiam scripts de fora, exceto `cdn.jsdelivr.net`; carregue o pdf.js de lá.
- Se houver um navegador disponível, use o `navegador/leitor-diarios.js` do repositório numa aba de
  `legis.senado.leg.br`. Teste com `maxEdicoes` pequeno antes de varrer meses inteiros.
- Normalize espaços (o OCR deixa vários) e aceite quebras de linha entre as palavras.

## Critérios de prova

- Confirme cada achado na página original antes de registrar; cite veículo, data, edição, página e link.
- Ao ligar registros de listas diferentes, use nome completo normalizado e data de nascimento
  (`python/cruzar.py`). Casos por "nasc+nome" ou "nomes" exigem revisão.
- Quando fontes divergirem, prefira a primária e a contemporânea ao fato, e registre a divergência.
- Ausência de resultado não prova ausência do fato: registre "não localizado".

## Entrega

Entregue os achados numa tabela (senador, dado, valor, fonte, link, observação) e aponte claramente o
que ficou sem confirmação.
