/**
 * convert-specs.js
 * Converte arquivos de specs/ e endpoints/ para .txt
 * Suporta: .docx, .xlsx, .pptx, .pdf, .json, .txt, .md
 * Controle de hash: pula arquivos que não mudaram desde a última execução
 *
 * Uso: node convert-specs.js
 */
"use strict";

const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

function requireOptional(pkg) {
  try { return require(pkg); } catch { return null; }
}

const mammoth  = requireOptional("mammoth");
const XLSX     = requireOptional("xlsx");
const pdfParse = requireOptional("pdf-parse");
const AdmZip   = requireOptional("adm-zip");

// ── Calcular hash MD5 de arquivo ──────────────────────────────────────────────
function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(buf).digest("hex");
}

// ── Carregar hashes anteriores ────────────────────────────────────────────────
const HASH_FILE = path.join(__dirname, "doc-output", "_hashes-specs.json");
function carregarHashes() {
  try { return JSON.parse(fs.readFileSync(HASH_FILE, "utf8")); }
  catch { return {}; }
}
function salvarHashes(hashes) {
  const dir = path.dirname(HASH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HASH_FILE, JSON.stringify(hashes, null, 2), "utf8");
}

// ── Conversores ───────────────────────────────────────────────────────────────
async function converterDocx(filePath) {
  if (!mammoth) throw new Error("mammoth não instalado — rode: npm install");
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function converterXlsx(filePath) {
  if (!XLSX) throw new Error("xlsx não instalado — rode: npm install");
  const wb = XLSX.readFile(filePath);
  const partes = [];
  wb.SheetNames.forEach(sheetName => {
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    partes.push(`=== Aba: ${sheetName} ===`);
    rows.forEach((row, i) => {
      const linha = row.map(c => String(c ?? "").trim());
      if (linha.some(c => c !== "")) partes.push(linha.join(" | "));
    });
    partes.push("");
  });
  return partes.join("\n");
}

async function converterPptx(filePath) {
  if (!AdmZip) return `[PPTX: ${path.basename(filePath)} — instale adm-zip: npm install adm-zip]`;
  const zip    = new AdmZip(filePath);
  const slides = zip.getEntries()
    .filter(e => e.entryName.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.entryName.match(/\d+/)?.[0] ?? "0");
      const nb = parseInt(b.entryName.match(/\d+/)?.[0] ?? "0");
      return na - nb;
    });
  const partes = [];
  slides.forEach((slide, i) => {
    const xml   = slide.getData().toString("utf8");
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)]
      .map(m => m[1].trim()).filter(t => t.length > 0);
    if (texts.length) {
      partes.push(`=== Slide ${i + 1} ===`);
      partes.push(texts.join(" "));
      partes.push("");
    }
    const notasMatch = xml.match(/<p:notes[^>]*>([\s\S]*?)<\/p:notes>/);
    if (notasMatch) {
      const notasTexts = [...notasMatch[1].matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)]
        .map(m => m[1].trim()).filter(t => t.length > 0);
      if (notasTexts.length) {
        partes.push(`[Notas do slide ${i + 1}]: ${notasTexts.join(" ")}`);
        partes.push("");
      }
    }
  });
  return partes.length ? partes.join("\n") : `[PPTX: sem texto extraível em ${path.basename(filePath)}]`;
}

async function converterPdf(filePath) {
  if (!pdfParse) throw new Error("pdf-parse não instalado — rode: npm install");
  const data = await pdfParse(fs.readFileSync(filePath));
  const meta = [];
  if (data.info?.Title)   meta.push(`Título: ${data.info.Title}`);
  if (data.info?.Author)  meta.push(`Autor: ${data.info.Author}`);
  if (data.numpages)      meta.push(`Páginas: ${data.numpages}`);
  const header = meta.length ? `=== Metadados ===\n${meta.join("\n")}\n\n=== Conteúdo ===\n` : "";
  return header + data.text;
}

const CONVERSORES = {
  ".docx": converterDocx,
  ".xlsx": converterXlsx,
  ".xlsm": converterXlsx,
  ".pptx": converterPptx,
  ".pdf":  converterPdf,
  ".json": async (p) => {
    const raw = fs.readFileSync(p, "utf8");
    try { return `=== JSON: ${path.basename(p)} ===\n` + JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  },
  ".txt":  async (p) => fs.readFileSync(p, "utf8"),
  ".md":   async (p) => fs.readFileSync(p, "utf8"),
};

// ── Processar uma pasta ───────────────────────────────────────────────────────
async function converterPasta(inDir, outDir, label, hashes) {
  if (!fs.existsSync(inDir)) {
    fs.mkdirSync(inDir, { recursive: true });
    console.log(`📁  ${label}: pasta criada em ${inDir}`);
    return { ok: 0, pulados: 0 };
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const exts  = Object.keys(CONVERSORES);
  const files = fs.readdirSync(inDir).filter(f => exts.includes(path.extname(f).toLowerCase()));

  if (!files.length) {
    console.log(`⚠️   ${label}: nenhum arquivo suportado em ${inDir}`);
    return { ok: 0, pulados: 0 };
  }

  console.log(`\n🔄  ${label}: ${files.length} arquivo(s) encontrado(s)...`);
  let ok = 0, pulados = 0;

  for (const file of files) {
    const ext      = path.extname(file).toLowerCase();
    const inPath   = path.join(inDir, file);
    const outName  = file.replace(new RegExp(`\\${ext}$`, "i"), ".txt");
    const outPath  = path.join(outDir, outName);
    const hashKey  = `${inDir}/${file}`;
    const hashAtual = hashFile(inPath);

    // Pular se hash não mudou e .txt já existe
    if (hashes[hashKey] === hashAtual && fs.existsSync(outPath)) {
      console.log(`  ⏭️   ${file} — sem mudanças, pulando`);
      pulados++;
      continue;
    }

    try {
      const texto = await CONVERSORES[ext](inPath);
      fs.writeFileSync(outPath, texto, "utf8");
      hashes[hashKey] = hashAtual;
      const icone = { ".docx":"📄",".xlsx":"📊",".xlsm":"📊",".pptx":"📽️",".pdf":"📋",".json":"🔧",".txt":"📝",".md":"📝" }[ext] ?? "📄";
      console.log(`  ✅  ${icone} ${file} → ${outName}`);
      ok++;
    } catch (err) {
      console.error(`  ❌  ${file}: ${err.message}`);
    }
  }

  return { ok, pulados };
}

// ── Execução ──────────────────────────────────────────────────────────────────
(async () => {
  console.log("\n📂  Iniciando conversão de especificações...");
  const hashes = carregarHashes();
  const root   = __dirname;
  let totalOk  = 0, totalPulados = 0;

  const r1 = await converterPasta(path.join(root, "specs"),     path.join(root, "specs-txt"),     "Specs de telas",    hashes);
  const r2 = await converterPasta(path.join(root, "endpoints"), path.join(root, "endpoints-txt"), "Specs de endpoints",hashes);

  totalOk     = r1.ok     + r2.ok;
  totalPulados = r1.pulados + r2.pulados;

  salvarHashes(hashes);

  console.log(`\n✔   ${totalOk} arquivo(s) convertido(s), ${totalPulados} pulado(s) sem mudanças.`);
  if (totalOk > 0) console.log("    Agora rode /gerar-doc no Claude Code.\n");
  else if (totalPulados > 0) console.log("    Nenhum arquivo mudou — rode /gerar-doc para verificar o código.\n");
  else console.log("    Coloque arquivos em specs/ ou endpoints/ e rode novamente.\n");
})();
