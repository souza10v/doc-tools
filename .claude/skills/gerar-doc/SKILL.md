---
name: gerar-doc
description: >
  Lê specs novas em specs/ e código Angular, e adiciona seções incrementais
  ao documento Word existente em doc-output/documentacao-tecnica.docx.
  Use /gerar-doc --reset para reprocessar tudo do zero.
---

# Skill: /gerar-doc

Siga exatamente o fluxo descrito no CLAUDE.md deste projeto.

O CLAUDE.md contém todas as instruções detalhadas de como:
- Detectar specs novas (comparando specs/ com processed.json)
- Converter .docx para texto
- Ler o código Angular correspondente
- Gerar os dados da nova seção
- Executar update-doc.js para adicionar ao documento existente

Não pule etapas. Confirme o resultado ao final.
