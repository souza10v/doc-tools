# Sistema de Documentação Técnica Angular

## Configuração do projeto
Leia `config.json` na raiz do doc-tools para obter:
- `projeto` — nome do projeto
- `caminhoSrc` — caminho absoluto para a pasta src do projeto Angular
- `stack` — stack utilizada (angular)

---

## Estrutura de pastas do doc-tools

```
doc-tools\
├── config.json          ← configuração do projeto (edite aqui)
├── CLAUDE.md            ← instruções para o Claude Code (não editar)
├── generate-doc.js      ← script gerador de Word (não editar)
├── generate-painel.js   ← script gerador do painel HTML (não editar)
├── convert-specs.js     ← conversor de Word para texto (não editar)
├── .claude\skills\gerar-doc\SKILL.md
├── specs\               ← .docx com requisitos e especificações de telas
├── specs-txt\           ← gerado automaticamente
├── endpoints\           ← arquivos de endpoint (JSON ou .docx)
├── endpoints-txt\       ← gerado automaticamente
└── doc-output\          ← documentação gerada
```

---

## O que fazer quando receber /gerar-doc

### ETAPA 0 — Ler configuração e controle

Leia `config.json` para obter o caminho do projeto.
Leia `doc-output\_controle.json` se existir.

Para cada página no controle:
- **status "completo"** → PULAR. Zero tokens gastos.
- **status "parcial"**  → Ler só o arquivo existente e complementar.
- **status "pendente"** → Registrar e avisar. Não processar.
- **status "novo"**     → Criar do zero.

---

### ETAPA 1 — Converter e ler especificações de telas

```
node convert-specs.js
```

O conversor processa automaticamente todos os formatos suportados em `specs\` e `endpoints\`:

| Formato | Ícone | O que extrai |
|---------|-------|--------------|
| `.docx` | 📄 | Texto completo do documento Word |
| `.xlsx` | 📊 | Conteúdo de todas as abas, linha por linha |
| `.pptx` | 📽️ | Texto de cada slide + notas do apresentador |
| `.pdf`  | 📋 | Texto completo + metadados (título, autor) |
| `.json` | 🔧 | Conteúdo estruturado (OpenAPI, contratos) |

**Como interpretar cada formato:**

**Excel (`.xlsx`)** — cada aba vira uma seção separada no `.txt`. Procure por:
- Abas com nomes como "Requisitos", "Regras", "Endpoints", "Fluxo"
- Tabelas com colunas como "Campo", "Tipo", "Obrigatório", "Descrição"
- Listas de regras de negócio numeradas
- Matrizes de permissão (quem pode fazer o quê)

**PowerPoint (`.pptx`)** — cada slide vira uma seção. Procure por:
- Slides de fluxo de tela (wireframes descritos em texto)
- Slides de arquitetura com componentes listados
- Notas do apresentador com detalhes técnicos adicionais
- Títulos de slide como nomes de tela/funcionalidade

**PDF (`.pdf`)** — texto extraído página por página. Procure por:
- Documentos de requisitos formais
- Especificações técnicas de API
- Contratos de integração
- Documentação de sistemas legados

Leia todos os arquivos em `specs-txt\` e extraia:
- Qual página/rota cada spec descreve
- Regras de negócio
- Fluxos de tela
- Componentes descritos
- Entidades e campos
- Glossário de termos

---

### ETAPA 2 — Ler e processar arquivos de endpoints

Verifique se existe a pasta `endpoints\`.

**Para cada `.json` em `endpoints\`:**
Interprete como OpenAPI/Swagger ou formato customizado. Extraia:
- Método HTTP, path/URL, descrição
- Parâmetros (query, path, body) com nome, tipo, obrigatório, descrição
- Request body — schema completo
- Responses por status code (200, 400, 401, 404, 500)
- Tags/grupos
- Qual página do frontend consome (cruzar com specs e código)

**Para cada `.docx` em `endpoints\`:**
Leia os `.txt` gerados em `endpoints-txt\` e extraia as mesmas informações.

**Regra de prioridade:**
- Arquivo E código → usar arquivo, complementar com código
- Só arquivo → `[Fonte: arquivo]`
- Só código → `[Descoberto no código]`

---

### ETAPA 3 — Ler o código Angular

Leia apenas páginas com status diferente de "completo".
Use o caminho do `config.json` como base.

#### Arquivos base (sempre ler)
```
src\app\app-routing.module.ts
src\app\**\*-routing.module.ts
src\app\**\*.module.ts
src\app\**\*.component.ts
src\app\**\*.component.html
src\app\**\*.service.ts
src\app\**\*.guard.ts
src\app\**\*.model.ts
src\app\**\*.interface.ts
src\app\**\*.enum.ts
```

#### Alta prioridade — ler sempre

**Interceptors** (`*.interceptor.ts`):
- Nome do interceptor
- Tipo: request ou response
- O que faz: adiciona headers, trata erros, refresh token, loading, etc.
- Em qual módulo está registrado
- Impacto nas requisições HTTP

**Resolvers** (`*.resolver.ts`):
- Nome do resolver
- Qual dado pré-carrega antes da rota ativar
- Em qual rota está associado (cruzar com routing)
- Serviço e endpoint que chama

**Pipes customizados** (`*.pipe.ts`):
- Nome e seletor do pipe (`@Pipe({ name: '...' })`)
- O que transforma (input → output)
- Onde é usado nos templates
- Se é `pure` ou `impure`

**Enums** (`*.enum.ts`):
- Nome do enum
- Todos os valores com descrições
- Onde é usado (components e services)
- Contexto de negócio (status, tipos, categorias)

#### Média prioridade — ler sempre

**Variáveis de ambiente** (`environment.ts`, `environment.prod.ts`):
- URLs de API por ambiente
- Feature flags
- Configurações que mudam entre ambientes
- Chaves de integrações (sem expor valores sensíveis)

**State management**:

Se usar **NgRx** (`*.actions.ts`, `*.reducer.ts`, `*.effects.ts`, `*.selectors.ts`):
- Actions com payload esperado
- Shape do state em cada reducer
- Effects e quais endpoints chamam
- Selectors usados nos componentes

Se usar **Services com BehaviorSubject/Signal**:
- `BehaviorSubject`, `Subject`, `signal()`, `computed()`
- O que cada um armazena
- Quais componentes consomem

**Diretivas customizadas** (`*.directive.ts`):
- Nome e seletor (`@Directive({ selector: '...' })`)
- O que faz ao elemento
- Inputs que aceita
- Onde é usada nos templates

**Storage do browser** (sessionStorage, localStorage, cookies):

Procure em TODOS os arquivos `.ts` por:
- `sessionStorage.getItem/setItem/removeItem/clear`
- `localStorage.getItem/setItem/removeItem/clear`
- `document.cookie`, `CookieService`, `.getCookie/.setCookie/.deleteCookie`

Para cada ocorrência extraia:
- **Chave** — string usada como identificador (`'token'`, `'user'`, `'cotacao_id'`)
- **Tipo** — `sessionStorage`, `localStorage` ou `cookie`
- **Dado armazenado** — o que é guardado (inferir pelo contexto)
- **Onde é gravado** — arquivo e método que faz o setItem/setCookie
- **Onde é lido** — arquivo e método que faz o getItem/getCookie
- **Onde é limpo** — arquivo e método que faz o removeItem/deleteCookie/clear
- **Observação de segurança** — se dado sensível (token, dados pessoais) estiver em localStorage marcar como `⚠️ Dado sensível em localStorage`

Adicione no JSON de saída a chave `storage`:
```json
"storage": [
  {
    "chave": "token",
    "tipo": "sessionStorage",
    "dado": "JWT de autenticação",
    "gravadoEm": "AuthService.login()",
    "lidoEm": ["AuthInterceptor", "AuthGuard"],
    "limpoEm": "AuthService.logout()",
    "observacao": ""
  },
  {
    "chave": "user_preferences",
    "tipo": "localStorage",
    "dado": "Preferências do usuário",
    "gravadoEm": "PreferencesComponent.save()",
    "lidoEm": ["AppComponent.ngOnInit()"],
    "limpoEm": "—",
    "observacao": ""
  },
  {
    "chave": "cookieConsent",
    "tipo": "cookie",
    "dado": "Aceite do banner de cookies",
    "gravadoEm": "CookieBannerComponent.accept()",
    "lidoEm": ["AppComponent.ngOnInit()"],
    "limpoEm": "—",
    "observacao": ""
  }
]
```

#### Nos `*.service.ts`, extrair endpoints:
- `this.http.get/post/put/patch/delete(`
- URLs e environment variables usadas
- Tipo de retorno `Observable<T>`
- Parâmetros de body e query string

---

### ETAPA 4 — Montar o JSON intermediário

Salve em `doc-output\_doc-data.json`:

```json
{
  "projeto": "[do config.json]",
  "data": "[dd/mm/yyyy]",
  "paginas": [
    {
      "titulo": "Nome da página",
      "rota": "/caminho",
      "arquivo": "nome-rota.docx",
      "modulo": "NomeModule",
      "componentePrincipal": "NomeComponent",
      "status": "novo",
      "atualizado": false,
      "ultimaAtualizacao": null,
      "descricao": "...",
      "fluxo": ["Passo 1", "Passo 2"],
      "componentes": [
        { "nome": "NomeComponent", "seletor": "app-nome", "modulo": "NomeModule", "descricao": "..." }
      ],
      "servicos": [
        {
          "nome": "NomeService",
          "endpoints": [
            {
              "metodo": "POST",
              "url": "/api/recurso",
              "retorno": "Observable<Tipo>",
              "descricao": "...",
              "fonte": "arquivo",
              "request": {
                "contentType": "application/json",
                "campos": [
                  { "campo": "nome", "tipo": "string", "obrigatorio": true, "descricao": "..." }
                ]
              },
              "responses": [
                { "status": 200, "descricao": "Sucesso", "campos": [{ "campo": "id", "tipo": "number", "descricao": "..." }] },
                { "status": 400, "descricao": "Dados inválidos", "campos": [] }
              ]
            }
          ]
        }
      ],
      "regrasNegocio": ["Regra 1"],
      "guards": [{ "nome": "AuthGuard", "tipo": "CanActivate", "descricao": "..." }],
      "resolvers": [{ "nome": "DadosResolver", "dado": "dados pré-carregados", "endpoint": "/api/dados" }],
      "tags": ["api", "guards"],
      "observacoes": [],
      "pendentes": [],
      "descobertos": []
    }
  ],
  "fluxoNavegacao": [
    { "de": "/login", "para": "/dashboard", "condicao": "Login bem-sucedido", "tipo": "action" }
  ],
  "endpointsGlobal": [
    {
      "nome": "Nome do endpoint",
      "metodo": "GET",
      "url": "/api/recurso",
      "descricao": "...",
      "grupo": "Tag/grupo",
      "fonte": "arquivo",
      "paginasQueConsomem": ["/rota-1"],
      "request": { "contentType": "application/json", "campos": [] },
      "responses": [{ "status": 200, "descricao": "Sucesso", "campos": [] }]
    }
  ],
  "interceptors": [
    {
      "nome": "AuthInterceptor",
      "tipo": "request",
      "descricao": "Adiciona token JWT no header Authorization de todas as requisições",
      "modulo": "CoreModule",
      "impacto": "Todas as requisições HTTP recebem o header Authorization automaticamente"
    }
  ],
  "resolversGlobal": [
    {
      "nome": "DadosResolver",
      "dado": "Dados do usuário logado",
      "servico": "UserService",
      "endpoint": "/api/user/me",
      "rotas": ["/dashboard", "/perfil"]
    }
  ],
  "pipes": [
    {
      "nome": "CpfPipe",
      "seletor": "cpf",
      "descricao": "Formata string de CPF como 000.000.000-00",
      "input": "string",
      "output": "string formatada",
      "pure": true,
      "usadaEm": ["CadastroComponent", "PerfilComponent"]
    }
  ],
  "enums": [
    {
      "nome": "StatusCotacao",
      "descricao": "Status possíveis de uma cotação",
      "valores": [
        { "chave": "RASCUNHO", "valor": "rascunho", "descricao": "Cotação em preenchimento" },
        { "chave": "ENVIADA",  "valor": "enviada",  "descricao": "Cotação enviada para análise" },
        { "chave": "APROVADA", "valor": "aprovada", "descricao": "Cotação aprovada" },
        { "chave": "RECUSADA", "valor": "recusada", "descricao": "Cotação recusada" }
      ],
      "usadoEm": ["CotacaoService", "CotacaoInicioComponent"]
    }
  ],
  "ambientes": [
    {
      "ambiente": "develoMeuProjetont",
      "arquivo": "environment.ts",
      "variaveis": [
        { "chave": "apiUrl",        "valor": "http://localhost:3000", "descricao": "URL base da API" },
        { "chave": "production",    "valor": "false",                 "descricao": "Flag de produção" },
        { "chave": "featureNovaUI", "valor": "true",                  "descricao": "Feature flag nova UI" }
      ]
    },
    {
      "ambiente": "production",
      "arquivo": "environment.prod.ts",
      "variaveis": [
        { "chave": "apiUrl",        "valor": "[OMITIDO]",  "descricao": "URL base da API de produção" },
        { "chave": "production",    "valor": "true",       "descricao": "Flag de produção" },
        { "chave": "featureNovaUI", "valor": "false",      "descricao": "Feature flag nova UI" }
      ]
    }
  ],
  "stateManagement": {
    "tipo": "ngrx",
    "actions": [
      { "nome": "loadCotacao", "payload": "{ id: string }", "descricao": "Carrega cotação pelo ID" },
      { "nome": "loadCotacaoSuccess", "payload": "{ cotacao: Cotacao }", "descricao": "Cotação carregada com sucesso" }
    ],
    "reducers": [
      { "nome": "cotacaoReducer", "state": "{ cotacao: Cotacao | null, loading: boolean, error: string | null }" }
    ],
    "effects": [
      { "nome": "loadCotacao$", "action": "loadCotacao", "endpoint": "GET /api/cotacao/:id", "dispara": "loadCotacaoSuccess | loadCotacaoFailure" }
    ],
    "selectors": [
      { "nome": "selectCotacao", "retorna": "Cotacao | null", "usadoEm": ["CotacaoResumoComponent"] }
    ]
  },
  "diretivas": [
    {
      "nome": "OnlyNumbersDirective",
      "seletor": "[appOnlyNumbers]",
      "descricao": "Permite apenas dígitos numéricos no input",
      "inputs": [],
      "usadaEm": ["CotacaoInicioComponent", "PagamentoComponent"]
    }
  ]
}
```

Inclua no array `paginas` APENAS as páginas que precisam ser criadas ou atualizadas.
As chaves `interceptors`, `pipes`, `enums`, `ambientes`, `stateManagement`, `diretivas` são globais — sempre incluir se encontrado, independente do status das páginas.

---

### ETAPA 5 — Gerar os documentos

```
node generate-doc.js
```

Gera:
- `doc-output\[rota].docx` — documentação por página
- `doc-output\_indice.docx` — índice mestre
- `doc-output\_regras-negocio.docx` — regras concentradas
- `doc-output\_ui-componentes.docx` — componentes, pipes e diretivas
- `doc-output\_endpoints.docx` — contratos de API
- `doc-output\_arquitetura.docx` — NOVO: interceptors, enums, ambientes, state
- `doc-output\_controle.json` — controle atualizado
- `doc-output\painel.html` — painel visual

---

### ETAPA 6 — Confirmar resultado

Informe:
- ✅ Páginas criadas
- 🔄 Páginas atualizadas
- ⏭️  Páginas puladas (completas)
- 🔌 Endpoints documentados
- 🏗️  Interceptors, pipes, enums, diretivas encontrados
- ⚠️  Pendências

---

### ETAPA EXTRA — Fluxo de navegação

Execute sempre, independente do status das páginas.

Leia:
```
src\app\app-routing.module.ts
src\app\**\*-routing.module.ts
src\app\**\*.guard.ts
src\app\**\*.component.ts   ← router.navigate()
src\app\**\*.component.html ← [routerLink]
```

Para cada rota mapeie origem, destino, condição e tipo:
- `guard` — interceptado por guard
- `redirect` — redirect automático no router
- `action` — resultado de ação do usuário
- `link` — routerLink direto

Salve em `_controle.json → fluxoNavegacao[]`.

---

## Regras de inferência

- `AuthInterceptor` → "Interceptor de autenticação"
- `CpfPipe` → "Pipe de formatação de CPF"
- `StatusCotacao` enum → documentar todos os valores
- `environment.apiUrl` → "URL base da API"
- `BehaviorSubject<User>` em UserService → "Estado do usuário logado compartilhado entre componentes"

Se não conseguir inferir: `"Não identificado — preencher manualmente."`
Nunca invente comportamentos. Se não estiver no código ou na spec, não documente.
