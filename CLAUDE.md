# Sistema de Documentação Técnica Angular

## Configuração
Leia `config.json` para obter:
- `projeto` — nome do projeto
- `caminhoSrc` — caminho absoluto para a pasta `src` do projeto Angular
- `stack` — stack utilizada

---

## Como funciona

Você recebe arquivos de especificação (Word, Excel, PowerPoint, PDF) e código Angular.
Sua tarefa é **entender o que cada arquivo descreve, cruzar com o código, e gerar um documento por página do frontend**.

O resultado final é:
- Um `.docx` por página (`cotacao-inicio.docx`, `login.docx`, etc.)
- Documentos globais (`_regras-negocio.docx`, `_endpoints.docx`, etc.)
- Um painel visual (`painel.html`)

---

## Quando receber /gerar-doc

### ETAPA 0 — Ler o controle

Leia `doc-output/_controle.json` se existir.

- **completo** → PULAR completamente
- **parcial** → ler arquivo existente e complementar
- **pendente** → registrar e avisar
- **novo** → criar do zero

---

### ETAPA 1 — Converter os arquivos de entrada

```
node convert-specs.js
```

Isso converte todos os arquivos de `specs/` e `endpoints/` para `.txt` nas pastas `specs-txt/` e `endpoints-txt/`.

Formatos suportados: `.docx`, `.xlsx`, `.pptx`, `.pdf`, `.json`, `.txt`, `.md`

---

### ETAPA 2 — Ler e interpretar as specs

Leia cada arquivo em `specs-txt/` e faça o seguinte:

#### 2a. Identificar a qual página cada arquivo pertence

Procure no conteúdo do arquivo por:
- Nome de tela, funcionalidade ou módulo mencionado
- Rotas Angular escritas no texto (`/cotacao/inicio`, `cotacao-inicio`, `tela de cotação`)
- Títulos de seção, abas de planilha ou slides que indiquem o nome da tela

**Se o arquivo trata de uma tela específica** → associe ao documento daquela página.
**Se o arquivo trata de múltiplas telas** → distribua cada seção/aba/slide para a página correspondente.
**Se não conseguir identificar a tela** → coloque em `_pendencias` para revisar manualmente.

#### 2b. Extrair por categoria — independente do formato

Não importa se é Excel, Word, PDF ou PowerPoint. O que importa é o **conteúdo**. Extraia:

**Regras de negócio** — qualquer frase que descreva uma restrição, validação, condição ou comportamento obrigatório. Exemplos que indicam regra de negócio:
- "deve", "não pode", "é obrigatório", "somente se", "mínimo", "máximo"
- Células de planilha com coluna "Regra" ou "Validação"
- Slides com título "Regras" ou "Critérios"
- Textos como "RN-001:", "Regra 1:", "Validação:"

**Fluxo da tela** — sequência de passos que o usuário segue. Exemplos:
- Listas numeradas em Word ou PowerPoint
- Coluna "Passo" ou "Etapa" em planilha
- Setas e sequências em slides
- Textos como "primeiro o usuário faz X, depois Y"

**Endpoints e integrações** — qualquer menção a API, serviço, endpoint, requisição. Exemplos:
- URLs como `/api/cotacao/iniciar`
- Métodos HTTP: GET, POST, PUT, PATCH, DELETE
- Colunas "Endpoint", "Serviço", "API" em planilhas
- Campos de request e response descritos

**Campos e entidades** — dados que a tela manipula. Exemplos:
- Tabelas com colunas "Campo", "Tipo", "Obrigatório"
- Listas de campos de formulário
- Descrições de modelos de dados

**Componentes e UI** — elementos visuais descritos. Exemplos:
- "botão", "dropdown", "modal", "tabela", "formulário"
- Wireframes descritos em texto
- Capturas de tela com legenda

**Glossário** — termos de negócio específicos do domínio.

---

### ETAPA 3 — Ler o código Angular

Use o caminho do `config.json`. Leia apenas o necessário para as páginas que serão criadas ou atualizadas.

#### Arquivos a ler

```
src/app/app-routing.module.ts          ← rotas e lazy loading
src/app/**/*-routing.module.ts         ← rotas de cada módulo
src/app/**/*.module.ts                 ← declarações e imports
src/app/**/*.component.ts              ← lógica dos componentes
src/app/**/*.component.html            ← templates e UI
src/app/**/*.service.ts                ← serviços e chamadas HTTP
src/app/**/*.guard.ts                  ← guards de rota
src/app/**/*.resolver.ts               ← resolvers
src/app/**/*.interceptor.ts            ← interceptors HTTP
src/app/**/*.pipe.ts                   ← pipes customizados
src/app/**/*.directive.ts              ← diretivas customizadas
src/app/**/*.model.ts                  ← modelos de dados
src/app/**/*.interface.ts              ← interfaces TypeScript
src/app/**/*.enum.ts                   ← enums
src/environments/environment*.ts       ← variáveis de ambiente
```

#### O que extrair de cada tipo de arquivo

**`*.component.ts`**:
- `@Input()` e `@Output()` declarados
- Serviços injetados no construtor
- Métodos públicos relevantes
- Chamadas a `router.navigate()` (fluxo de navegação)

**`*.component.html`**:
- `[routerLink]` (links entre telas)
- Componentes filho usados (`<app-nome>`)
- Formulários e campos de input

**`*.service.ts`**:
- `this.http.get/post/put/patch/delete(...)` → extrair método, URL e tipo de retorno
- URLs usando `environment.apiUrl` → montar URL completa
- `BehaviorSubject`, `signal()` → estado compartilhado

**`*-routing.module.ts`**:
- `path`, `component`, `canActivate`, `resolve`, `loadChildren`
- `redirectTo`

**`*.guard.ts`**:
- Lógica de `canActivate()` — o que verifica e para onde redireciona

#### Regra de combinação

| Fonte | Prioridade | Tag no documento |
|-------|-----------|-----------------|
| Arquivo de spec | Alta | *(sem tag — é a fonte oficial)* |
| Código Angular | Complementar | `[Descoberto no código]` |
| Inferência pelo nome | Baixa | `[Inferido — verificar manualmente]` |

---

### ETAPA 4 — Montar o JSON por página

Para cada página identificada, monte o objeto e salve tudo em `doc-output/_doc-data.json`:

```json
{
  "projeto": "[do config.json]",
  "data": "[dd/mm/yyyy]",
  "paginas": [
    {
      "titulo": "Nome legível da página",
      "rota": "/caminho/da/rota",
      "arquivo": "nome-da-rota.docx",
      "modulo": "NomeModule",
      "componentePrincipal": "NomeComponent",
      "status": "novo",
      "atualizado": false,
      "ultimaAtualizacao": null,
      "descricao": "O que o usuário faz nesta tela — da spec",
      "fluxo": [
        "Passo 1 — extraído da spec ou do código",
        "Passo 2",
        "Passo 3"
      ],
      "componentes": [
        {
          "nome": "NomeComponent",
          "seletor": "app-nome",
          "modulo": "NomeModule",
          "descricao": "Função do componente",
          "inputs": [
            { "nome": "prop", "tipo": "string", "descricao": "..." }
          ],
          "outputs": [
            { "nome": "evento", "tipo": "EventEmitter<T>", "descricao": "..." }
          ],
          "servicos": ["NomeService"],
          "metodos": [
            { "nome": "onSubmit()", "descricao": "..." }
          ]
        }
      ],
      "servicos": [
        {
          "nome": "NomeService",
          "escopo": "root",
          "descricao": "Responsabilidade do serviço",
          "endpoints": [
            {
              "metodo": "POST",
              "url": "/api/recurso",
              "retorno": "Observable<Tipo>",
              "descricao": "O que este endpoint faz",
              "fonte": "arquivo",
              "request": {
                "contentType": "application/json",
                "campos": [
                  { "campo": "nome", "tipo": "string", "obrigatorio": true, "descricao": "..." }
                ]
              },
              "responses": [
                { "status": 200, "descricao": "Sucesso", "campos": [
                  { "campo": "id", "tipo": "number", "descricao": "..." }
                ]},
                { "status": 400, "descricao": "Dados inválidos", "campos": [] },
                { "status": 401, "descricao": "Não autorizado", "campos": [] }
              ]
            }
          ]
        }
      ],
      "regrasNegocio": [
        "Regra extraída da spec — texto completo e claro",
        "Outra regra"
      ],
      "guards": [
        { "nome": "AuthGuard", "tipo": "CanActivate", "descricao": "Verifica autenticação antes de ativar a rota" }
      ],
      "resolvers": [
        { "nome": "DadosResolver", "dado": "Dados pré-carregados", "endpoint": "GET /api/dados" }
      ],
      "tags": ["api", "guards", "regras"],
      "observacoes": [
        "Observações técnicas relevantes para o desenvolvedor"
      ],
      "pendentes": [
        "Item descrito na spec mas não encontrado no código"
      ],
      "descobertos": [
        "Item encontrado no código mas não descrito na spec"
      ]
    }
  ],
  "fluxoNavegacao": [
    {
      "de": "/origem",
      "para": "/destino",
      "condicao": "Condição que dispara a navegação",
      "tipo": "action"
    }
  ],
  "endpointsGlobal": [],
  "interceptors": [],
  "pipes": [],
  "enums": [],
  "ambientes": [],
  "diretivas": [],
  "storage": []
}
```

**Inclua em `paginas[]` apenas as páginas com status diferente de "completo".**
Os campos globais (`interceptors`, `pipes`, `enums`, etc.) são sempre incluídos quando encontrados.

---

### ETAPA 5 — Gerar os documentos

```
node generate-doc.js
```

Gera automaticamente:

| Arquivo | Conteúdo |
|---------|----------|
| `[rota].docx` | Um por página — spec + código combinados |
| `_indice.docx` | Índice mestre de todas as páginas |
| `_regras-negocio.docx` | Todas as regras concentradas |
| `_ui-componentes.docx` | Componentes, pipes e diretivas |
| `_endpoints.docx` | Contratos de API |
| `_arquitetura.docx` | Interceptors, enums, state, storage |
| `_controle.json` | Controle de status atualizado |
| `painel.html` | Painel visual com 3 abas |

---

### ETAPA 6 — Fluxo de navegação

Execute sempre, independente do status das páginas.

Leia `app-routing.module.ts`, `*-routing.module.ts`, `*.guard.ts` e procure `router.navigate()` e `[routerLink]` nos componentes.

Para cada transição mapeie: origem, destino, condição e tipo (`action`, `guard`, `redirect`, `link`).

---

### ETAPA 7 — Confirmar resultado

Informe:
- ✅ Páginas criadas
- 🔄 Páginas atualizadas
- ⏭️ Páginas puladas (completas)
- ⚠️ Pendências (spec sem código ou vice-versa)

---

## Regras de inferência

Se não houver spec nem comentário no código, infira pelo nome:
- `CotacaoInicioComponent` → "Componente da página de início de cotação"
- `this.http.post('/api/cotacao')` → `POST /api/cotacao descoberto no código`

Se não conseguir inferir: `"Não identificado — preencher manualmente."`

**Nunca invente regras de negócio. Se não estiver na spec nem no código, não documente.**
