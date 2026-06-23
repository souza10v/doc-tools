/**
 * convert-specs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converte arquivos de especificação para .txt legíveis pelo Claude Code.
 *
 * Formatos suportados por pasta:
 *   specs/      → .docx, .xlsx, .pptx, .pdf
 *   endpoints/  → .docx, .json, .xlsx, .pdf
 *
 * Instalação:
 *   npm install mammoth xlsx pdf-parse
 *
 * Uso: node convert-specs.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ── Verificar dependências ────────────────────────────────────────────────────
function requireOptional(pkg) {
  try { return require(pkg); }
  catch { return null; }
}

const mammoth  = requireOptional("mammoth");
const XLSX     = requireOptional("xlsx");
const pdfParse = requireOptional("pdf-parse");

// ── Conversores por extensão ──────────────────────────────────────────────────

async function converterDocx(filePath) {
  if (!mammoth) throw new Error("mammoth não instalado — rode: npm install mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function converterXlsx(filePath) {
  if (!XLSX) throw new Error("xlsx não instalado — rode: npm install xlsx");
  const wb    = XLSX.readFile(filePath);
  const partes = [];

  wb.SheetNames.forEach(sheetName => {
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    partes.push(`=== Aba: ${sheetName} ===`);

    // Detectar linha de cabeçalho
    const headerRow = rows.find(r => r.some(c => String(c).trim() !== ""));
    if (headerRow) partes.push(headerRow.map(c => String(c).trim()).join(" | "));

    rows.forEach((row, i) => {
      if (i === 0) return; // já adicionamos o header
      const linha = row.map(c => String(c ?? "").trim());
      if (linha.some(c => c !== "")) {
        partes.push(linha.join(" | "));
      }
    });

    partes.push("");
  });

  return partes.join("\n");
}

async function converterPptx(filePath) {
  // python-pptx não está disponível em Node — usamos extração de XML manual
  // O pptx é um zip com slides em XML dentro de ppt/slides/
  const AdmZip = requireOptional("adm-zip");
  if (!AdmZip) {
    // Fallback: avisar e extrair o que der
    return `[PPTX: ${path.basename(filePath)} — instale adm-zip para extração completa: npm install adm-zip]`;
  }

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
    const xml  = slide.getData().toString("utf8");
    // Extrair texto dos elementos <a:t>
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)]
      .map(m => m[1].trim())
      .filter(t => t.length > 0);

    if (texts.length) {
      partes.push(`=== Slide ${i + 1} ===`);
      partes.push(texts.join(" "));
      partes.push("");
    }

    // Notas do apresentador
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
  if (!pdfParse) throw new Error("pdf-parse não instalado — rode: npm install pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const data   = await pdfParse(buffer);

  // Adicionar metadados úteis no início
  const meta = [];
  if (data.info?.Title)   meta.push(`Título: ${data.info.Title}`);
  if (data.info?.Author)  meta.push(`Autor: ${data.info.Author}`);
  if (data.info?.Subject) meta.push(`Assunto: ${data.info.Subject}`);
  if (data.numpages)      meta.push(`Páginas: ${data.numpages}`);

  const header = meta.length ? `=== Metadados ===\n${meta.join("\n")}\n\n=== Conteúdo ===\n` : "";
  return header + data.text;
}

async function converterJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    const obj = JSON.parse(raw);
    return `=== JSON: ${path.basename(filePath)} ===\n` + JSON.stringify(obj, null, 2);
  } catch {
    return raw; // já é texto
  }
}

// ── Mapa de extensão → conversor ──────────────────────────────────────────────
const CONVERSORES = {
  ".docx": converterDocx,
  ".xlsx": converterXlsx,
  ".xlsm": converterXlsx,
  ".pptx": converterPptx,
  ".pdf":  converterPdf,
  ".json": converterJson,
  ".txt":  async (p) => fs.readFileSync(p, "utf8"),
  ".md":   async (p) => fs.readFileSync(p, "utf8"),
};

// ── Processar uma pasta ───────────────────────────────────────────────────────
async function converterPasta(inDir, outDir, label) {
  if (!fs.existsSync(inDir)) {
    fs.mkdirSync(inDir, { recursive: true });
    console.log(`📁  ${label}: pasta criada em ${inDir}`);
    return 0;
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const extsSuportadas = Object.keys(CONVERSORES);
  const files = fs.readdirSync(inDir)
    .filter(f => extsSuportadas.includes(path.extname(f).toLowerCase()));

  if (!files.length) {
    console.log(`⚠️   ${label}: nenhum arquivo suportado em ${inDir}`);
    console.log(`     Formatos aceitos: ${extsSuportadas.join(", ")}`);
    return 0;
  }

  console.log(`\n🔄  ${label}: convertendo ${files.length} arquivo(s)...`);
  let ok = 0;

  for (const file of files) {
    const ext      = path.extname(file).toLowerCase();
    const inPath   = path.join(inDir, file);
    const outName  = file.replace(new RegExp(`\\${ext}$`, "i"), ".txt");
    const outPath  = path.join(outDir, outName);
    const conversor = CONVERSORES[ext];

    try {
      const texto = await conversor(inPath);
      fs.writeFileSync(outPath, texto, "utf8");
      const icone = { ".docx":"📄", ".xlsx":"📊", ".xlsm":"📊", ".pptx":"📽️", ".pdf":"📋", ".json":"🔧", ".txt":"📝", ".md":"📝" }[ext] ?? "📄";
      console.log(`  ✅  ${icone} ${file} → ${outName}`);
      ok++;
    } catch (err) {
      console.error(`  ❌  ${file}: ${err.message}`);
    }
  }

  return ok;
}

// ── Execução ──────────────────────────────────────────────────────────────────
(async () => {
  console.log("\n📂  Iniciando conversão de especificações...");

  const root  = __dirname;
  let total   = 0;

  total += await converterPasta(
    path.join(root, "specs"),
    path.join(root, "specs-txt"),
    "Specs de telas"
  );

  total += await converterPasta(
    path.join(root, "endpoints"),
    path.join(root, "endpoints-txt"),
    "Specs de endpoints"
  );

  console.log(`\n✔   ${total} arquivo(s) convertido(s).`);
  if (total > 0) console.log("    Agora rode /gerar-doc no Claude Code.\n");
  else console.log("    Coloque arquivos nas pastas specs/ ou endpoints/ e rode novamente.\n");
})();
