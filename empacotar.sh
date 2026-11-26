#!/bin/sh
# Copia scripts e documentos para a pasta da skill e gera dist/pesquisa-fontes-senado-skill.zip
set -e
cd "$(dirname "$0")"
S=skill/pesquisa-fontes-senado
mkdir -p "$S/scripts" "$S/referencias" dist
cp navegador/*.js python/*.py "$S/scripts/"
cp docs/fontes.md docs/metodo.md "$S/referencias/"
cp exemplos/configuracoes.md "$S/referencias/exemplos.md"
rm -f dist/pesquisa-fontes-senado-skill.zip
(cd skill && zip -qr ../dist/pesquisa-fontes-senado-skill.zip pesquisa-fontes-senado -x '*/__pycache__/*')
echo "dist/pesquisa-fontes-senado-skill.zip gerado"
