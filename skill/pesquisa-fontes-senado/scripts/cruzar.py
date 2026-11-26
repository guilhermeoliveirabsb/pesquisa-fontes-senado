#!/usr/bin/env python3
"""
Cruzamento de nomes entre duas listas
=====================================

Liga os registros de uma lista "de referência" (por exemplo, os senadores do seu trabalho)
aos de uma lista "encontrada" (por exemplo, o CSV gerado por dados_abertos.py), usando
nome completo e, quando houver, data de nascimento. Tolera diferenças de acentuação,
letras dobradas (Mello/Melo), y/i, ph/f e th/t.

Uso:
    python cruzar.py referencia.csv encontrados.csv --saida cruzamento.csv \
        --ref-nome "Nome completo" --ref-nasc "Data de nascimento" \
        --enc-nome nome_completo --enc-nasc nascimento

Os dois arquivos devem ser CSV com cabeçalho (separador ";" ou ","). Datas podem estar em
AAAA-MM-DD, DD/MM/AAAA ou AAAA/MM/DD.

Saída: uma linha por registro da referência, com a coluna "situacao":
    casado      - um único registro correspondente (veja "criterio")
    ambiguo     - mais de um candidato (todos listados em "candidatos")
    sem_par     - nenhum candidato
Critérios, do mais forte para o mais fraco:
    nome        - nome completo igual (após normalização)
    nasc+nome   - mesma data de nascimento e pelo menos dois nomes em comum
    nomes       - todos os nomes do mais curto contidos no mais longo, ano de nascimento compatível
Revise sempre os casos "nasc+nome" e "nomes" antes de usar o resultado.

Licença MIT — veja o arquivo LICENSE do repositório.
"""
import argparse
import csv
import re
import unicodedata
from collections import defaultdict

PARTICULAS = {"de", "da", "do", "dos", "das", "e", "du"}
SUFIXOS = {"filho", "junior", "neto", "sobrinho"}


def normalizar(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = s.replace("y", "i").replace("ph", "f").replace("th", "t")
    s = re.sub(r"[^a-z ]", " ", s)
    s = re.sub(r"(.)\1", r"\1", s)
    return " ".join(s.split())


def nomes(s):
    return set(normalizar(s).split()) - PARTICULAS - SUFIXOS


def data_iso(s):
    s = (s or "").strip()
    m = re.match(r"^(\d{4})[-/](\d{2})[-/](\d{2})", s)
    if m:
        return "-".join(m.groups())
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", s)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    return ""


def ler(caminho):
    with open(caminho, encoding="utf-8-sig", newline="") as f:
        amostra = f.read(4096)
        f.seek(0)
        sep = ";" if amostra.count(";") >= amostra.count(",") else ","
        return list(csv.DictReader(f, delimiter=sep))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("referencia")
    ap.add_argument("encontrados")
    ap.add_argument("--saida", default="cruzamento.csv")
    ap.add_argument("--ref-nome", required=True)
    ap.add_argument("--ref-nasc", default="")
    ap.add_argument("--enc-nome", required=True)
    ap.add_argument("--enc-nasc", default="")
    a = ap.parse_args()

    ref, enc = ler(a.referencia), ler(a.encontrados)
    por_nome, por_nasc = defaultdict(list), defaultdict(list)
    for i, r in enumerate(enc):
        por_nome[normalizar(r.get(a.enc_nome, ""))].append(i)
        d = data_iso(r.get(a.enc_nasc, "")) if a.enc_nasc else ""
        if d:
            por_nasc[d].append(i)

    saida = []
    for r in ref:
        nome = r.get(a.ref_nome, "")
        nasc = data_iso(r.get(a.ref_nasc, "")) if a.ref_nasc else ""
        cand, crit = por_nome.get(normalizar(nome), []), "nome"
        if len(cand) > 1 and nasc:
            cand = [i for i in cand if data_iso(enc[i].get(a.enc_nasc, "")) == nasc] or cand
        if len(cand) != 1 and nasc:
            cand = [i for i in por_nasc.get(nasc, []) if len(nomes(enc[i].get(a.enc_nome, "")) & nomes(nome)) >= 2]
            crit = "nasc+nome"
        if len(cand) != 1:
            n1 = nomes(nome)
            cc = []
            for i, e in enumerate(enc):
                n2 = nomes(e.get(a.enc_nome, ""))
                if len(n1 & n2) >= max(2, min(len(n1), len(n2))):
                    d = data_iso(e.get(a.enc_nasc, "")) if a.enc_nasc else ""
                    if not nasc or not d or d[:4] == nasc[:4]:
                        cc.append(i)
            if len(cc) == 1 or (cc and not cand):
                cand, crit = cc, "nomes"
        linha = dict(r)
        if len(cand) == 1:
            e = enc[cand[0]]
            linha.update({"situacao": "casado", "criterio": crit, "candidatos": ""})
            for k, v in e.items():
                linha[f"enc_{k}"] = v
        else:
            linha.update({"situacao": "ambiguo" if cand else "sem_par", "criterio": "",
                          "candidatos": " | ".join(enc[i].get(a.enc_nome, "") for i in cand)})
        saida.append(linha)

    campos = []
    for l in saida:
        for k in l:
            if k not in campos:
                campos.append(k)
    with open(a.saida, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos, delimiter=";")
        w.writeheader()
        w.writerows(saida)
    resumo = defaultdict(int)
    for l in saida:
        resumo[l["situacao"]] += 1
    print(dict(resumo), "→", a.saida)


if __name__ == "__main__":
    main()
