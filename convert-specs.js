/**
 * convert-specs.js
 * Converte .docx de specs/ e endpoints/ para .txt
 * Uso: node convert-specs.js
 */
"use strict";

const fs      = require("fs");
const path    = require("path");
const mammoth = require("mammoth");

async function converterPasta(inDir, outDir, label) {
  if (!fs.existsSync(inDir)) {
    fs.mkdirSync(inDir, { recursive: true });
    console.log(`📁  ${label}: pasta criada em ${inDir}`);
    return 0;
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(inDir).filter(f => f.toLowerCase().endsWith(".docx"));
  if (!files.length) {
    console.log(`⚠️   ${label}: nenhum .docx encontrado em ${inDir}`);
    return 0;
  }

  console.log(`\n🔄  ${label}: convertendo ${files.length} arquivo(s)...`);
  let ok = 0;
  for (const file of files) {
    const outName = file.replace(/\.docx$/i, ".txt");
    const outPath = path.join(outDir, outName);
    try {
      const result = await mammoth.extractRawText({ path: path.join(inDir, file) });
      fs.writeFileSync(outPath, result.value, "utf8");
      console.log(`  ✅  ${file} → ${outName}`);
      result.messages.forEach(m => console.log(`      ⚠️  ${m.message}`));
      ok++;
    } catch (err) {
      console.error(`  ❌  ${file}: ${err.message}`);
    }
  }
  return ok;
}

(async () => {
  const root = __dirname;
  let total = 0;

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
  console.log(`    Agora rode /gerar-doc no Claude Code.\n`);
})();
