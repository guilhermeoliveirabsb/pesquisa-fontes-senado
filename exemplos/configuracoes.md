# Configurações de exemplo

Cole o script correspondente no console antes de rodar cada exemplo.

## Diários: posses e compromissos (início de legislatura)

```js
await pesquisarDiarios({
  veiculo: 1, tipoData: 1, de: "1975-02", ate: "1975-03",
  padroes: ["prestou o compromisso", "tomou posse", "toma assento"],
  contexto: 300,
});
```

## Diários: licenças e convocação de suplentes

```js
await pesquisarDiarios({
  veiculo: 1, tipoData: 1, de: "1979-03", ate: "1979-12",
  padroes: ["licença", "convoca(ção|do|r)\\s+(o\\s+)?suplente", /assume\s+a\s+cadeira/i],
  contexto: 250,
});
```

(Em texto simples, as palavras já toleram quebras de linha. Para variações, use expressão regular.)

## Diários: um senador específico, tolerando erros de OCR

```js
await pesquisarDiarios({
  veiculo: 1, tipoData: 1, de: "1975-03", ate: "1975-03", maxEdicoes: 2,
  padroes: [/Petr[oô]nio\s+Port?ell?a/i],
  contexto: 200,
});
```

## Anais: um ano inteiro

Abra uma página de www.senado.leg.br e cole `leitor-pdfs.js`:

```js
const livros = await listarAnais(1925);
await pesquisarPdfs({ urls: livros, padroes: ["reconhecido senador", "tomou posse"] });
exportarResultadosPdf();
```

## CPDOC: naturalidade nos verbetes da Primeira República

Abra <https://cpdoc.fgv.br/acervo/dicionarios/dhbpr/pdfs> e cole `leitor-pdfs.js`:

```js
await pesquisarPdfs({ urls: listarPdfsDaPagina(/^A/), padroes: ["nasceu em"], contexto: 150 });
exportarResultadosPdf();
```

## Cruzamento de listas (arquivos de teste desta pasta)

```bash
python python/cruzar.py exemplos/referencia-exemplo.csv exemplos/encontrados-exemplo.csv \
    --saida cruzamento.csv --ref-nome "Nome completo" --ref-nasc "Data de nascimento" \
    --enc-nome nome_completo --enc-nasc nascimento
# {'casado': 3, 'sem_par': 1}
```
