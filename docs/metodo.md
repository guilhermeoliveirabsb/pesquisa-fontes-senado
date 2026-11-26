# Método

## 1. Partir de uma base e registrar tudo nela

Mantenha uma planilha de referência, uma linha por senador, com nome parlamentar, nome completo, data de
nascimento, UF e os períodos de mandato e de exercício. Cada alteração deve poder ser rastreada até uma
fonte: anote a fonte (edição, página, link) numa coluna ou num arquivo de notas.

## 2. Ordem de consulta

1. **Dados Abertos** — cadastro oficial; rápido e em massa. Bom para nomes, nascimento e naturalidade.
2. **Páginas biográficas do Senado** e obras *Senadores: dados biográficos* (BDSF) — completam os
   cadastros vazios, sobretudo antes de 1991.
3. **CPDOC/FGV** — verbetes biográficos; úteis para naturalidade e trajetória.
4. **Diários e Anais** — fonte primária para datas: posse, compromisso regimental, licenças, convocação
   de suplentes, renúncia, perda de mandato, falecimento.

Quando as fontes divergem, prevalece o registro primário (Diário ou Anais) sobre o secundário, e o
registro contemporâneo ao fato sobre o posterior. Anote a divergência.

## 3. Ligar registros com cuidado

Nomes mudam de grafia (Ruy/Rui, Mello/Melo, Luiz/Luís) e homônimos existem. Use `cruzar.py` e revise:

- **nome** — nome completo igual após normalização: em geral seguro.
- **nasc+nome** — mesma data de nascimento e pelo menos dois nomes em comum: revisar.
- **nomes** — nomes contidos uns nos outros e ano compatível: revisar sempre.

## 4. Procurar nos Diários

- Escolha expressões típicas do registro da época: "prestou o compromisso", "tomou posse",
  "toma assento", "licença", "suplente", "convocação". Teste em poucas edições (`maxEdicoes`) antes de
  rodar meses inteiros.
- O OCR erra letras; prefira trechos curtos ou expressões regulares tolerantes (`/Petr[oô]nio\s+Port?ell?a/i`).
- Confirme cada achado na página original (link no CSV) antes de registrar a data.

## 5. Registrar o resultado

Para cada dado novo, registre: valor, fonte (veículo, data, edição, página), link e observação sobre
dúvidas. Ausência de resultado não prova ausência do fato — registre como "não localizado", não como "não houve".
