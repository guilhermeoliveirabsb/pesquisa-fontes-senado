# Pesquisa em fontes primárias do Senado Federal

Ferramentas e método para pesquisar a trajetória de senadores da República (posses, licenças,
suplências, datas e locais de nascimento) diretamente nas fontes oficiais e de referência:

- **Diários do Senado Federal e do Congresso Nacional** — acervo digital em [legis.senado.leg.br/diarios](https://legis.senado.leg.br/diarios)
- **Anais do Senado** — [senado.leg.br/publicacoes/anais](https://www.senado.leg.br/publicacoes/anais/asp/AP_AnaisRepublica.asp)
- **Dados Abertos do Senado** — [legis.senado.leg.br/dadosabertos](https://legis.senado.leg.br/dadosabertos/docs/)
- **Biblioteca Digital do Senado Federal (BDSF)** — [www2.senado.leg.br/bdsf](https://www2.senado.leg.br/bdsf/)
- **CPDOC/FGV** — Dicionário da Elite Política Republicana (1889-1930) e Dicionário Histórico-Biográfico Brasileiro

O material nasceu do projeto *Todos os Senadores da República*, que reuniu os mandatos, os períodos de
exercício e a naturalidade de pelo menos 1.400 senadores desde 1890.

## O que há aqui

| Pasta | Conteúdo |
|---|---|
| [`navegador/leitor-diarios.js`](navegador/leitor-diarios.js) | Percorre as edições dos Diários mês a mês, lê o texto dos PDFs e procura expressões. Gera CSV. |
| [`navegador/leitor-pdfs.js`](navegador/leitor-pdfs.js) | Lê uma lista de PDFs (Anais, BDSF, CPDOC) e procura expressões. Gera CSV. |
| [`python/dados_abertos.py`](python/dados_abertos.py) | Baixa os cadastros de senadores por legislatura (nome, nascimento, naturalidade). |
| [`python/cruzar.py`](python/cruzar.py) | Liga a sua lista de senadores a uma lista encontrada, por nome e data de nascimento. |
| [`exemplos/`](exemplos/) | Configurações prontas de pesquisa e arquivos de teste. |
| [`docs/fontes.md`](docs/fontes.md) | Endereços técnicos de cada fonte e seus limites conhecidos. |
| [`docs/metodo.md`](docs/metodo.md) | O método: ordem de consulta, critérios de prova, registro das decisões. |
| [`skill/pesquisa-fontes-senado/`](skill/pesquisa-fontes-senado/) | *Skill* para o Claude aplicar o mesmo método. |

## Começo rápido

### Nos Diários (sem instalar nada)

1. Abra <https://legis.senado.leg.br/diarios/ver> no Chrome, Edge ou Firefox.
2. Tecle **F12**, vá à aba **Console**, cole o conteúdo de `navegador/leitor-diarios.js` e tecle Enter.
   (Na primeira vez, o navegador pode pedir que você digite `allow pasting` antes de colar.)
3. Rode, por exemplo:

```js
await pesquisarDiarios({
  veiculo: 1, tipoData: 1,
  de: "1975-03", ate: "1975-03",
  padroes: ["prestou o compromisso", "tomou posse"],
  contexto: 300,
});
exportarResultados();   // baixa resultados-diarios.csv
```

### Nos Dados Abertos (Python)

```bash
pip install requests
python python/dados_abertos.py --de 21 --ate 57 --saida senadores.csv
python python/cruzar.py minha_lista.csv senadores.csv --saida cruzamento.csv \
    --ref-nome "Nome completo" --ref-nasc "Nascimento" \
    --enc-nome nome_completo --enc-nasc nascimento
```

## Cuidados

- Os volumes antigos são digitalizados; o texto vem de OCR e tem erros. Revise cada achado na página original.
- Os serviços do Senado limitam o número de acessos por minuto. Os scripts fazem pausas; não as reduza.
- Ausência de resultado não prova ausência do fato: o acervo tem lacunas.
- Use os scripts com moderação e para fins de pesquisa. Eles apenas automatizam consultas que qualquer
  pessoa faz à mão nos sites públicos.

## Usar com o Claude

A pasta [`skill/pesquisa-fontes-senado`](skill/pesquisa-fontes-senado/) contém uma *skill*: instruções que
ensinam o Claude a seguir este método. Para instalá-la no claude.ai, compacte a pasta em `.zip` e envie em
**Configurações → Capacidades → Skills**.

## Licença

[MIT](LICENSE): uso, cópia, modificação e redistribuição livres, inclusive para fins comerciais, desde que
mantido o aviso de licença. Os dados obtidos nas fontes seguem as condições de cada instituição.
