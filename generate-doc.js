/**
 * generate-doc.js
 * Lê doc-output/_doc-data.json e gera múltiplos .docx
 * Uso: node generate-doc.js
 */
"use strict";

const fs   = require("fs");
const path = require("path");

const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat,
  BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, Header, Footer, PageBreak,
} = require("docx");

const OUT_DIR   = path.join(__dirname, "doc-output");
const DATA_FILE = path.join(OUT_DIR, "_doc-data.json");

if (!fs.existsSync(DATA_FILE)) {
  console.error("❌  doc-output/_doc-data.json não encontrado.");
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

// ── Layout A4 ─────────────────────────────────────────────────────────────────
const PW = 11906, PH = 16838, MARGIN = 1134, CW = PW - MARGIN * 2;

// ── Paleta ────────────────────────────────────────────────────────────────────
const BLUE  = "2E75B6", BLUE2 = "D6E4F0", GRAY = "F4F4F4";
const WHITE = "FFFFFF", DARK  = "1F2D3D", GREEN = "1D9E75";
const AMBER = "856404", RED   = "C0392B", NAVY  = "185FA5";

// ── Cores por método HTTP ─────────────────────────────────────────────────────
const METHOD_COLOR = {
  GET: "1A7A3C", POST: "2E75B6", PUT: "B45309",
  PATCH: "6B21A8", DELETE: "C0392B",
};

// ── Cores por status HTTP ─────────────────────────────────────────────────────
const STATUS_COLOR = (s) => {
  if (s >= 200 && s < 300) return "1A7A3C";
  if (s >= 300 && s < 400) return "2E75B6";
  if (s >= 400 && s < 500) return "B45309";
  return "C0392B";
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const bdr  = (c = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const bdrs = (c) => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) });
const PAD  = { top: 80, bottom: 80, left: 120, right: 120 };

const h1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 },
  children: [new TextRun({ text: t, bold: true, size: 32, font: "Arial", color: BLUE })],
});
const h2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 100 },
  children: [new TextRun({ text: t, bold: true, size: 26, font: "Arial", color: DARK })],
});
const h3 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 },
  children: [new TextRun({ text: t, bold: true, size: 24, font: "Arial" })],
});
const body = (t, opts = {}) => new Paragraph({
  spacing: { after: 100 },
  children: [new TextRun({ text: String(t ?? ""), size: 22, font: "Arial", ...opts })],
});
const code = (t) => new Paragraph({
  spacing: { after: 80 },
  shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
  children: [new TextRun({ text: String(t ?? ""), size: 20, font: "Courier New" })],
});
const spacer  = () => new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } });
const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE2, space: 1 } },
  children: [new TextRun("")], spacing: { after: 200 },
});
const bullet = (t) => new Paragraph({
  numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text: String(t ?? ""), size: 22, font: "Arial" })],
});
const tag = (t, color = AMBER) => new Paragraph({
  spacing: { after: 80 },
  children: [new TextRun({ text: t, size: 20, font: "Arial", color, bold: true, italics: true })],
});

// ── Badge de método HTTP ──────────────────────────────────────────────────────
const methodBadge = (metodo) => new Paragraph({
  spacing: { after: 60 },
  children: [
    new TextRun({
      text: ` ${metodo} `,
      bold: true, size: 20, font: "Arial",
      color: WHITE,
      shading: { fill: METHOD_COLOR[metodo] ?? DARK, type: ShadingType.CLEAR },
    }),
  ],
});

// ── Tabelas ───────────────────────────────────────────────────────────────────
function hdrRow(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((c, i) => new TableCell({
      borders: bdrs(BLUE), width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: PAD,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: c, bold: true, size: 20, font: "Arial", color: WHITE })],
      })],
    })),
  });
}
function dtRow(cols, widths, shade = false, colColors = []) {
  return new TableRow({
    children: cols.map((c, i) => new TableCell({
      borders: bdrs("DDDDDD"),
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shade ? GRAY : WHITE, type: ShadingType.CLEAR },
      margins: PAD,
      children: [new Paragraph({
        children: [new TextRun({
          text: String(c ?? "—"),
          size: 20, font: colColors[i] ? "Courier New" : "Arial",
          color: colColors[i] || DARK,
          bold: !!colColors[i],
        })],
      })],
    })),
  });
}
function mkTable(headers, widths, rows, colColors = []) {
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: widths,
    rows: [hdrRow(headers, widths), ...rows.map((r, i) => dtRow(r, widths, i % 2 === 1, colColors))],
  });
}

// ── Header / Footer ───────────────────────────────────────────────────────────
const NUMBERING = { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] };
const STYLES = {
  default: { document: { run: { font: "Arial", size: 22 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: BLUE }, paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: DARK }, paragraph: { spacing: { before: 260, after: 100 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
  ],
};

const makeHeader = (t) => new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE2, space: 4 } }, children: [new TextRun({ text: t, size: 18, font: "Arial", color: "888888" })] })] });
const makeFooter = (f) => new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE2, space: 4 } }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${f}  ·  Página `, size: 18, font: "Arial", color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial" }), new TextRun({ text: " de ", size: 18, font: "Arial", color: "888888" }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Arial" })] })] });

function capa(titulo, sub, dt) {
  return [
    new Paragraph({ children: [new TextRun("")], spacing: { after: 1600 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: titulo, bold: true, size: 48, font: "Arial", color: BLUE })] }),
    spacer(),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sub, size: 24, font: "Arial", color: "555555" })] }),
    spacer(),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Gerado em ${dt}`, size: 20, font: "Arial", color: "888888" })] }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 600 } }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 1 } }, children: [new TextRun("")] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

async function salvar(filename, titulo, children) {
  const filepath = path.join(OUT_DIR, filename);
  const isNovo = !fs.existsSync(filepath);
  const doc = new Document({ numbering: NUMBERING, styles: STYLES, sections: [{ properties: { page: { size: { width: PW, height: PH }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } }, headers: { default: makeHeader(titulo) }, footers: { default: makeFooter(filename) }, children }] });
  fs.writeFileSync(filepath, await Packer.toBuffer(doc));
  console.log(`  ${isNovo ? "✅ Criado " : "🔄 Atualizado"} ${filename}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÃO DE ENDPOINTS — usada em cada página E no _endpoints.docx
// ══════════════════════════════════════════════════════════════════════════════
function renderEndpoint(ep, idx) {
  const items = [];
  const metodo = ep.metodo ?? "GET";
  const fonte  = ep.fonte === "arquivo" ? "[Fonte: arquivo]" : ep.fonte === "codigo" ? "[Descoberto no código]" : "";

  items.push(h3(`${idx + 1}. ${metodo} ${ep.url ?? "—"}`));
  if (fonte) items.push(body(fonte, { color: "888888", italics: true, size: 18 }));
  if (ep.descricao) items.push(body(ep.descricao));
  items.push(spacer());

  // Request body
  if (ep.request?.campos?.length) {
    items.push(body("Request body:", { bold: true }));
    if (ep.request.contentType) items.push(body(`Content-Type: ${ep.request.contentType}`, { color: "666666", size: 20 }));
    const w = [2200, 1600, 800, CW - 4600];
    items.push(mkTable(
      ["Campo", "Tipo", "Obrigatório", "Descrição"], w,
      ep.request.campos.map(c => [c.campo, c.tipo, c.obrigatorio ? "✓ Sim" : "Não", c.descricao]),
      ["", NAVY, "", ""]
    ));
    items.push(spacer());
  }

  // Responses
  if (ep.responses?.length) {
    items.push(body("Responses:", { bold: true }));
    ep.responses.forEach(r => {
      const cor = STATUS_COLOR(r.status);
      items.push(new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: ` ${r.status} `, bold: true, size: 20, font: "Arial", color: WHITE, shading: { fill: cor, type: ShadingType.CLEAR } }),
          new TextRun({ text: `  ${r.descricao ?? ""}`, size: 20, font: "Arial" }),
        ],
      }));
      if (r.campos?.length) {
        const w = [2200, 1800, CW - 4000];
        items.push(mkTable(
          ["Campo", "Tipo", "Descrição"], w,
          r.campos.map(c => [c.campo, c.tipo, c.descricao]),
          ["", NAVY, ""]
        ));
      }
      items.push(spacer());
    });
  }

  items.push(divider());
  return items;
}

// ── Documento por página ──────────────────────────────────────────────────────
async function gerarPagina(pg) {
  const titulo   = pg.titulo ?? pg.rota ?? "Página";
  const filename = pg.arquivo ?? `${(pg.rota ?? "pagina").replace(/\//g, "-").replace(/^-/, "")}.docx`;
  const isAtualizado = pg.atualizado ?? false;

  // ── Seção 1: Identificação ──────────────────────────────────────────────────
  const secIdentificacao = [
    h1("1. Identificação"),
    mkTable(
      ["Campo", "Valor"],
      [2800, CW - 2800],
      [
        ["Página",               titulo],
        ["Rota(s)",              Array.isArray(pg.rotas) ? pg.rotas.join(", ") : pg.rota ?? "—"],
        ["Módulo Angular",       pg.modulo ?? "—"],
        ["Componente principal", pg.componentePrincipal ?? "—"],
        ["Última atualização",   pg.ultimaAtualizacao ?? data.data],
        ["Status",               isAtualizado ? "🔄 Atualizado nesta execução" : "✅ Documentado"],
      ]
    ),
    spacer(), divider(),
  ];

  // ── Seção 2: Descrição Funcional ────────────────────────────────────────────
  const secDescricao = [
    h1("2. Descrição Funcional"),
    body(pg.descricao ?? "Não identificada — preencher manualmente."),
    ...(pg.fluxo?.length ? [
      spacer(),
      h2("Fluxo da tela"),
      ...pg.fluxo.map((f, i) => new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 22, font: "Arial", color: BLUE }),
          new TextRun({ text: f, size: 22, font: "Arial" }),
        ],
      })),
    ] : []),
    spacer(), divider(),
  ];

  // ── Seção 3: Componentes (tabela resumo + detalhe de cada um) ───────────────
  const secComponentes = [h1("3. Componentes Utilizados")];
  if (pg.componentes?.length) {
    // Tabela resumo
    secComponentes.push(mkTable(
      ["Componente", "Seletor", "Módulo", "Descrição"],
      [2400, 2000, 1800, CW - 6200],
      pg.componentes.map(c => [c.nome, c.seletor ?? "—", c.modulo ?? "—", c.descricao ?? "—"])
    ));
    secComponentes.push(spacer());

    // Detalhe individual de cada componente
    pg.componentes.forEach(c => {
      secComponentes.push(h2(c.nome));
      secComponentes.push(body(`Seletor: ${c.seletor ?? "—"}`, { color: "666666", size: 20 }));
      secComponentes.push(body(`Módulo: ${c.modulo ?? "—"}`, { color: "666666", size: 20 }));
      if (c.descricao) secComponentes.push(body(c.descricao));

      // Inputs
      if (c.inputs?.length) {
        secComponentes.push(h3("@Input()"));
        secComponentes.push(mkTable(
          ["Propriedade", "Tipo", "Descrição"],
          [2400, 2000, CW - 4400],
          c.inputs.map(i => [i.nome, i.tipo ?? "—", i.descricao ?? "—"]),
          ["", NAVY, ""]
        ));
        secComponentes.push(spacer());
      }

      // Outputs
      if (c.outputs?.length) {
        secComponentes.push(h3("@Output()"));
        secComponentes.push(mkTable(
          ["Evento", "Tipo", "Descrição"],
          [2400, 2400, CW - 4800],
          c.outputs.map(o => [o.nome, o.tipo ?? "—", o.descricao ?? "—"]),
          ["", NAVY, ""]
        ));
        secComponentes.push(spacer());
      }

      // Métodos públicos
      if (c.metodos?.length) {
        secComponentes.push(h3("Métodos públicos"));
        secComponentes.push(mkTable(
          ["Método", "Descrição"],
          [3200, CW - 3200],
          c.metodos.map(m => [m.nome, m.descricao ?? "—"])
        ));
        secComponentes.push(spacer());
      }

      // Serviços injetados
      if (c.servicos?.length) {
        secComponentes.push(body("Serviços injetados:", { bold: true }));
        c.servicos.forEach(s => secComponentes.push(bullet(s)));
        secComponentes.push(spacer());
      }
    });
  } else {
    secComponentes.push(body("Nenhum componente mapeado."));
  }
  secComponentes.push(divider());

  // ── Seção 4: Serviços e Endpoints ──────────────────────────────────────────
  const secServicos = [h1("4. Serviços e Integrações com API")];
  if (pg.servicos?.length) {
    pg.servicos.forEach(s => {
      secServicos.push(h2(s.nome));
      if (s.escopo) secServicos.push(body(`Escopo: ${s.escopo}`, { color: "666666", size: 20 }));
      if (s.descricao) secServicos.push(body(s.descricao));
      secServicos.push(spacer());
      if (s.endpoints?.length) {
        s.endpoints.forEach((ep, i) => secServicos.push(...renderEndpoint(ep, i)));
      } else {
        secServicos.push(body("Sem endpoints mapeados."));
      }
    });
  } else {
    secServicos.push(body("Nenhum serviço mapeado."));
  }
  secServicos.push(divider());

  // ── Seção 5: Regras de Negócio ──────────────────────────────────────────────
  const secRegras = [h1("5. Regras de Negócio")];
  if (pg.regrasNegocio?.length) {
    pg.regrasNegocio.forEach((r, i) => {
      secRegras.push(new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: `RN-${String(i + 1).padStart(3, "0")}  `, bold: true, size: 22, font: "Arial", color: BLUE }),
          new TextRun({ text: r, size: 22, font: "Arial" }),
        ],
      }));
    });
  } else {
    secRegras.push(body("Nenhuma regra de negócio identificada."));
  }
  secRegras.push(spacer(), divider());

  // ── Seção 6: Guards e Permissões ────────────────────────────────────────────
  const secGuards = [h1("6. Guards e Permissões")];
  if (pg.guards?.length) {
    secGuards.push(mkTable(
      ["Guard", "Tipo", "Descrição"],
      [2400, 1800, CW - 4200],
      pg.guards.map(g => [g.nome, g.tipo, g.descricao ?? "—"])
    ));
  } else {
    secGuards.push(body("Sem guards aplicados nesta rota."));
  }
  // Resolvers
  if (pg.resolvers?.length) {
    secGuards.push(spacer());
    secGuards.push(h2("Resolvers"));
    secGuards.push(mkTable(
      ["Resolver", "Dado pré-carregado", "Endpoint"],
      [2400, 2800, CW - 5200],
      pg.resolvers.map(r => [r.nome, r.dado ?? "—", r.endpoint ?? "—"])
    ));
  }
  secGuards.push(spacer(), divider());

  // ── Seção 7: Observações Técnicas ───────────────────────────────────────────
  const secObs = [h1("7. Observações Técnicas")];
  if (pg.observacoes?.length) {
    pg.observacoes.forEach(o => secObs.push(bullet(o)));
  } else {
    secObs.push(body("Sem observações técnicas registradas."));
  }
  if (pg.pendentes?.length) {
    secObs.push(spacer(), h2("⚠️ Pendências"));
    pg.pendentes.forEach(p => secObs.push(new Paragraph({
      spacing: { after: 80 },
      shading: { fill: "FFF3CD", type: ShadingType.CLEAR },
      children: [new TextRun({ text: `⚠️  ${p}`, size: 22, font: "Arial", color: AMBER, bold: true })],
    })));
  }
  if (pg.descobertos?.length) {
    secObs.push(spacer(), h2("🔍 Descobertos no código"));
    pg.descobertos.forEach(d => secObs.push(new Paragraph({
      spacing: { after: 80 },
      shading: { fill: "E6F1FB", type: ShadingType.CLEAR },
      children: [new TextRun({ text: `🔍  ${d}`, size: 22, font: "Arial", color: NAVY, bold: true })],
    })));
  }

  // ── Montar documento ────────────────────────────────────────────────────────
  const children = [
    ...capa(`Documentação — ${titulo}`, `Rota: ${pg.rota ?? "—"}  ·  Módulo: ${pg.modulo ?? "—"}`, data.data),
    ...secIdentificacao,
    ...secDescricao,
    ...secComponentes,
    ...secServicos,
    ...secRegras,
    ...secGuards,
    ...secObs,
  ];

  await salvar(filename, `${titulo} — ${pg.rota ?? ""}`, children);
  return { rota: pg.rota, arquivo: filename, titulo, atualizado: isAtualizado };
}

// ── _endpoints.docx ───────────────────────────────────────────────────────────
async function gerarEndpoints() {
  const eps = data.endpointsGlobal ?? [];
  if (!eps.length) return;

  // Agrupar por grupo/tag
  const grupos = {};
  eps.forEach(ep => {
    const g = ep.grupo ?? "Geral";
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(ep);
  });

  const w = [900, 2800, 1600, 1400, CW - 6700];
  const children = [
    ...capa("Endpoints — Contratos de API", data.projeto ?? "Projeto", data.data),

    h1("Resumo de Endpoints"),
    mkTable(
      ["Método", "URL", "Grupo", "Fonte", "Descrição"], w,
      eps.map(ep => [
        ep.metodo, ep.url, ep.grupo ?? "Geral",
        ep.fonte === "arquivo" ? "Arquivo" : "Código",
        ep.descricao,
      ]),
      [METHOD_COLOR[eps[0]?.metodo] ?? DARK, "", "", "", ""]
    ),
    spacer(), divider(),
  ];

  // Detalhe por grupo
  Object.entries(grupos).forEach(([grupo, lista], gi) => {
    children.push(h1(`${gi + 1}. ${grupo}`));
    lista.forEach((ep, i) => children.push(...renderEndpoint(ep, i)));
    children.push(spacer());
  });

  await salvar("_endpoints.docx", "Endpoints — Contratos de API", children);
}

// ── _indice.docx ──────────────────────────────────────────────────────────────
async function gerarIndice(paginas) {
  const w = [2000,2600,2600,1400,1038];
  const children = [
    ...capa("Índice da Documentação", data.projeto ?? "Projeto", data.data),
    h1("Páginas Documentadas"),
    mkTable(["Rota","Arquivo","Título","Atualizado","Status"], w,
      paginas.map(p => [p.rota,"", p.titulo, data.data, p.atualizado ? "🔄 Atualizado" : "✅ Completo"])),
    spacer(), divider(),
    h1("Resumo"),
    body(`Total de páginas: ${paginas.length}`),
    body(`Total de endpoints: ${data.endpointsGlobal?.length ?? 0}`),
    body(`Gerado em: ${data.data}`),
  ];
  await salvar("_indice.docx", "Índice Mestre", children);
}

// ── _regras-negocio.docx ──────────────────────────────────────────────────────
async function gerarRegras(paginas) {
  const children = [...capa("Regras de Negócio", data.projeto ?? "Projeto", data.data)];
  let rn = 1;
  paginas.forEach(pg => {
    if (!pg.regrasNegocio?.length) return;
    children.push(h1(pg.titulo ?? pg.rota));
    children.push(body(`Rota: ${pg.rota ?? "—"}`, { color: "666666", size: 20 }));
    pg.regrasNegocio.forEach(r => children.push(bullet(`RN-${String(rn++).padStart(3,"0")}: ${r}`)));
    children.push(spacer(), divider());
  });
  if (rn === 1) children.push(body("Nenhuma regra identificada ainda."));
  await salvar("_regras-negocio.docx", "Regras de Negócio", children);
}

// ── _ui-componentes.docx ─────────────────────────────────────────────────────
async function gerarUI(paginas) {
  const todos = [];
  paginas.forEach(pg => (pg.componentes ?? []).forEach(c => { if (!todos.find(x => x.nome===c.nome)) todos.push({...c, pagina: pg.titulo ?? pg.rota}); }));
  const w = [2200,1800,1800,1800,CW-7600];
  const children = [
    ...capa("UI — Componentes", data.projeto ?? "Projeto", data.data),
    h1("Todos os Componentes"),
    todos.length ? mkTable(["Componente","Seletor","Módulo","Página","Descrição"], w, todos.map(c=>[c.nome,c.seletor??"—",c.modulo??"—",c.pagina??"—",c.descricao??"—"])) : body("Nenhum componente mapeado."),
    spacer(), divider(),
  ];
  await salvar("_ui-componentes.docx", "UI — Componentes", children);
}

// ── Painel HTML ───────────────────────────────────────────────────────────────
function gerarPainel(controle) {
  const pg  = JSON.stringify(Object.values(controle.paginasDocumentadas ?? {}));
  const fl  = JSON.stringify(controle.fluxoNavegacao ?? []);
  const eps = JSON.stringify(controle.endpointsResumo ?? []);
  const dt  = controle.ultimaExecucao ?? "—";
  const proj= controle.projeto ?? "Projeto";

  const TIPO_COR = {action:"#1D9E75",guard:"#E24B4A",redirect:"#185FA5",link:"#BA7517"};
  const MC = {"GET":"#1A7A3C","POST":"#2E75B6","PUT":"#B45309","PATCH":"#6B21A8","DELETE":"#C0392B"};

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel — ${proj}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--blue:#2E75B6;--green:#1D9E75;--amber:#BA7517;--red:#E24B4A;--navy:#185FA5;--bg:#F7F8FA;--surface:#fff;--border:#E2E4E9;--text:#1F2D3D;--muted:#6B7280;--r:10px;--sh:0 1px 3px rgba(0,0,0,.08)}
@media(prefers-color-scheme:dark){:root{--bg:#131417;--surface:#1E2025;--border:#2E3138;--text:#E8EAF0;--muted:#8B95A5}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--text);font-size:14px}
header{background:var(--surface);border-bottom:1px solid var(--border);padding:.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;position:sticky;top:0;z-index:20}
.hd{display:flex;align-items:center;gap:10px}.logo{width:34px;height:34px;border-radius:8px;background:var(--blue);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px}
.ht{font-size:15px;font-weight:600}.hs{font-size:11px;color:var(--muted)}.badge{font-size:11px;padding:3px 10px;background:color-mix(in srgb,var(--blue) 12%,transparent);color:var(--blue);border-radius:20px;font-weight:500}
.tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin:0 0 1.5rem;padding:0 1.5rem}
.tab{padding:.6rem 1.2rem;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;background:none;border-top:none;border-left:none;border-right:none;transition:all .15s}
.tab:hover{color:var(--text)}.tab.active{color:var(--blue);border-bottom-color:var(--blue)}
.pane{display:none;padding:0 1.5rem 2rem}.pane.active{display:block}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:1.25rem}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.7rem .9rem;box-shadow:var(--sh)}
.sl{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.sv{font-size:22px;font-weight:600}
.c-g{color:var(--green)}.c-a{color:var(--amber)}.c-b{color:var(--navy)}.c-r{color:var(--red)}
.pw{margin-bottom:1.25rem}.pl{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:5px}
.pb{height:7px;background:var(--border);border-radius:20px;overflow:hidden;display:flex}.ps{height:100%;transition:width .4s}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.25rem;align-items:center}
.search{flex:1;min-width:160px;max-width:280px;height:34px;padding:0 10px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--text);font-size:13px;outline:none}
.search:focus{border-color:var(--blue)}
.fb{height:34px;padding:0 12px;border-radius:var(--r);border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s}
.fb:hover{border-color:var(--blue);color:var(--blue)}.fb.active{background:var(--blue);color:#fff;border-color:var(--blue)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.9rem 1rem;box-shadow:var(--sh);position:relative;overflow:hidden;transition:transform .15s}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
.card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.card.completo::after{background:var(--green)}.card.parcial::after{background:var(--amber)}
.card.pendente::after{background:var(--red)}.card.novo::after{background:var(--navy)}
.cb{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;margin-bottom:8px}
.card.completo .cb{background:color-mix(in srgb,var(--green) 15%,transparent);color:var(--green)}
.card.parcial  .cb{background:color-mix(in srgb,var(--amber) 15%,transparent);color:var(--amber)}
.card.pendente .cb{background:color-mix(in srgb,var(--red)   15%,transparent);color:var(--red)}
.card.novo     .cb{background:color-mix(in srgb,var(--navy)  15%,transparent);color:var(--navy)}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
.ct{font-size:13px;font-weight:600;margin-bottom:2px}.cr{font-size:11px;color:var(--muted);font-family:monospace;margin-bottom:7px}
.ctags{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:7px}.tag{font-size:10px;padding:2px 6px;border-radius:20px;border:1px solid var(--border);color:var(--muted)}
.cf{display:flex;align-items:center;gap:5px;padding-top:7px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)}
.ca{display:block;margin-top:5px;font-size:11px;color:var(--blue);text-decoration:none;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.empty{grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border)}
.li{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}.ld{width:8px;height:8px;border-radius:50%;flex-shrink:0}
/* fluxo */
.ftable{width:100%;border-collapse:collapse;font-size:13px}
.ftable th{background:var(--blue);color:#fff;padding:8px 12px;text-align:left;font-weight:500;font-size:12px}
.ftable td{padding:8px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.ftable tr:nth-child(even) td{background:color-mix(in srgb,var(--border) 30%,transparent)}
.rota{font-family:monospace;font-size:12px}.rota.para{color:var(--blue);font-weight:500}
.tbadge{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px}
.t-action{background:color-mix(in srgb,#1D9E75 15%,transparent);color:#1D9E75}
.t-guard{background:color-mix(in srgb,#E24B4A 15%,transparent);color:#E24B4A}
.t-redirect{background:color-mix(in srgb,#185FA5 15%,transparent);color:#185FA5}
.t-link{background:color-mix(in srgb,#BA7517 15%,transparent);color:#BA7517}
/* endpoints */
.mbadge{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;color:#fff;font-family:monospace;min-width:60px;text-align:center}
.ep-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.9rem 1rem;margin-bottom:8px;box-shadow:var(--sh)}
.ep-url{font-family:monospace;font-size:13px;font-weight:500;color:var(--text)}
.ep-desc{font-size:12px;color:var(--muted);margin-top:4px}
.ep-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
.ep-pages{font-size:11px;color:var(--muted);margin-top:6px}
.ep-fonte{font-size:10px;padding:1px 6px;border-radius:20px;border:1px solid var(--border);color:var(--muted)}
.diagrama-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:1rem;margin-top:1.25rem;overflow:auto}
footer{text-align:center;padding:1.5rem 1rem;font-size:12px;color:var(--muted)}
</style>
</head>
<body>
<header>
  <div class="hd"><div class="logo">D</div><div><div class="ht">Painel de Documentação — ${proj}</div><div class="hs">Gerado automaticamente pelo Claude Code</div></div></div>
  <span class="badge">Última execução: ${dt}</span>
</header>
<div class="tabs">
  <button class="tab active" onclick="showTab('paginas',this)">Páginas</button>
  <button class="tab"        onclick="showTab('endpoints',this)">Endpoints</button>
  <button class="tab"        onclick="showTab('fluxo',this)">Fluxo de Navegação</button>
</div>

<!-- PÁGINAS -->
<div class="pane active" id="pane-paginas">
  <div class="stats">
    <div class="stat"><div class="sl">Total</div><div class="sv" id="s-total">0</div></div>
    <div class="stat"><div class="sl">Documentadas</div><div class="sv c-g" id="s-completo">0</div></div>
    <div class="stat"><div class="sl">Parciais</div><div class="sv c-a" id="s-parcial">0</div></div>
    <div class="stat"><div class="sl">Não iniciadas</div><div class="sv c-b" id="s-novo">0</div></div>
    <div class="stat"><div class="sl">Pendentes</div><div class="sv c-r" id="s-pendente">0</div></div>
  </div>
  <div class="pw"><div class="pl"><span>Cobertura</span><span id="pct">0%</span></div>
    <div class="pb"><div class="ps" id="bc" style="background:var(--green);width:0%"></div><div class="ps" id="bp" style="background:var(--amber);width:0%"></div><div class="ps" id="bn" style="background:var(--navy);width:0%"></div><div class="ps" id="bpe" style="background:var(--red);width:0%"></div></div></div>
  <div class="toolbar">
    <input class="search" type="search" id="busca" placeholder="Buscar…" oninput="filtrar()">
    <button class="fb active" data-f="todos"    onclick="sf(this)">Todas</button>
    <button class="fb"        data-f="completo" onclick="sf(this)">Documentadas</button>
    <button class="fb"        data-f="parcial"  onclick="sf(this)">Parciais</button>
    <button class="fb"        data-f="novo"     onclick="sf(this)">Não iniciadas</button>
    <button class="fb"        data-f="pendente" onclick="sf(this)">Pendentes</button>
  </div>
  <div class="grid" id="grid"></div>
  <div class="legend">
    <div class="li"><div class="ld" style="background:var(--green)"></div>Documentada — Claude Code pula</div>
    <div class="li"><div class="ld" style="background:var(--amber)"></div>Parcial — complementa</div>
    <div class="li"><div class="ld" style="background:var(--navy)"></div>Não iniciada — cria</div>
    <div class="li"><div class="ld" style="background:var(--red)"></div>Pendente — aguarda spec</div>
  </div>
</div>

<!-- ENDPOINTS -->
<div class="pane" id="pane-endpoints">
  <div class="stats">
    <div class="stat"><div class="sl">Total</div><div class="sv" id="e-total">0</div></div>
    <div class="stat"><div class="sl">GET</div><div class="sv" style="color:#1A7A3C" id="e-get">0</div></div>
    <div class="stat"><div class="sl">POST</div><div class="sv c-b" id="e-post">0</div></div>
    <div class="stat"><div class="sl">PUT/PATCH</div><div class="sv c-a" id="e-put">0</div></div>
    <div class="stat"><div class="sl">DELETE</div><div class="sv c-r" id="e-delete">0</div></div>
  </div>
  <div class="toolbar">
    <input class="search" type="search" id="ebusca" placeholder="Buscar endpoint…" oninput="filtrarEp()">
    <button class="fb active" data-m="todos"  onclick="sm(this)">Todos</button>
    <button class="fb"        data-m="GET"    onclick="sm(this)">GET</button>
    <button class="fb"        data-m="POST"   onclick="sm(this)">POST</button>
    <button class="fb"        data-m="PUT"    onclick="sm(this)">PUT</button>
    <button class="fb"        data-m="PATCH"  onclick="sm(this)">PATCH</button>
    <button class="fb"        data-m="DELETE" onclick="sm(this)">DELETE</button>
  </div>
  <div id="ep-list"></div>
</div>

<!-- FLUXO -->
<div class="pane" id="pane-fluxo">
  <div class="stats">
    <div class="stat"><div class="sl">Transições</div><div class="sv" id="f-total">0</div></div>
    <div class="stat"><div class="sl">Ações</div><div class="sv c-g" id="f-action">0</div></div>
    <div class="stat"><div class="sl">Guards</div><div class="sv c-r" id="f-guard">0</div></div>
    <div class="stat"><div class="sl">Redirects</div><div class="sv c-b" id="f-redirect">0</div></div>
    <div class="stat"><div class="sl">Links</div><div class="sv c-a" id="f-link">0</div></div>
  </div>
  <div class="toolbar">
    <input class="search" type="search" id="fbusca" placeholder="Filtrar fluxo…" oninput="filtrarFluxo()">
    <button class="fb active" data-t="todos"    onclick="st(this)">Todos</button>
    <button class="fb"        data-t="action"   onclick="st(this)">Ações</button>
    <button class="fb"        data-t="guard"    onclick="st(this)">Guards</button>
    <button class="fb"        data-t="redirect" onclick="st(this)">Redirects</button>
    <button class="fb"        data-t="link"     onclick="st(this)">Links</button>
  </div>
  <div style="overflow-x:auto">
    <table class="ftable"><thead><tr><th>De</th><th>Para</th><th>Condição</th><th>Tipo</th></tr></thead>
    <tbody id="ftbody"></tbody></table>
  </div>
  <div class="diagrama-wrap"><div style="font-size:13px;font-weight:600;margin-bottom:1rem;color:var(--muted)">Diagrama</div><div id="diagrama"></div></div>
  <div class="legend" style="margin-top:1rem">
    <div class="li"><div class="ld" style="background:#1D9E75"></div>Ação</div>
    <div class="li"><div class="ld" style="background:#E24B4A"></div>Guard</div>
    <div class="li"><div class="ld" style="background:#185FA5"></div>Redirect</div>
    <div class="li"><div class="ld" style="background:#BA7517"></div>Link</div>
  </div>
</div>

<footer>Atualizado em ${dt} · doc-output/_controle.json</footer>

<script>
const PAGES=${pg}, FLUXO=${fl}, EPS=${eps};
const MC=${JSON.stringify(MC)};
const LB={completo:"Documentada",parcial:"Parcial",pendente:"Pendente",novo:"Não iniciada"};
const TLB={action:"Ação",guard:"Guard",redirect:"Redirect",link:"Link"};
const TCOR=${JSON.stringify(TIPO_COR)};

let fa="todos", fm="todos", ft="todos";

function showTab(id,btn){document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".pane").forEach(p=>p.classList.remove("active"));btn.classList.add("active");document.getElementById("pane-"+id).classList.add("active");}

/* páginas */
function sf(b){document.querySelectorAll("#pane-paginas .fb").forEach(x=>x.classList.remove("active"));b.classList.add("active");fa=b.dataset.f;filtrar();}
function filtrar(){const q=(document.getElementById("busca").value||"").toLowerCase();const v=PAGES.filter(p=>(fa==="todos"||p.status===fa)&&(!q||(p.titulo||"").toLowerCase().includes(q)||(p.rota||"").toLowerCase().includes(q)));renderGrid(v);}
function renderGrid(pages){const g=document.getElementById("grid");if(!pages.length){g.innerHTML='<div class="empty">Nenhuma página encontrada.</div>';return;}g.innerHTML=pages.map(p=>{const tags=(p.tags||[]).map(t=>'<span class="tag">'+t+'</span>').join("");const fl=p.arquivo?'<a class="ca" href="'+p.arquivo+'">'+p.arquivo+'</a>':'';return'<div class="card '+p.status+'"><span class="cb"><span class="dot"></span>'+LB[p.status]+'</span><div class="ct">'+p.titulo+'</div><div class="cr">'+p.rota+'</div>'+(tags?'<div class="ctags">'+tags+'</div>':'')+fl+'<div class="cf">⏱ '+(p.ultimaAtualizacao||"Sem registro")+'</div></div>';}).join("");}
function atualizarStats(){const c=s=>PAGES.filter(p=>p.status===s).length;const total=PAGES.length||1;const nc=c("completo"),np=c("parcial"),nn=c("novo"),npe=c("pendente");document.getElementById("s-total").textContent=PAGES.length;document.getElementById("s-completo").textContent=nc;document.getElementById("s-parcial").textContent=np;document.getElementById("s-novo").textContent=nn;document.getElementById("s-pendente").textContent=npe;const pct=Math.round(((nc+np*0.5)/total)*100);document.getElementById("pct").textContent=pct+"%";document.getElementById("bc").style.width=(nc/total*100)+"%";document.getElementById("bp").style.width=(np/total*100)+"%";document.getElementById("bn").style.width=(nn/total*100)+"%";document.getElementById("bpe").style.width=(npe/total*100)+"%";}

/* endpoints */
function sm(b){document.querySelectorAll("#pane-endpoints .fb").forEach(x=>x.classList.remove("active"));b.classList.add("active");fm=b.dataset.m;filtrarEp();}
function filtrarEp(){const q=(document.getElementById("ebusca").value||"").toLowerCase();const v=EPS.filter(e=>(fm==="todos"||e.metodo===fm)&&(!q||(e.url||"").toLowerCase().includes(q)||(e.descricao||"").toLowerCase().includes(q)||(e.grupo||"").toLowerCase().includes(q)));renderEps(v);}
function renderEps(items){const el=document.getElementById("ep-list");if(!items.length){el.innerHTML='<div class="empty">Nenhum endpoint encontrado.</div>';return;}el.innerHTML=items.map(e=>{const cor=MC[e.metodo]||"#444";const pages=(e.paginasQueConsomem||[]).join(", ");return'<div class="ep-card"><div class="ep-meta"><span class="mbadge" style="background:'+cor+'">'+e.metodo+'</span><span class="ep-url">'+e.url+'</span><span class="ep-fonte">'+(e.fonte==="arquivo"?"📄 Arquivo":"🔍 Código")+'</span></div><div class="ep-desc">'+e.descricao+'</div>'+(pages?'<div class="ep-pages">Usado em: '+pages+'</div>':'')+'</div>';}).join("");}
function atualizarEpStats(){const c=m=>EPS.filter(e=>e.metodo===m).length;document.getElementById("e-total").textContent=EPS.length;document.getElementById("e-get").textContent=c("GET");document.getElementById("e-post").textContent=c("POST");document.getElementById("e-put").textContent=c("PUT")+c("PATCH");document.getElementById("e-delete").textContent=c("DELETE");}

/* fluxo */
function st(b){document.querySelectorAll("#pane-fluxo .fb").forEach(x=>x.classList.remove("active"));b.classList.add("active");ft=b.dataset.t;filtrarFluxo();}
function filtrarFluxo(){const q=(document.getElementById("fbusca").value||"").toLowerCase();const v=FLUXO.filter(f=>(ft==="todos"||f.tipo===ft)&&(!q||(f.de||"").toLowerCase().includes(q)||(f.para||"").toLowerCase().includes(q)||(f.condicao||"").toLowerCase().includes(q)));renderFluxo(v);}
function renderFluxo(items){const tb=document.getElementById("ftbody");if(!items.length){tb.innerHTML='<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--muted)">Nenhuma transição.</td></tr>';return;}tb.innerHTML=items.map(f=>'<tr><td><span class="rota">'+f.de+'</span></td><td><span class="rota para">→ '+f.para+'</span></td><td>'+f.condicao+'</td><td><span class="tbadge t-'+f.tipo+'">'+(TLB[f.tipo]||f.tipo)+'</span></td></tr>').join("");}
function atualizarFluxoStats(){const c=t=>FLUXO.filter(f=>f.tipo===t).length;document.getElementById("f-total").textContent=FLUXO.length;document.getElementById("f-action").textContent=c("action");document.getElementById("f-guard").textContent=c("guard");document.getElementById("f-redirect").textContent=c("redirect");document.getElementById("f-link").textContent=c("link");}
function gerarDiagrama(){if(!FLUXO.length){document.getElementById("diagrama").innerHTML='<p style="color:var(--muted);font-size:13px">Nenhum fluxo disponível.</p>';return;}const rotas=[...new Set([...FLUXO.map(f=>f.de),...FLUXO.map(f=>f.para)])];const NW=160,NH=40,PX=40,PY=60;const cols=Math.max(1,Math.floor(700/(NW+PX)));const nodes={};rotas.forEach((r,i)=>{const col=i%cols,row=Math.floor(i/cols);nodes[r]={x:PX+col*(NW+PX),y:PY+row*(NH+PY)};});const totalRows=Math.ceil(rotas.length/cols);const svgW=PX+cols*(NW+PX),svgH=PY+totalRows*(NH+PY)+PY;let arrows="";FLUXO.forEach(f=>{const s=nodes[f.de],e=nodes[f.para];if(!s||!e||f.de===f.para)return;const x1=s.x+NW/2,y1=s.y+NH,x2=e.x+NW/2,y2=e.y,cy=(y1+y2)/2;arrows+='<path d="M'+x1+','+y1+' C'+x1+','+cy+' '+x2+','+cy+' '+x2+','+y2+'" fill="none" stroke="'+(TCOR[f.tipo]||"#999")+'" stroke-width="1.5" stroke-opacity=".7" marker-end="url(#a-'+f.tipo+')" />';});let ns="";rotas.forEach(r=>{const n=nodes[r];ns+='<g><rect x="'+n.x+'" y="'+n.y+'" width="'+NW+'" height="'+NH+'" rx="6" fill="var(--surface)" stroke="var(--blue)" stroke-width="1.5"/><text x="'+(n.x+NW/2)+'" y="'+(n.y+NH/2+5)+'" text-anchor="middle" font-size="11" font-family="monospace" fill="var(--text)">'+r+'</text></g>';});const defs=Object.entries(TCOR).map(([t,c])=>'<marker id="a-'+t+'" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="'+c+'"/></marker>').join("");document.getElementById("diagrama").innerHTML='<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;min-width:600px" xmlns="http://www.w3.org/2000/svg"><defs>'+defs+'</defs>'+arrows+ns+'</svg>';}

atualizarStats();filtrar();atualizarEpStats();filtrarEp();atualizarFluxoStats();filtrarFluxo();gerarDiagrama();
</script>
</body></html>`;

  const painelFile = path.join(OUT_DIR, "painel.html");
  fs.writeFileSync(painelFile, html, "utf8");
  console.log("  🗺️  Painel atualizado → doc-output/painel.html");
}

// ══════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
(async () => {
  console.log(`\n📄  Gerando documentação — ${data.data}\n`);

  const paginas = data.paginas ?? [];
  if (!paginas.length) { console.error("❌  Nenhuma página em _doc-data.json → paginas[]"); process.exit(1); }

  const resultados = [];
  for (const pg of paginas) resultados.push(await gerarPagina(pg));

  await gerarArquitetura(data);
  await gerarEndpoints();
  await gerarIndice(resultados);
  await gerarRegras(paginas);
  await gerarUI(paginas);

  // Atualizar controle
  const controleFile = path.join(OUT_DIR, "_controle.json");
  const controleExist = fs.existsSync(controleFile) ? JSON.parse(fs.readFileSync(controleFile,"utf8")) : {};
  const controle = {
    ...controleExist,
    ultimaExecucao: data.data,
    projeto: data.projeto,
    fluxoNavegacao: data.fluxoNavegacao ?? controleExist.fluxoNavegacao ?? [],
    endpointsResumo: (data.endpointsGlobal ?? []).map(ep => ({
      metodo: ep.metodo, url: ep.url, descricao: ep.descricao,
      grupo: ep.grupo, fonte: ep.fonte, paginasQueConsomem: ep.paginasQueConsomem ?? [],
    })),
    paginasDocumentadas: {
      ...(controleExist.paginasDocumentadas ?? {}),
      ...Object.fromEntries(resultados.map(r => [r.rota, {
        arquivo: r.arquivo, ultimaAtualizacao: data.data,
        titulo: r.titulo, rota: r.rota,
        status: "completo", tags: paginas.find(p=>p.rota===r.rota)?.tags ?? [],
      }])),
    },
  };
  fs.writeFileSync(controleFile, JSON.stringify(controle, null, 2), "utf8");

  gerarPainel(controle);

  console.log(`\n✔   Concluído!`);
  console.log(`    📋 _indice.docx  📜 _regras-negocio.docx  🧩 _ui-componentes.docx  🔌 _endpoints.docx`);
  console.log(`    🗺️  painel.html (3 abas: Páginas · Endpoints · Fluxo)`);
  resultados.forEach(r => console.log(`    📄 ${r.arquivo}`));
  console.log();
})();

// ── _arquitetura.docx ─────────────────────────────────────────────────────────
async function gerarArquitetura(data) {
  const interceptors = data.interceptors ?? [];
  const pipes        = data.pipes        ?? [];
  const enums        = data.enums        ?? [];
  const ambientes    = data.ambientes    ?? [];
  const diretivas    = data.diretivas    ?? [];
  const storage      = data.storage      ?? [];
  const state        = data.stateManagement;

  if (!interceptors.length && !pipes.length && !enums.length &&
      !ambientes.length && !diretivas.length && !state && !storage.length) return;

  const children = [
    ...capa("Arquitetura — Transversais", data.projeto ?? "Projeto", data.data),
  ];

  // ── Interceptors ──
  if (interceptors.length) {
    children.push(h1("1. Interceptors HTTP"));
    children.push(body("Interceptors processam todas as requisições HTTP da aplicação de forma centralizada."));
    children.push(spacer());
    const w = [2400, 1400, 2400, CW - 6200];
    children.push(mkTable(
      ["Nome", "Tipo", "Módulo", "Descrição"],
      w,
      interceptors.map(i => [i.nome, i.tipo, i.modulo ?? "—", i.descricao])
    ));
    children.push(spacer());
    interceptors.forEach(i => {
      children.push(h2(i.nome));
      children.push(body(`Tipo: ${i.tipo}`));
      children.push(body(`Módulo: ${i.modulo ?? "—"}`));
      children.push(body(`Descrição: ${i.descricao}`));
      if (i.impacto) children.push(body(`Impacto: ${i.impacto}`, { color: "856404" }));
      children.push(spacer());
    });
    children.push(divider());
  }

  // ── Resolvers globais ──
  if (data.resolversGlobal?.length) {
    children.push(h1("2. Resolvers de Rota"));
    children.push(body("Resolvers pré-carregam dados antes da rota ser ativada."));
    children.push(spacer());
    const w = [2200, 2200, 2000, CW - 6400];
    children.push(mkTable(
      ["Nome", "Dado pré-carregado", "Endpoint", "Rotas"],
      w,
      data.resolversGlobal.map(r => [
        r.nome, r.dado, r.endpoint ?? "—",
        Array.isArray(r.rotas) ? r.rotas.join(", ") : r.rotas ?? "—"
      ])
    ));
    children.push(spacer(), divider());
  }

  // ── Pipes ──
  if (pipes.length) {
    children.push(h1("3. Pipes Customizados"));
    const w = [1800, 1200, 1800, 800, CW - 5600];
    children.push(mkTable(
      ["Nome", "Seletor", "Transformação", "Pure", "Descrição"],
      w,
      pipes.map(p => [p.nome, p.seletor, `${p.input ?? "?"} → ${p.output ?? "?"}`, p.pure ? "✓ Sim" : "Não", p.descricao])
    ));
    children.push(spacer());
    pipes.forEach(p => {
      children.push(h2(p.nome));
      children.push(body(`Seletor: {{ valor | ${p.seletor} }}`, { font: "Courier New" }));
      children.push(body(`Descrição: ${p.descricao}`));
      if (p.usadaEm?.length) {
        children.push(body("Usado em:", { bold: true }));
        p.usadaEm.forEach(u => children.push(bullet(u)));
      }
      children.push(spacer());
    });
    children.push(divider());
  }

  // ── Diretivas ──
  if (diretivas.length) {
    children.push(h1("4. Diretivas Customizadas"));
    const w = [2000, 2000, CW - 4000];
    children.push(mkTable(
      ["Nome", "Seletor", "Descrição"],
      w,
      diretivas.map(d => [d.nome, d.seletor, d.descricao])
    ));
    children.push(spacer());
    diretivas.forEach(d => {
      children.push(h2(d.nome));
      children.push(body(`Seletor: ${d.seletor}`, { font: "Courier New" }));
      children.push(body(`Descrição: ${d.descricao}`));
      if (d.inputs?.length) {
        children.push(body("Inputs:", { bold: true }));
        d.inputs.forEach(i => children.push(bullet(i)));
      }
      if (d.usadaEm?.length) {
        children.push(body("Usada em:", { bold: true }));
        d.usadaEm.forEach(u => children.push(bullet(u)));
      }
      children.push(spacer());
    });
    children.push(divider());
  }

  // ── Enums ──
  if (enums.length) {
    children.push(h1("5. Enums"));
    children.push(body("Valores fixos usados na aplicação para garantir consistência entre frontend e backend."));
    children.push(spacer());
    enums.forEach((en, idx) => {
      children.push(h2(`5.${idx + 1}. ${en.nome}`));
      if (en.descricao) children.push(body(en.descricao));
      if (en.usadoEm?.length) children.push(body(`Usado em: ${en.usadoEm.join(", ")}`, { color: "666666", size: 20 }));
      children.push(spacer());
      if (en.valores?.length) {
        const w = [2400, 2400, CW - 4800];
        children.push(mkTable(
          ["Chave", "Valor", "Descrição"],
          w,
          en.valores.map(v => [v.chave, v.valor, v.descricao])
        ));
      }
      children.push(spacer());
    });
    children.push(divider());
  }

  // ── Ambientes ──
  if (ambientes.length) {
    children.push(h1("6. Variáveis de Ambiente"));
    ambientes.forEach((amb, idx) => {
      children.push(h2(`6.${idx + 1}. ${amb.ambiente} (${amb.arquivo})`));
      const w = [2400, 2400, CW - 4800];
      children.push(mkTable(
        ["Variável", "Valor", "Descrição"],
        w,
        (amb.variaveis ?? []).map(v => [v.chave, v.valor, v.descricao])
      ));
      children.push(spacer());
    });
    children.push(divider());
  }

  // ── State Management ──
  if (state) {
    children.push(h1("7. State Management"));
    children.push(body(`Tipo: ${state.tipo?.toUpperCase() ?? "—"}`, { bold: true }));
    children.push(spacer());

    if (state.actions?.length) {
      children.push(h2("Actions"));
      const w = [2400, 2400, CW - 4800];
      children.push(mkTable(
        ["Action", "Payload", "Descrição"],
        w,
        state.actions.map(a => [a.nome, a.payload ?? "—", a.descricao])
      ));
      children.push(spacer());
    }

    if (state.reducers?.length) {
      children.push(h2("Reducers / State Shape"));
      state.reducers.forEach(r => {
        children.push(body(r.nome, { bold: true }));
        children.push(code(r.state ?? "—"));
        children.push(spacer());
      });
    }

    if (state.effects?.length) {
      children.push(h2("Effects"));
      const w = [2200, 1800, 2200, CW - 6200];
      children.push(mkTable(
        ["Effect", "Escuta action", "Endpoint", "Dispara"],
        w,
        state.effects.map(e => [e.nome, e.action, e.endpoint ?? "—", e.dispara ?? "—"])
      ));
      children.push(spacer());
    }

    if (state.selectors?.length) {
      children.push(h2("Selectors"));
      const w = [2400, 2000, CW - 4400];
      children.push(mkTable(
        ["Selector", "Retorna", "Usado em"],
        w,
        state.selectors.map(s => [
          s.nome, s.retorna ?? "—",
          Array.isArray(s.usadoEm) ? s.usadoEm.join(", ") : s.usadoEm ?? "—"
        ])
      ));
      children.push(spacer());
    }
  }

  // ── Storage ──
  children.push(...secaoStorage(storage));

  await salvar("_arquitetura.docx", "Arquitetura — Transversais", children);
}

// ── Seção storage no _arquitetura.docx ───────────────────────────────────────
function secaoStorage(storage) {
  if (!storage?.length) return [];

  const TIPO_COR  = { sessionStorage: NAVY, localStorage: AMBER, cookie: GREEN };
  const TIPO_FILL = { sessionStorage: "E6F1FB", localStorage: "FAEEDA", cookie: "EAF3DE" };

  const items = [
    h1("8. Storage do Browser"),
    body("Mapeamento de todas as chaves gravadas em sessionStorage, localStorage e cookies pela aplicação."),
    spacer(),
  ];

  // ── Tabela resumo ──
  const w = [1400, 1400, 2000, 1800, 1800, CW - 8400];
  const rows = storage.map(s => [
    s.chave,
    s.tipo,
    s.dado,
    s.gravadoEm ?? "—",
    Array.isArray(s.lidoEm) ? s.lidoEm.join(", ") : s.lidoEm ?? "—",
    s.limpoEm ?? "—",
  ]);

  // Linha colorida por tipo
  const tableRows = [
    hdrRow(["Chave", "Tipo", "Dado", "Gravado em", "Lido em", "Limpo em"], w),
    ...storage.map((s, i) => {
      const corTipo = TIPO_COR[s.tipo]  ?? DARK;
      const fillTipo = TIPO_FILL[s.tipo] ?? GRAY;
      return new TableRow({
        children: [
          // chave
          new TableCell({ borders: bdrs("DDDDDD"), width: { size: w[0], type: WidthType.DXA }, shading: { fill: i%2===1?GRAY:WHITE, type: ShadingType.CLEAR }, margins: PAD,
            children: [new Paragraph({ children: [new TextRun({ text: s.chave, size: 20, font: "Courier New", bold: true })] })] }),
          // tipo badge
          new TableCell({ borders: bdrs("DDDDDD"), width: { size: w[1], type: WidthType.DXA }, shading: { fill: fillTipo, type: ShadingType.CLEAR }, margins: PAD,
            children: [new Paragraph({ children: [new TextRun({ text: s.tipo, size: 20, font: "Arial", color: corTipo, bold: true })] })] }),
          // dado
          new TableCell({ borders: bdrs("DDDDDD"), width: { size: w[2], type: WidthType.DXA }, shading: { fill: i%2===1?GRAY:WHITE, type: ShadingType.CLEAR }, margins: PAD,
            children: [new Paragraph({ children: [new TextRun({ text: s.dado ?? "—", size: 20, font: "Arial" })] })] }),
          // gravado em
          new TableCell({ borders: bdrs("DDDDDD"), width: { size: w[3], type: WidthType.DXA }, shading: { fill: i%2===1?GRAY:WHITE, type: ShadingType.CLEAR }, margins: PAD,
            children: [new Paragraph({ children: [new TextRun({ text: s.gravadoEm ?? "—", size: 18, font: "Courier New" })] })] }),
          // lido em
          new TableCell({ borders: bdrs("DDDDDD"), width: { size: w[4], type: WidthType.DXA }, shading: { fill: i%2===1?GRAY:WHITE, type: ShadingType.CLEAR }, margins: PAD,
            children: [new Paragraph({ children: [new TextRun({ text: Array.isArray(s.lidoEm)?s.lidoEm.join(", "):s.lidoEm??"—", size: 18, font: "Courier New" })] })] }),
          // limpo em
          new TableCell({ borders: bdrs("DDDDDD"), width: { size: w[5], type: WidthType.DXA }, shading: { fill: i%2===1?GRAY:WHITE, type: ShadingType.CLEAR }, margins: PAD,
            children: [new Paragraph({ children: [new TextRun({ text: s.limpoEm ?? "—", size: 18, font: "Courier New" })] })] }),
        ],
      });
    }),
  ];

  items.push(new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: w, rows: tableRows }));
  items.push(spacer());

  // ── Alertas de segurança ──
  const alertas = storage.filter(s => s.observacao && s.observacao.includes("⚠️"));
  if (alertas.length) {
    items.push(h2("⚠️ Atenção — Segurança"));
    alertas.forEach(s => {
      items.push(new Paragraph({
        spacing: { after: 80 },
        shading: { fill: "FFF3CD", type: ShadingType.CLEAR },
        children: [
          new TextRun({ text: `${s.chave} (${s.tipo}): `, bold: true, size: 22, font: "Arial", color: "856404" }),
          new TextRun({ text: s.observacao.replace("⚠️", "").trim(), size: 22, font: "Arial", color: "856404" }),
        ],
      }));
    });
    items.push(spacer());
  }

  // ── Resumo por tipo ──
  items.push(h2("Resumo por tipo"));
  const tipos = ["sessionStorage", "localStorage", "cookie"];
  const resumoW = [2400, 1200, CW - 3600];
  items.push(mkTable(
    ["Tipo", "Quantidade", "Chaves"],
    resumoW,
    tipos.map(t => {
      const filtrado = storage.filter(s => s.tipo === t);
      return [t, String(filtrado.length), filtrado.map(s => s.chave).join(", ") || "—"];
    })
  ));
  items.push(spacer(), divider());

  return items;
}
