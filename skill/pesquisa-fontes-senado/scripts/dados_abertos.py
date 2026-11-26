#!/usr/bin/env python3
"""
Coleta de dados de senadores nos Dados Abertos do Senado Federal
================================================================

Baixa a lista de senadores de cada legislatura e, para cada um, os dados básicos
(nome parlamentar, nome completo, sexo, data e local de nascimento). O resultado é um
arquivo CSV que abre no Excel ou no Google Sheets.

Uso:
    python dados_abertos.py --de 21 --ate 57 --saida senadores.csv

    --de / --ate   intervalo de legislaturas (1 = 1826, Império; 21 = 1891, primeira da República;
                   57 = 2023-2027). Padrão: 21 a 57.
    --pausa        segundos entre requisições (padrão 0.5)

Requer Python 3.8+ e o pacote "requests" (pip install requests).

Observações:
- O serviço limita o número de acessos. Quando responde 429 ("muitas requisições"),
  o script espera e tenta de novo. Uma coleta completa (cerca de 1.900 cadastros) leva
  de 20 a 40 minutos.
- As listas por legislatura incluem suplentes que nunca exerceram o mandato.
- As listas das legislaturas 47 e 48 (1983-1991) são incompletas no serviço; os demais
  nomes desse período estão nas páginas "legislaturas anteriores" do site do Senado.
- Datas "1000-01-01", "1900-01-01" e "1950-01-01" costumam ser preenchimentos padrão,
  não datas reais.

Documentação oficial: https://legis.senado.leg.br/dadosabertos/docs/
Licença MIT — veja o arquivo LICENSE do repositório.
"""
import argparse
import csv
import sys
import time

import requests

BASE = "https://legis.senado.leg.br/dadosabertos"
SESSAO = requests.Session()
SESSAO.headers.update({"Accept": "application/json", "User-Agent": "pesquisa-fontes-senado/1.0"})


def obter(url, tentativas=6):
    for i in range(tentativas):
        r = SESSAO.get(url, timeout=60)
        if r.status_code == 429 or r.status_code >= 500:
            espera = 15 * (i + 1)
            print(f"  servidor pediu pausa ({r.status_code}); aguardando {espera}s", file=sys.stderr)
            time.sleep(espera)
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"sem resposta: {url}")


def como_lista(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def senadores_da_legislatura(n):
    j = obter(f"{BASE}/senador/lista/legislatura/{n}.json")
    ps = (((j.get("ListaParlamentarLegislatura") or {}).get("Parlamentares") or {}).get("Parlamentar"))
    for p in como_lista(ps):
        ident = p.get("IdentificacaoParlamentar") or {}
        if ident.get("CodigoParlamentar"):
            yield ident


def detalhe(codigo):
    j = obter(f"{BASE}/senador/{codigo}.json")
    p = (j.get("DetalheParlamentar") or {}).get("Parlamentar") or {}
    return p.get("IdentificacaoParlamentar") or {}, p.get("DadosBasicosParlamentar") or {}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--de", type=int, default=21)
    ap.add_argument("--ate", type=int, default=57)
    ap.add_argument("--saida", default="senadores.csv")
    ap.add_argument("--pausa", type=float, default=0.5)
    a = ap.parse_args()

    cods = {}
    for n in range(a.de, a.ate + 1):
        k = 0
        for ident in senadores_da_legislatura(n):
            c = ident["CodigoParlamentar"]
            cods.setdefault(c, {"legislaturas": []})["legislaturas"].append(n)
            k += 1
        print(f"legislatura {n}: {k} nomes", file=sys.stderr)
        time.sleep(a.pausa)

    campos = ["codigo", "nome_parlamentar", "nome_completo", "sexo", "nascimento",
              "naturalidade", "uf_naturalidade", "legislaturas"]
    with open(a.saida, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos, delimiter=";")
        w.writeheader()
        for i, (c, info) in enumerate(sorted(cods.items(), key=lambda x: int(x[0])), 1):
            ident, dados = detalhe(c)
            w.writerow({
                "codigo": c,
                "nome_parlamentar": ident.get("NomeParlamentar", ""),
                "nome_completo": ident.get("NomeCompletoParlamentar", ""),
                "sexo": ident.get("SexoParlamentar", ""),
                "nascimento": dados.get("DataNascimento", ""),
                "naturalidade": dados.get("Naturalidade", ""),
                "uf_naturalidade": dados.get("UfNaturalidade", ""),
                "legislaturas": ",".join(map(str, info["legislaturas"])),
            })
            if i % 50 == 0:
                print(f"  {i}/{len(cods)} cadastros", file=sys.stderr)
                f.flush()
            time.sleep(a.pausa)
    print(f"Concluído: {len(cods)} cadastros em {a.saida}", file=sys.stderr)


if __name__ == "__main__":
    main()
