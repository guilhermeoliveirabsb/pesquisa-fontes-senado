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

## Arquivos desta skill

| Arquivo | Quando ler ou usar |
|---|---|
| `referencias/fontes.md` | Antes de acessar qualquer fonte: endereços técnicos, limites e armadilhas. |
| `referencias/metodo.md` | Ao planejar a pesquisa e ao decidir entre fontes divergentes. |
| `referencias/exemplos.md` | Para montar a configuração de uma busca nos Diários, Anais ou CPDOC. |
| `scripts/leitor-diarios.js` | Busca em massa nos Diários, executada numa aba de `legis.senado.leg.br`. |
| `scripts/leitor-pdfs.js` | Busca em PDFs dos Anais, da BDSF ou do CPDOC, executada numa aba do mesmo site. |
| `scripts/dados_abertos.py` | Coleta dos cadastros de senadores por legislatura (requer acesso à internet). |
| `scripts/cruzar.py` | Liga uma lista de senadores a outra por nome e data de nascimento. |

## Escolher o caminho conforme as ferramentas disponíveis

1. **Há um navegador que você controla** (Claude no Chrome ou o navegador do aplicativo, com uma
   ferramenta que executa JavaScript na página): abra o site da fonte, leia o arquivo do script
   correspondente e execute o conteúdo dele na página; depois chame as funções
   (`pesquisarDiarios`, `pesquisarPdfs`, `listarAnais`, `listarPdfsDaPagina`). Teste com `maxEdicoes: 1`
   ou com poucos PDFs antes de varrer períodos longos. Leia os resultados com
   `JSON.parse(localStorage.getItem("leitorDiarios.v1"))` (ou `"leitorPdfs.v1"`), em vez de baixar o CSV.
2. **Só há busca e leitura de páginas da web**: consulte os endereços de `referencias/fontes.md`
   diretamente (cadastros dos Dados Abertos em JSON, páginas biográficas, verbetes do CPDOC). Serve para
   poucos senadores ou poucas datas; avise a pessoa quando a tarefa exigir a busca em massa.
3. **Há execução de código com internet liberada**: use os scripts Python. Em ambientes sem acesso aos
   sites do Senado, `cruzar.py` continua útil com arquivos que a pessoa enviar.
4. **Nenhum dos anteriores basta**: entregue à pessoa a configuração pronta (veja
   `referencias/exemplos.md`) e as instruções do README para ela rodar o script no próprio navegador.

## Ordem de consulta

1. **Dados Abertos**: cadastro oficial por legislatura e por senador. No máximo cerca de 45 consultas
   por minuto. Legislaturas 47 e 48 incompletas.
2. **Páginas biográficas do Senado** e obras *Senadores: dados biográficos* na BDSF.
3. **CPDOC/FGV**: DHBPR (1889-1930, PDFs) e DHBB (verbetes).
4. **Diários e Anais**: fonte primária para datas; prevalecem sobre as fontes secundárias.

## Critérios de prova

- Confirme cada achado na página original antes de registrar; cite veículo, data, edição, página e link.
- O texto dos volumes antigos vem de OCR, com erros; use padrões tolerantes e revise os trechos.
- Ao ligar registros de listas diferentes, casos por "nasc+nome" ou "nomes" (`cruzar.py`) exigem revisão.
- Quando fontes divergirem, prefira a primária e a contemporânea ao fato, e registre a divergência.
- Ausência de resultado não prova ausência do fato: registre "não localizado".

## Entrega

Entregue os achados numa tabela (senador, dado, valor, fonte, link, observação) e aponte claramente o
que ficou sem confirmação.

Repositório do método: <https://github.com/guilhermeoliveirabsb/pesquisa-fontes-senado> (licença MIT).
