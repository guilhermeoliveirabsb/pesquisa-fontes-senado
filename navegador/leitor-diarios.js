/*
 * Leitor dos Diários do Senado Federal e do Congresso Nacional
 * ------------------------------------------------------------
 * Percorre, mês a mês, as edições do acervo digital (https://legis.senado.leg.br/diarios),
 * extrai o texto dos PDFs e procura expressões (expressões regulares) definidas por você.
 * Cada ocorrência vira uma linha de resultado, com data, edição, páginas e um trecho do texto.
 *
 * COMO USAR
 * 1. Abra https://legis.senado.leg.br/diarios/ver no navegador (Chrome, Edge ou Firefox).
 * 2. Abra o console do navegador (F12 → aba "Console").
 * 3. Cole este arquivo inteiro e tecle Enter. Ele cria a função `pesquisarDiarios`.
 * 4. Chame a função com a sua configuração, por exemplo:
 *
 *      await pesquisarDiarios({
 *        veiculo: 1,              // 1 = Diário do Senado Federal (inclui o antigo DCN Seção II); 2 = Diário do Congresso Nacional
 *        tipoData: 1,             // 1 = data da sessão; 2 = data de publicação
 *        de: "1975-03",           // primeiro mês (AAAA-MM)
 *        ate: "1975-04",          // último mês (AAAA-MM)
 *        padroes: ["tomou posse", "prestou o compromisso"],   // texto ou expressões regulares (sem diferenciar maiúsculas;
 *                                 // em texto simples, as palavras podem estar separadas por quebra de linha)
 *        contexto: 300,           // caracteres antes e depois de cada ocorrência
 *        // maxEdicoes: 3,        // opcional: lê só algumas edições (útil para testar)
 *      });
 *
 * 5. Ao terminar, chame `exportarResultados()` para baixar um arquivo CSV (abre no Excel e no Google Sheets).
 *    O progresso fica guardado no navegador: se a página for recarregada, cole o script de novo e chame
 *    `pesquisarDiarios` com a mesma configuração — as edições já lidas são puladas.
 *
 * CUIDADOS
 * - Os volumes antigos são digitalizados e o texto vem de reconhecimento óptico (OCR), com erros
 *   ("Djalrna" por "Djalma", colunas embaralhadas). Prefira padrões tolerantes e revise os achados.
 * - O Senado limita o número de acessos por minuto. O script faz pausas (opção `pausaMs`) e espera
 *   quando recebe a resposta 429 ("muitas requisições").
 * - O acervo tem lacunas (recessos, edições não digitalizadas). Ausência de resultado não prova
 *   ausência do fato.
 *
 * Licença MIT — veja o arquivo LICENSE do repositório.
 */
(function () {
  "use strict";
  // pdf.js (leitor de PDF da Mozilla). O site do Senado só permite scripts de alguns endereços;
  // o cdn.jsdelivr.net está entre eles. Em outros sites, a segunda opção é tentada.
  const PDFJS_OPCOES = [
    ["https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.min.mjs", "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs"],
    ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs"],
  ];
  const CHAVE = "leitorDiarios.v1";          // onde o progresso fica guardado (localStorage)
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
    catch (e) { console.warn("Não foi possível guardar o progresso (memória do navegador cheia?). Exporte os resultados agora.", e); }
  }

  // busca com novas tentativas e espera quando o servidor pede calma (429)
  async function buscar(url, como = "text", tentativas = 5) {
    for (let i = 0; i < tentativas; i++) {
      const r = await fetch(url, { credentials: "same-origin" });
      if (r.status === 429 || r.status >= 500) { await espera(15000 * (i + 1)); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
      return como === "buffer" ? r.arrayBuffer() : r.text();
    }
    throw new Error(`Sem resposta depois de ${tentativas} tentativas: ${url}`);
  }

  // edições de um mês: [{ cod, dia }]
  async function edicoesDoMes(ano, mes, veiculo, tipoData) {
    const html = await buscar(`/diarios/resources/calendario-html?mes=${mes}&ano=${ano}&veiculo=${veiculo}&tipo=${tipoData}`);
    const doc = new DOMParser().parseFromString(html, "text/html");
    return [...doc.querySelectorAll('a[href*="/diarios/ver/"]')].map(a => ({
      cod: +a.getAttribute("href").split("/").pop(),
      dia: +a.textContent.trim(),
    })).filter(e => e.cod);
  }

  async function quantidadePaginas(cod) {
    const html = await buscar(`/diarios/ver/${cod}`);
    const m = html.match(/"quantidadePaginas"\s*:\s*(\d+)/) || html.match(/"qtdPaginas"\s*:\s*(\d+)/);
    return m ? +m[1] : null;
  }

  // texto de um bloco de páginas (o serviço devolve um PDF só com elas)
  async function textoDasPaginas(cod, ini, fim) {
    const lib = await carregarPdfJs();
    const buf = await buscar(`/diarios/BuscaPaginasDiario?codDiario=${cod}&seqPaginaInicial=${ini}&seqPaginaFinal=${fim}`, "buffer");
    const doc = await lib.getDocument({ data: buf }).promise;
    const paginas = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      let s = "", y = null;
      for (const it of c.items) {                    // quebra de linha quando muda a altura do texto
        if (y !== null && Math.abs(it.transform[5] - y) > 2) s += "\n";
        s += it.str; y = it.transform[5];
      }
      paginas.push(s.replace(/[ \u00a0\t]+/g, " "));   // o OCR deixa vários espaços entre as palavras
    }
    return paginas;
  }

  function compilar(padroes) {
    return padroes.map(p => p instanceof RegExp ? new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g")
      : new RegExp(p.trim().split(/\s+/).join("\\s+"), "gi"));   // texto simples: aceita quebra de linha ou espaços extras entre as palavras
  }

  window.pesquisarDiarios = async function (cfg) {
    const c = Object.assign({ veiculo: 1, tipoData: 1, contexto: 300, bloco: 20, pausaMs: 800, padroes: [], maxEdicoes: Infinity }, cfg || {});
    let nEd = 0;
    if (!c.de || !c.ate || !c.padroes.length) throw new Error("Informe de, ate e padroes.");
    const regs = compilar(c.padroes);
    const est = lerEstado();
    let [a, m] = c.de.split("-").map(Number); const [a2, m2] = c.ate.split("-").map(Number);
    window.__pararLeitor = false;
    while (a < a2 || (a === a2 && m <= m2)) {
      const eds = await edicoesDoMes(a, m, c.veiculo, c.tipoData);
      console.log(`${a}-${String(m).padStart(2, "0")}: ${eds.length} edições`);
      for (const ed of eds) {
        if (window.__pararLeitor) { console.log("Interrompido. Chame pesquisarDiarios de novo para continuar."); gravarEstado(est); return est.achados.length; }
        const chave = `${c.veiculo}:${ed.cod}`;
        if (est.lidos[chave]) continue;
        if (nEd++ >= c.maxEdicoes) { console.log(`Limite de ${c.maxEdicoes} edições atingido.`); gravarEstado(est); return est.achados.length; }
        const total = await quantidadePaginas(ed.cod);
        if (!total) { est.lidos[chave] = "sem páginas"; continue; }
        for (let ini = 1; ini <= total; ini += c.bloco) {
          const fim = Math.min(total, ini + c.bloco - 1);
          let pags;
          try { pags = await textoDasPaginas(ed.cod, ini, fim); }
          catch (e) { console.warn(`Falha na edição ${ed.cod}, páginas ${ini}-${fim}:`, e.message); continue; }
          pags.forEach((txt, k) => {
            regs.forEach(re => {
              re.lastIndex = 0; let r;
              while ((r = re.exec(txt))) {
                est.achados.push({
                  veiculo: c.veiculo === 1 ? "DSF" : "DCN",
                  data: `${String(ed.dia).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`,
                  tipoData: c.tipoData === 1 ? "sessão" : "publicação",
                  edicao: ed.cod, pagina: ini + k, padrao: re.source,
                  trecho: txt.slice(Math.max(0, r.index - c.contexto), r.index + r[0].length + c.contexto).replace(/\s+/g, " "),
                  link: `https://legis.senado.leg.br/diarios/ver/${ed.cod}`,
                });
                if (r[0].length === 0) re.lastIndex++;
              }
            });
          });
          await espera(c.pausaMs);
        }
        est.lidos[chave] = "ok"; gravarEstado(est);
      }
      m++; if (m > 12) { m = 1; a++; }
    }
    gravarEstado(est);
    console.log(`Concluído: ${est.achados.length} ocorrências. Use exportarResultados() para baixar o CSV.`);
    return est.achados.length;
  };

  window.pararPesquisa = () => { window.__pararLeitor = true; };

  window.exportarResultados = function (nome = "resultados-diarios.csv") {
    const est = lerEstado();
    const cols = ["veiculo", "data", "tipoData", "edicao", "pagina", "padrao", "trecho", "link"];
    const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "﻿" + [cols.join(";")].concat(est.achados.map(o => cols.map(k => esc(o[k])).join(";"))).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = nome; a.click();
    return est.achados.length;
  };

  window.limparProgresso = function () { localStorage.removeItem(CHAVE); return "Progresso apagado."; };

  console.log("Leitor dos Diários carregado. Funções: pesquisarDiarios(cfg), pararPesquisa(), exportarResultados(), limparProgresso().");
})();
