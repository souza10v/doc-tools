# Sistema de Documentação Técnica Angular

## Configuração
Leia `config.json` para obter:
- `projeto` — nome do projeto
- `caminhoSrc` — caminho absoluto para a pasta `src` do projeto Angular
- `stack` — stack utilizada

---

## Modo de execução

### Modo completo (padrão)
```
/gerar-doc
```

### Modo rápido
```
/gerar-doc --fast
```
No modo `--fast`, gere apenas: rotas, componentes, serviços e endpoints básicos.
Pule: análise de formulários, rastreamento de wrappers, state management, storage, interceptors, enums, diretivas.
Informe no início: `⚡ Modo rápido ativo — análises profundas desativadas`

### Módulo específico
```
/gerar-doc src/app/cotacao
```
Processa apenas os arquivos dentro do caminho informado.

---

## ETAPA 0 — Ler controle e verificar hashes

Leia `doc-output/_controle.json` se existir.

### 0a. Status de páginas
- **completo** + hash não mudou → PULAR completamente. Zero tokens.
- **completo** + hash mudou → processar como **parcial**
- **parcial** → ler arquivo existente e complementar
- **pendente** → registrar e avisar
- **novo** → criar do zero

### 0b. Como verificar hashes
O `_controle.json` contém `hashesSpecs` e `hashesCode` da execução anterior.
Para cada arquivo de spec em `specs/` e `endpoints/`, calcule o hash do conteúdo.
Para cada componente já documentado, verifique se os arquivos `.ts` e `.html` mudaram.

Se o hash do arquivo de spec E o hash do código da página não mudaram → a página está **completo** e pode ser pulada.
Se qualquer um mudou → reprocessar como **parcial**.

Ao final, salve os novos hashes em `_controle.json`.

### 0c. Relatório de hashes no início
Antes de processar, informe:
```
📊 Análise de mudanças:
  ⏭️  X páginas sem mudanças — pulando
  🔄  Y páginas com mudanças — atualizando
  ✨  Z páginas novas — criando
```

---

## ETAPA 1 — Converter arquivos de entrada

```
node convert-specs.js
```

Converte `specs/` e `endpoints/` para texto em `specs-txt/` e `endpoints-txt/`.

Formatos suportados: `.docx`, `.xlsx`, `.pptx`, `.pdf`, `.json`, `.txt`, `.md`

---

## ETAPA 2 — Ler e interpretar as specs

Leia cada arquivo em `specs-txt/` e `endpoints-txt/`.

### 2a. Identificar a qual página cada arquivo pertence

Procure no conteúdo por:
- Nome de tela ou funcionalidade mencionada
- Rotas Angular (`/cotacao/inicio`, `cotacao-inicio`, `tela de cotação`)
- Títulos, abas de planilha ou slides que indiquem o nome da tela

**Arquivo trata de uma tela** → associe à página correspondente
**Arquivo trata de múltiplas telas** → distribua cada seção para a página correspondente
**Não identificou** → coloque em pendências

### 2b. Extrair por categoria

**Regras de negócio** — frases com restrição, validação ou condição:
- "deve", "não pode", "é obrigatório", "somente se", "mínimo", "máximo"
- Colunas "Regra", "Validação", "Critério" em planilhas
- Slides com título "Regras" ou "Critérios"

**Fluxo da tela** — sequência de passos do usuário:
- Listas numeradas em Word ou PowerPoint
- Colunas "Passo" ou "Etapa" em planilha
- Textos como "primeiro X, depois Y"

**Endpoints** — menções a API, serviço, requisição:
- URLs como `/api/cotacao/iniciar`
- Métodos HTTP: GET, POST, PUT, PATCH, DELETE
- Campos de request e response

**Campos e formulários** — dados que a tela manipula:
- Tabelas com "Campo", "Tipo", "Obrigatório"
- Listas de campos de formulário

**Rastreabilidade** — para cada informação extraída, registre a fonte:
- `{ fonte: "cotacao-inicio.xlsx", aba: "Regras", linha: "3" }`
- `{ fonte: "especificacao.docx", secao: "Regras de Negócio" }`

---

## ETAPA 3 — Leitura inteligente do código Angular

**NÃO leia todo o `src/app` de uma vez.**

Siga este fluxo para cada página a documentar:

### 3a. Começar pelas rotas
```
src/app/app-routing.module.ts
src/app/**/*-routing.module.ts
```
Monte um mapa: `rota → componente → módulo`

### 3b. Para cada página, ler apenas os arquivos necessários

1. Identifique o componente da rota no mapa de rotas
2. Leia apenas o `.component.ts` e `.component.html` desse componente
3. Nos imports do componente, identifique os serviços injetados
4. Leia apenas os `.service.ts` desses serviços específicos
5. No routing, identifique guards e resolvers da rota
6. Leia apenas os `.guard.ts` e `.resolver.ts` específicos
7. Identifique componentes filho usados no template (`<app-nome>`)
8. Leia apenas os `.component.ts` dos filhos diretos

**Não leia arquivos que não sejam necessários para a página sendo documentada.**

### 3c. Rastreamento de wrappers HTTP

Quando um serviço usa wrapper em vez de `HttpClient` diretamente:

```typescript
// Padrões a rastrear:
this.apiService.get('/endpoint')
this.gateway.post('/endpoint', body)
this.baseService.request('GET', '/endpoint')
this.http.get('/endpoint')  // direto — fácil
```

Siga a cadeia de chamadas:
1. `CotacaoService.iniciar()` chama `ApiService.post('/cotacao')`
2. Leia `ApiService` para ver que chama `this.http.post(this.baseUrl + path)`
3. Leia `environment.ts` para obter o valor de `baseUrl`
4. Documente como `POST ${baseUrl}/cotacao`

Se não conseguir resolver o wrapper completamente, documente como: `POST [baseUrl]/cotacao — resolver baseUrl em environment.ts`

### 3d. Documentação de formulários Angular

Para cada `FormGroup` ou `FormBuilder` encontrado nos componentes:

```typescript
// Identificar:
this.form = this.fb.group({
  cnpj:     ['', [Validators.required, Validators.minLength(14)]],
  numVidas: [null, [Validators.required, Validators.min(3), Validators.max(999)]],
  vigencia: ['']
})
```

Extraia para cada campo:
- **Nome** — chave do FormGroup
- **Valor inicial** — segundo parâmetro
- **Obrigatório** — se tem `Validators.required`
- **Validações** — todos os validators aplicados, com parâmetros
  - `Validators.minLength(14)` → "mínimo 14 caracteres"
  - `Validators.min(3)` → "valor mínimo: 3"
  - `Validators.max(999)` → "valor máximo: 999"
  - `Validators.email` → "formato e-mail"
  - `Validators.pattern(...)` → "padrão: [regex]"
  - Validators customizados → nome da função + "validação customizada"

Adicione ao JSON da página a chave `formularios`:
```json
"formularios": [
  {
    "nome": "form",
    "campos": [
      {
        "campo": "cnpj",
        "tipo": "string",
        "obrigatorio": true,
        "validacoes": ["mínimo 14 caracteres"],
        "descricao": "CNPJ da empresa",
        "fonte": "CotacaoInicioComponent.ts"
      },
      {
        "campo": "numVidas",
        "tipo": "number",
        "obrigatorio": true,
        "validacoes": ["valor mínimo: 3", "valor máximo: 999"],
        "descricao": "Número de vidas",
        "fonte": "CotacaoInicioComponent.ts"
      }
    ]
  }
]
```

### 3e. Mapeamento completo de navegação

Para cada página, mapeie TODAS as saídas de navegação:

**`[routerLink]` no template:**
```html
<a [routerLink]="['/cotacao/planos']">Avançar</a>
<!-- → link: /cotacao/inicio → /cotacao/planos, condição: "Botão Avançar" -->
```

**`router.navigate()` no componente:**
```typescript
this.router.navigate(['/dashboard'])
// → action: /cotacao/inicio → /dashboard
// Verificar em qual método está para inferir a condição
```

**`redirectTo` no router:**
```typescript
{ path: '', redirectTo: '/login', pathMatch: 'full' }
// → redirect: / → /login, condição: "Redirect automático da raiz"
```

**Guards:**
```typescript
canActivate() {
  if (!this.auth.isLoggedIn()) {
    this.router.navigate(['/login'])
    return false
  }
}
// → guard: qualquer rota protegida → /login, condição: "Não autenticado"
```

### 3f. Permissões e acessos

Para cada rota, documente:

**Guards padrão Angular:**
- `canActivate`, `canLoad`, `canActivateChild`
- Qual guard, o que verifica, para onde redireciona

**Decorators de roles/permissões** (se o projeto usar):
```typescript
@Roles('admin', 'manager')
@Claims('cotacao:criar')
@Permission('COTACAO_WRITE')
```
Se encontrar decorators customizados de permissão, documente o nome e os valores.

**Dados do token/sessão usados:**
```typescript
this.auth.hasRole('corretor')
this.auth.can('cotacao:iniciar')
```

Adicione ao JSON da página:
```json
"permissoes": {
  "guards": ["AuthGuard", "CorretorGuard"],
  "roles": ["corretor", "admin"],
  "claims": ["cotacao:criar"],
  "descricao": "Apenas corretores autenticados com permissão de criar cotação"
}
```

---

## ETAPA 4 — Montar o JSON com rastreabilidade

Salve em `doc-output/_doc-data.json`.

Para cada informação documentada, inclua a origem:

```json
{
  "projeto": "[do config.json]",
  "data": "[dd/mm/yyyy]",
  "modoRapido": false,
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
      "hashSpecs": "md5-dos-arquivos-de-spec",
      "hashCode": "md5-dos-arquivos-de-codigo",
      "rastreabilidade": {
        "specsUsadas": ["cotacao-inicio.xlsx", "especificacao.docx"],
        "arquivosCodigo": [
          "src/app/cotacao/cotacao-inicio/cotacao-inicio.component.ts",
          "src/app/cotacao/cotacao.service.ts"
        ]
      },
      "descricao": "...",
      "descricaoFonte": "cotacao-inicio.xlsx — aba Descrição",
      "fluxo": ["Passo 1", "Passo 2"],
      "componentes": [...],
      "servicos": [...],
      "formularios": [
        {
          "nome": "form",
          "campos": [
            {
              "campo": "cnpj",
              "tipo": "string",
              "obrigatorio": true,
              "validacoes": ["mínimo 14 caracteres"],
              "descricao": "CNPJ da empresa",
              "fonte": "CotacaoInicioComponent.ts"
            }
          ]
        }
      ],
      "permissoes": {
        "guards": ["AuthGuard"],
        "roles": [],
        "claims": [],
        "descricao": "Requer autenticação"
      },
      "regrasNegocio": [
        {
          "texto": "CNPJ deve ser válido e ativo na Receita Federal",
          "fonte": "cotacao-inicio.xlsx — aba Regras, linha 3"
        }
      ],
      "guards": [...],
      "resolvers": [...],
      "tags": [],
      "observacoes": [],
      "pendentes": [],
      "descobertos": []
    }
  ],
  "fluxoNavegacao": [
    {
      "de": "/origem",
      "para": "/destino",
      "condicao": "Condição",
      "tipo": "action",
      "fonte": "CotacaoInicioComponent.ts — método onSubmit()"
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

**Regras de negócio agora têm `texto` e `fonte` separados.**
**Fluxo de navegação agora tem `fonte` indicando onde foi encontrado.**

---

## ETAPA 5 — Gerar os documentos

```
node generate-doc.js
```

Ou no modo rápido:
```
node generate-doc.js --fast
```

---

## ETAPA 6 — Atualizar controle com hashes

Ao final, salve em `_controle.json`:

```json
{
  "ultimaExecucao": "dd/mm/yyyy",
  "projeto": "...",
  "modoRapido": false,
  "hashesSpecs": {
    "cotacao-inicio.xlsx": "md5hash",
    "especificacao.docx": "md5hash"
  },
  "hashesEndpoints": {
    "openapi.json": "md5hash"
  },
  "paginasDocumentadas": {
    "/cotacao/inicio": {
      "arquivo": "cotacao-inicio.docx",
      "status": "completo",
      "ultimaAtualizacao": "dd/mm/yyyy",
      "hashSpecs": "md5-combinado-das-specs",
      "hashCode": "md5-combinado-do-codigo",
      "specsUsadas": ["cotacao-inicio.xlsx"],
      "arquivosCodigo": ["src/app/cotacao/...component.ts"]
    }
  },
  "fluxoNavegacao": [...],
  "endpointsResumo": [...]
}
```

---

## ETAPA 7 — Confirmar resultado

Informe:
```
📊 Resultado:
  ✅ X páginas criadas
  🔄 Y páginas atualizadas (hashes mudaram)
  ⏭️  Z páginas puladas (sem mudanças)
  ⚠️  W pendências

📁 Arquivos gerados em doc-output/
🗺️  Abra painel.html no navegador para visualizar
```

---

## Regras gerais

**Precisão acima de tudo:**
- Documente apenas o que está na spec ou no código
- Nunca invente regras de negócio
- Se inferir algo, marque como `[Inferido — verificar]`
- Se não encontrar, marque como `[Não identificado — preencher manualmente]`

**Rastreabilidade:**
- Toda informação deve ter fonte (`spec: arquivo.xlsx, aba X` ou `código: arquivo.ts, método Y`)
- Isso permite QA e negócio validarem cada item documentado

**Escalabilidade:**
- Leia apenas os arquivos necessários para cada página
- Use hashes para pular o que não mudou
- Prefira `/gerar-doc src/app/modulo` para projetos grandes
