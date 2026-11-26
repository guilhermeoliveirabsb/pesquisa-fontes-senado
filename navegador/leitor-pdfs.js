/*
 * Leitor de PDFs (Anais do Senado, Biblioteca Digital do Senado, CPDOC e outros)
 * -----------------------------------------------------------------------------
 * Abre uma lista de PDFs, extrai o texto e procura expressões definidas por você.
 *
 * COMO USAR
 * 1. Abra, no navegador, uma página do MESMO SITE dos PDFs (o navegador só deixa um site ler
 *    arquivos dele mesmo):
 *      - Anais do Senado:  https://www.senado.leg.br/publicacoes/anais/asp/AP_AnaisRepublica.asp
 *      - Biblioteca Digital do Senado: https://www2.senado.leg.br/bdsf/
 *        (antes, abra um dos PDFs numa aba para passar pela "Verificação de segurança")
 *      - CPDOC/FGV:  https://cpdoc.fgv.br/acervo/dicionarios/dhbpr/pdfs
 * 2. Abra o console (F12 → "Console"), cole este arquivo e tecle Enter.
 * 3. Chame, por exemplo:
 *
 *      await pesquisarPdfs({
 *        urls: [
 *          "https://www.senado.leg.br/publicacoes/anais/pdf/Anais_Republica/1925/1925%20Livro%201.pdf",
 *        ],
 *        padroes: ["tomou posse", "prestou o compromisso"],
 *        contexto: 300,
 *      });
 *
 *    Para os Anais da República, a função listarAnais(ano) devolve os endereços dos livros de um ano:
 *      const livros = await listarAnais(1925);
 *      await pesquisarPdfs({ urls: livros, padroes: ["licença"] });
 *
 *    Na lista de verbetes do CPDOC, listarPdfsDaPagina() reúne os PDFs com link na página:
 *      await pesquisarPdfs({ urls: listarPdfsDaPagina(/^AB/), padroes: ["nasceu em"] });
 *
 * 4. exportarResultadosPdf() baixa um CSV com arquivo, página, expressão e trecho.
 *
 * CUIDADOS
 * - Livros digitalizados têm texto de OCR, com erros e colunas embaralhadas; alguns não têm texto
 *   nenhum (só imagem) — nesse caso o script avisa "sem texto".
 * - Arquivos grandes (centenas de páginas) levam alguns minutos cada.
 *
 * Licença MIT — veja o arquivo LICENSE do repositório.
 */
(function () {
  "use strict";
  const PDFJS_OPCOES = [
    ["https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.min.mjs", "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs"],
    ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs"],
  ];
  const CHAVE = "leitorPdfs.v1";
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let pdfjs = null;

  async function carregarPdfJs() {
    if (pdfjs) return pdfjs;
    for (const [lib, worker] of PDFJS_OPCOES) {
      try { pdfjs = await import(lib); pdfjs.GlobalWorkerOptions.workerSrc = worker; return pdfjs; }
      catch (e) { console.warn("pdf.js indisponível em", lib); }
    }
    throw new Error("Não foi possível carregar o pdf.js neste site (política de segurança do site).");
  }
  function lerEstado() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || { lidos: {}, achados: [] }; }
    catch (e) { return { lidos: {}, achados: [] }; }
  }
  function gravarEstado(est) {
    try { localStorage.setItem(CHAVE, JSON.stringify(est)); }
    catch (e) { console.warn("Não foi possível guardar o progresso. Exporte os resultados agora.", e); }
  }
  async function baixar(url, tentativas = 5) {
    for (let i = 0; i < tentativas; i++) {
      const r = await fetch(url, { credentials: "same-origin" });
      if (r.status === 429 || r.status >= 500) { await espera(15000 * (i + 1)); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const tipo = r.headers.get("content-type") || "";
      if (!/pdf|octet-stream/.test(tipo)) throw new Error(`não é PDF (${tipo}) — talvez a verificação de segurança do site; abra o PDF numa aba e tente de novo`);
      return r.arrayBuffer();
    }
    throw new Error("sem resposta");
  }

  // texto de cada página de um PDF
  window.textoDoPdf = async function (url) {
    const lib = await carregarPdfJs();
    const doc = await lib.getDocument({ data: await baixar(url) }).promise;
    const paginas = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      let s = "", y = null;
      for (const it of c.items) {
        if (y !== null && Math.abs(it.transform[5] - y) > 2) s += "\n";
        s += it.str; y = it.transform[5];
      }
      paginas.push(s.replace(/[  \t]+/g, " "));
    }
    return paginas;
  };

  function compilar(padroes) {
    return padroes.map(p => p instanceof RegExp ? new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g")
      : new RegExp(p.trim().split(/\s+/).join("\\s+"), "gi"));
  }

  window.pesquisarPdfs = async function (cfg) {
    const c = Object.assign({ urls: [], padroes: [], contexto: 300, pausaMs: 500 }, cfg || {});
    if (!c.urls.length || !c.padroes.length) throw new Error("Informe urls e padroes.");
    const regs = compilar(c.padroes), est = lerEstado();
    for (const url of c.urls) {
      if (est.lidos[url]) continue;
      let pags;
      try { pags = await textoDoPdf(url); }
      catch (e) { console.warn("Falha em", url, "-", e.message); est.lidos[url] = "falha: " + e.message; gravarEstado(est); continue; }
      const total = pags.join("").trim().length;
      if (!total) console.warn("Sem texto (só imagem):", url);
      let n = 0;
      pags.forEach((txt, k) => regs.forEach(re => {
        re.lastIndex = 0; let r;
        while ((r = re.exec(txt))) {
          est.achados.push({ arquivo: decodeURIComponent(url.split("/").pop().split("?")[0]), pagina: k + 1, padrao: re.source,
            trecho: txt.slice(Math.max(0, r.index - c.contexto), r.index + r[0].length + c.contexto).replace(/\s+/g, " "), url });
          n++; if (r[0].length === 0) re.lastIndex++;
        }
      }));
      est.lidos[url] = total ? `ok (${pags.length} páginas, ${n} ocorrências)` : "sem texto";
      gravarEstado(est);
      console.log(est.lidos[url], "-", url);
      await espera(c.pausaMs);
    }
    console.log(`Concluído: ${est.achados.length} ocorrências. Use exportarResultadosPdf() para baixar o CSV.`);
    return est.achados.length;
  };

  // Anais da República (www.senado.leg.br): endereços dos livros de um ano, em texto ou digitalizados
  window.listarAnais = async function (ano, maxLivros = 40) {
    const url = (k, dig) => `https://www.senado.leg.br/publicacoes/anais/${dig ? "pdf-digitalizado" : "pdf"}/Anais_Republica/${ano}/${ano}%20Livro%20${k}.pdf`;
    const out = []; let falhas = 0;
    for (let k = 1; k <= maxLivros && falhas < 2; k++) {
      let achou = null;
      for (const dig of [false, true]) {
        try { const r = await fetch(url(k, dig), { method: "HEAD" }); if (r.ok) { achou = url(k, dig); break; } } catch (e) {}
      }
      if (achou) { out.push(achou); falhas = 0; } else falhas++;
    }
    return out;
  };

  // endereços de todos os PDFs com links na página aberta (ex.: lista de verbetes do CPDOC);
  // filtro opcional por texto do link ou do endereço: listarPdfsDaPagina(/^AB/)
  window.listarPdfsDaPagina = function (filtro) {
    const re = filtro ? (filtro instanceof RegExp ? filtro : new RegExp(filtro, "i")) : null;
    return [...new Set([...document.querySelectorAll('a[href*=".pdf"]')]
      .filter(a => !re || re.test(a.textContent) || re.test(decodeURIComponent(a.href)))
      .map(a => a.href))];
  };

  window.exportarResultadosPdf = function (nome = "resultados-pdfs.csv") {
    const est = lerEstado();
    const cols = ["arquivo", "pagina", "padrao", "trecho", "url"];
    const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "﻿" + [cols.join(";")].concat(est.achados.map(o => cols.map(k => esc(o[k])).join(";"))).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = nome; a.click();
    return est.achados.length;
  };
  window.limparProgressoPdf = function () { localStorage.removeItem(CHAVE); return "Progresso apagado."; };

  console.log("Leitor de PDFs carregado. Funções: pesquisarPdfs(cfg), listarAnais(ano), listarPdfsDaPagina(filtro), textoDoPdf(url), exportarResultadosPdf(), limparProgressoPdf().");
})();
