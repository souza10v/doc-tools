/**
 * generate-painel.js
 * Lê doc-output/_controle.json e gera doc-output/painel.html
 * com duas abas: Páginas e Fluxo de Navegação
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const OUT_DIR     = path.join(__dirname, "doc-output");
const CONTROLE    = path.join(OUT_DIR, "_controle.json");
const PAINEL_FILE = path.join(OUT_DIR, "painel.html");

if (!fs.existsSync(CONTROLE)) {
  console.error("❌  doc-output/_controle.json não encontrado.");
  process.exit(1);
}

const controle   = JSON.parse(fs.readFileSync(CONTROLE, "utf8"));
const paginas    = Object.values(controle.paginasDocumentadas ?? {});
const fluxo      = controle.fluxoNavegacao ?? [];
const projeto    = controle.projeto ?? "Projeto";
const dataExec   = controle.ultimaExecucao ?? "—";

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel — ${projeto}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --blue:#2E75B6;--green:#1D9E75;--amber:#BA7517;--red:#E24B4A;--navy:#185FA5;
  --bg:#F7F8FA;--surface:#fff;--border:#E2E4E9;--text:#1F2D3D;--muted:#6B7280;
  --r:10px;--sh:0 1px 3px rgba(0,0,0,.08);
}
@media(prefers-color-scheme:dark){:root{--bg:#131417;--surface:#1E2025;--border:#2E3138;--text:#E8EAF0;--muted:#8B95A5}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--text);font-size:14px}
header{background:var(--surface);border-bottom:1px solid var(--border);padding:.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;position:sticky;top:0;z-index:20}
.hd{display:flex;align-items:center;gap:10px}
.logo{width:34px;height:34px;border-radius:8px;background:var(--blue);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;flex-shrink:0}
.ht{font-size:15px;font-weight:600}.hs{font-size:11px;color:var(--muted)}
.badge{font-size:11px;padding:3px 10px;background:color-mix(in srgb,var(--blue) 12%,transparent);color:var(--blue);border-radius:20px;font-weight:500}

/* abas */
.tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin:0 0 1.5rem;padding:0 1.5rem}
.tab{padding:.6rem 1.2rem;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;background:none;border-top:none;border-left:none;border-right:none}
.tab:hover{color:var(--text)}
.tab.active{color:var(--blue);border-bottom-color:var(--blue)}
.pane{display:none;padding:0 1.5rem 2rem}.pane.active{display:block}

/* stats */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:1.25rem}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.8rem 1rem;box-shadow:var(--sh)}
.sl{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
.sv{font-size:24px;font-weight:600}
.c-g{color:var(--green)}.c-a{color:var(--amber)}.c-b{color:var(--navy)}.c-r{color:var(--red)}

/* progresso */
.pw{margin-bottom:1.25rem}
.pl{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:5px}
.pb{height:7px;background:var(--border);border-radius:20px;overflow:hidden;display:flex}
.ps{height:100%;transition:width .4s}

/* toolbar */
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.25rem;align-items:center}
.search{flex:1;min-width:160px;max-width:300px;height:34px;padding:0 10px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--text);font-size:13px;outline:none}
.search:focus{border-color:var(--blue)}
.fb{height:34px;padding:0 12px;border-radius:var(--r);border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s}
.fb:hover{border-color:var(--blue);color:var(--blue)}
.fb.active{background:var(--blue);color:#fff;border-color:var(--blue)}

/* grid cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.9rem 1rem;box-shadow:var(--sh);position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s}
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
.ct{font-size:13px;font-weight:600;margin-bottom:2px}
.cr{font-size:11px;color:var(--muted);font-family:monospace;margin-bottom:7px}
.ctags{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:7px}
.tag{font-size:10px;padding:2px 6px;border-radius:20px;border:1px solid var(--border);color:var(--muted);background:var(--bg)}
.cf{display:flex;align-items:center;gap:5px;padding-top:7px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)}
.ca{display:block;margin-top:5px;font-size:11px;color:var(--blue);text-decoration:none;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca:hover{text-decoration:underline}
.empty{grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)}

/* legenda */
.legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border)}
.li{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.ld{width:8px;height:8px;border-radius:50%;flex-shrink:0}

/* ── FLUXO ── */
.fluxo-wrap{overflow-x:auto}
.fluxo-svg{min-width:700px;width:100%}

/* tabela fluxo */
.ftable{width:100%;border-collapse:collapse;font-size:13px}
.ftable th{background:var(--blue);color:#fff;padding:8px 12px;text-align:left;font-weight:500;font-size:12px}
.ftable td{padding:8px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.ftable tr:nth-child(even) td{background:color-mix(in srgb,var(--border) 30%,transparent)}
.ftable tr:hover td{background:color-mix(in srgb,var(--blue) 6%,transparent)}
.rota{font-family:monospace;font-size:12px}
.rota.de{color:var(--text)}.rota.para{color:var(--blue);font-weight:500}
.tipo-badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px}
.tipo-action  {background:color-mix(in srgb,var(--green) 15%,transparent);color:var(--green)}
.tipo-guard   {background:color-mix(in srgb,var(--red)   15%,transparent);color:var(--red)}
.tipo-redirect{background:color-mix(in srgb,var(--navy)  15%,transparent);color:var(--navy)}
.tipo-link    {background:color-mix(in srgb,var(--amber) 15%,transparent);color:var(--amber)}

.fluxo-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:1.25rem}
.fstat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.7rem .9rem}
.fsl{font-size:11px;color:var(--muted);margin-bottom:3px}
.fsv{font-size:20px;font-weight:600}

/* diagrama SVG */
.diagrama-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:1rem;margin-top:1.25rem;overflow:auto}
.diagrama-title{font-size:13px;font-weight:600;margin-bottom:1rem;color:var(--muted)}

footer{text-align:center;padding:1.5rem 1rem;font-size:12px;color:var(--muted)}
</style>
</head>
<body>

<header>
  <div class="hd">
    <div class="logo">D</div>
    <div><div class="ht">Painel de Documentação — ${projeto}</div><div class="hs">Gerado automaticamente pelo Claude Code</div></div>
  </div>
  <span class="badge">Última execução: ${dataExec}</span>
</header>

<div class="tabs">
  <button class="tab active" onclick="showTab('paginas',this)">Páginas</button>
  <button class="tab"        onclick="showTab('fluxo',this)">Fluxo de Navegação</button>
</div>

<!-- ═══════════════════════════ ABA PÁGINAS ════════════════════════════ -->
<div class="pane active" id="pane-paginas">

  <div class="stats">
    <div class="stat"><div class="sl">Total</div><div class="sv" id="s-total">0</div></div>
    <div class="stat"><div class="sl">Documentadas</div><div class="sv c-g" id="s-completo">0</div></div>
    <div class="stat"><div class="sl">Parciais</div><div class="sv c-a" id="s-parcial">0</div></div>
    <div class="stat"><div class="sl">Não iniciadas</div><div class="sv c-b" id="s-novo">0</div></div>
    <div class="stat"><div class="sl">Pendentes</div><div class="sv c-r" id="s-pendente">0</div></div>
  </div>

  <div class="pw">
    <div class="pl"><span>Cobertura</span><span id="pct">0%</span></div>
    <div class="pb">
      <div class="ps" id="bc"  style="background:var(--green);width:0%"></div>
      <div class="ps" id="bp"  style="background:var(--amber);width:0%"></div>
      <div class="ps" id="bn"  style="background:var(--navy);width:0%"></div>
      <div class="ps" id="bpe" style="background:var(--red);width:0%"></div>
    </div>
  </div>

  <div class="toolbar">
    <input class="search" type="search" id="busca" placeholder="Buscar página ou rota…" oninput="filtrar()">
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

<!-- ═══════════════════════════ ABA FLUXO ═════════════════════════════ -->
<div class="pane" id="pane-fluxo">

  <div class="fluxo-stats">
    <div class="fstat"><div class="fsl">Transições</div><div class="fsv" id="f-total">0</div></div>
    <div class="fstat"><div class="fsl">Por ação</div><div class="fsv c-g" id="f-action">0</div></div>
    <div class="fstat"><div class="fsl">Por guard</div><div class="fsv c-r" id="f-guard">0</div></div>
    <div class="fstat"><div class="fsl">Redirects</div><div class="fsv c-b" id="f-redirect">0</div></div>
    <div class="fstat"><div class="fsl">Links diretos</div><div class="fsv c-a" id="f-link">0</div></div>
  </div>

  <div class="toolbar">
    <input class="search" type="search" id="fbusca" placeholder="Filtrar por rota ou condição…" oninput="filtrarFluxo()">
    <button class="fb active" data-t="todos"    onclick="st(this)">Todos</button>
    <button class="fb"        data-t="action"   onclick="st(this)">Ações</button>
    <button class="fb"        data-t="guard"    onclick="st(this)">Guards</button>
    <button class="fb"        data-t="redirect" onclick="st(this)">Redirects</button>
    <button class="fb"        data-t="link"     onclick="st(this)">Links</button>
  </div>

  <div class="fluxo-wrap">
    <table class="ftable" id="ftable">
      <thead>
        <tr>
          <th style="width:22%">De</th>
          <th style="width:22%">Para</th>
          <th>Condição</th>
          <th style="width:10%">Tipo</th>
        </tr>
      </thead>
      <tbody id="ftbody"></tbody>
    </table>
  </div>

  <div class="diagrama-wrap">
    <div class="diagrama-title">Diagrama de fluxo</div>
    <div id="diagrama" style="overflow-x:auto"></div>
  </div>

  <div class="legend" style="margin-top:1rem">
    <div class="li"><div class="ld" style="background:var(--green)"></div>Ação do usuário</div>
    <div class="li"><div class="ld" style="background:var(--red)"></div>Guard / bloqueio</div>
    <div class="li"><div class="ld" style="background:var(--navy)"></div>Redirect automático</div>
    <div class="li"><div class="ld" style="background:var(--amber)"></div>Link direto</div>
  </div>
</div>

<footer>Atualizado em ${dataExec} · doc-output/_controle.json</footer>

<script>
const PAGES = ${JSON.stringify(paginas)};
const FLUXO = ${JSON.stringify(fluxo)};

const LB = {completo:"Documentada",parcial:"Parcial",pendente:"Pendente",novo:"Não iniciada"};
const TIPO_CLS = {action:"tipo-action",guard:"tipo-guard",redirect:"tipo-redirect",link:"tipo-link"};
const TIPO_LB  = {action:"Ação",guard:"Guard",redirect:"Redirect",link:"Link"};
const TIPO_COR = {action:"#1D9E75",guard:"#E24B4A",redirect:"#185FA5",link:"#BA7517"};

let filtroAtual = "todos";
let filtroTipo  = "todos";

/* ── abas ── */
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".pane").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("pane-"+id).classList.add("active");
}

/* ── aba páginas ── */
function sf(b) {
  document.querySelectorAll("#pane-paginas .fb").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); filtroAtual = b.dataset.f; filtrar();
}
function filtrar() {
  const q = (document.getElementById("busca").value||"").toLowerCase();
  const v = PAGES.filter(p => {
    const mf = filtroAtual==="todos" || p.status===filtroAtual;
    const mb = !q || (p.titulo||"").toLowerCase().includes(q) || (p.rota||"").toLowerCase().includes(q);
    return mf && mb;
  });
  renderGrid(v);
}
function renderGrid(pages) {
  const g = document.getElementById("grid");
  if (!pages.length) { g.innerHTML='<div class="empty">Nenhuma página encontrada.</div>'; return; }
  g.innerHTML = pages.map(p => {
    const tags = (p.tags||[]).map(t=>'<span class="tag">'+t+'</span>').join("");
    const ft   = p.ultimaAtualizacao ? '⏱ '+p.ultimaAtualizacao : '⏱ Sem registro';
    const fl   = p.arquivo ? '<a class="ca" href="'+p.arquivo+'">'+p.arquivo+'</a>' : '';
    return '<div class="card '+p.status+'"><span class="cb"><span class="dot"></span>'+LB[p.status]+'</span>'
      +'<div class="ct">'+p.titulo+'</div><div class="cr">'+p.rota+'</div>'
      +(tags?'<div class="ctags">'+tags+'</div>':'')+fl
      +'<div class="cf">'+ft+'</div></div>';
  }).join("");
}
function atualizarStats() {
  const c = s => PAGES.filter(p => p.status===s).length;
  const total = PAGES.length || 1;
  const nc=c("completo"),np=c("parcial"),nn=c("novo"),npe=c("pendente");
  document.getElementById("s-total").textContent    = PAGES.length;
  document.getElementById("s-completo").textContent = nc;
  document.getElementById("s-parcial").textContent  = np;
  document.getElementById("s-novo").textContent     = nn;
  document.getElementById("s-pendente").textContent = npe;
  const pct = Math.round(((nc + np*0.5)/total)*100);
  document.getElementById("pct").textContent        = pct+"%";
  document.getElementById("bc").style.width         = (nc/total*100)+"%";
  document.getElementById("bp").style.width         = (np/total*100)+"%";
  document.getElementById("bn").style.width         = (nn/total*100)+"%";
  document.getElementById("bpe").style.width        = (npe/total*100)+"%";
}

/* ── aba fluxo ── */
function st(b) {
  document.querySelectorAll("#pane-fluxo .fb").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); filtroTipo = b.dataset.t; filtrarFluxo();
}
function filtrarFluxo() {
  const q = (document.getElementById("fbusca").value||"").toLowerCase();
  const v = FLUXO.filter(f => {
    const mt = filtroTipo==="todos" || f.tipo===filtroTipo;
    const mb = !q || (f.de||"").toLowerCase().includes(q)
                  || (f.para||"").toLowerCase().includes(q)
                  || (f.condicao||"").toLowerCase().includes(q);
    return mt && mb;
  });
  renderFluxo(v);
}
function renderFluxo(items) {
  const tb = document.getElementById("ftbody");
  if (!items.length) {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--muted)">Nenhuma transição encontrada.</td></tr>';
    return;
  }
  tb.innerHTML = items.map(f => {
    const cls  = TIPO_CLS[f.tipo]  || "tipo-action";
    const label= TIPO_LB[f.tipo]   || f.tipo;
    return '<tr>'
      +'<td><span class="rota de">'+f.de+'</span></td>'
      +'<td><span class="rota para">→ '+f.para+'</span></td>'
      +'<td>'+f.condicao+'</td>'
      +'<td><span class="tipo-badge '+cls+'">'+label+'</span></td>'
      +'</tr>';
  }).join("");
}
function atualizarFluxoStats() {
  const c = t => FLUXO.filter(f => f.tipo===t).length;
  document.getElementById("f-total").textContent    = FLUXO.length;
  document.getElementById("f-action").textContent   = c("action");
  document.getElementById("f-guard").textContent    = c("guard");
  document.getElementById("f-redirect").textContent = c("redirect");
  document.getElementById("f-link").textContent     = c("link");
}

/* ── diagrama SVG ── */
function gerarDiagrama() {
  if (!FLUXO.length) {
    document.getElementById("diagrama").innerHTML = '<p style="color:var(--muted);font-size:13px">Nenhum fluxo disponível ainda. Rode /gerar-doc para extrair do router Angular.</p>';
    return;
  }

  const rotas   = [...new Set([...FLUXO.map(f=>f.de), ...FLUXO.map(f=>f.para)])];
  const NODE_W  = 160, NODE_H = 40, PAD_X = 40, PAD_Y = 60;
  const cols    = Math.max(1, Math.floor(700 / (NODE_W + PAD_X)));
  const nodes   = {};

  rotas.forEach((r, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes[r] = {
      x: PAD_X + col * (NODE_W + PAD_X),
      y: PAD_Y + row * (NODE_H + PAD_Y),
      label: r,
    };
  });

  const totalRows = Math.ceil(rotas.length / cols);
  const svgW = PAD_X + cols * (NODE_W + PAD_X);
  const svgH = PAD_Y + totalRows * (NODE_H + PAD_Y) + PAD_Y;

  let arrows = "";
  FLUXO.forEach(f => {
    const s = nodes[f.de]; const e = nodes[f.para];
    if (!s || !e || f.de === f.para) return;
    const x1 = s.x + NODE_W/2, y1 = s.y + NODE_H;
    const x2 = e.x + NODE_W/2, y2 = e.y;
    const cy  = (y1 + y2) / 2;
    const cor = TIPO_COR[f.tipo] || TIPO_COR.action;
    arrows += '<path d="M'+x1+','+y1+' C'+x1+','+cy+' '+x2+','+cy+' '+x2+','+y2+'"'
      +' fill="none" stroke="'+cor+'" stroke-width="1.5" stroke-opacity="0.7"'
      +' marker-end="url(#arr-'+f.tipo+')" />'
      +'<title>'+f.de+' → '+f.para+': '+f.condicao+'</title>';
  });

  let nodesSvg = "";
  rotas.forEach(r => {
    const n = nodes[r];
    nodesSvg += '<g>'
      +'<rect x="'+n.x+'" y="'+n.y+'" width="'+NODE_W+'" height="'+NODE_H
      +'" rx="6" fill="var(--surface)" stroke="var(--blue)" stroke-width="1.5"/>'
      +'<text x="'+(n.x+NODE_W/2)+'" y="'+(n.y+NODE_H/2+5)
      +'" text-anchor="middle" font-size="11" font-family="monospace" fill="var(--text)">'
      +r.replace(/</g,"&lt;")+'</text></g>';
  });

  const defs = ['action','guard','redirect','link'].map(t =>
    '<marker id="arr-'+t+'" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">'
    +'<path d="M0,0 L0,6 L8,3 z" fill="'+TIPO_COR[t]+'" /></marker>'
  ).join("");

  document.getElementById("diagrama").innerHTML =
    '<svg viewBox="0 0 '+svgW+' '+svgH+'" style="width:100%;min-width:600px" xmlns="http://www.w3.org/2000/svg">'
    +'<defs>'+defs+'</defs>'
    +arrows+nodesSvg+'</svg>';
}

/* ── init ── */
atualizarStats();
filtrar();
atualizarFluxoStats();
filtrarFluxo();
gerarDiagrama();
</script>
</body>
</html>`;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(PAINEL_FILE, html, "utf8");
console.log("  🗺️  Painel atualizado → doc-output/painel.html");
