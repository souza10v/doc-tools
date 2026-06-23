# 📚 doc-tools — Sistema de Documentação Técnica Angular

Sistema automatizado que lê o código-fonte de projetos Angular, combina com
arquivos de especificação e gera documentação técnica profissional em Word (.docx)
e um painel visual HTML interativo.

---

## ✅ O que este sistema faz

- Lê o código Angular do seu projeto (componentes, serviços, rotas, guards)
- Lê arquivos de especificação de telas (Word) e contratos de API (JSON/Word)
- Gera documentação técnica em Word, organizada por página do frontend
- Gera um painel HTML interativo com status de cobertura, fluxo de navegação e endpoints
- Controla o que já foi documentado para não reprocessar desnecessariamente
- **Nada sobe para o repositório git** — tudo fica local no seu computador

---

## 📍 Onde o projeto e o doc-tools ficam

O `doc-tools` deve ficar **sempre fora** da pasta do repositório git,
mas perto o suficiente para ser fácil de encontrar. A posição recomendada
é **ao lado** do repositório, dentro da pasta do cliente/projeto.

### Exemplo real

```
D:\Projetos\
└── ClienteABC\
    └── ProjetoXYZ\
        │
        ├── projeto-xyz-angular\          ← repositório git (sobe pro git)
        │   ├── .git\
        │   ├── src\
        │   │   └── app\
        │   ├── angular.json
        │   └── package.json
        │
        └── doc-tools\                    ← sistema de documentação (NÃO sobe pro git)
            ├── config.json
            ├── CLAUDE.md
            ├── generate-doc.js
            ├── generate-painel.js
            ├── convert-specs.js
            ├── .claude\skills\gerar-doc\SKILL.md
            ├── specs\
            ├── endpoints\
            └── doc-output\
```

### Exemplo genérico para qualquer projeto

```
D:\Projetos\
└── ClienteX\
    └── ProjetoY\
        │
        ├── meu-projeto-angular\          ← repositório git
        │   ├── .git\
        │   ├── src\
        │   └── package.json
        │
        └── doc-tools\                    ← documentação (fora do git)
            ├── config.json               ← aponta para meu-projeto-angular\src
            ├── specs\
            ├── endpoints\
            └── doc-output\
```

### ⚠️ O que NÃO fazer

```
❌  meu-projeto-angular\
    ├── .git\
    ├── src\
    ├── doc-tools\    ← ERRADO: dentro do repositório, vai subir pro git
    └── package.json
```

### O `config.json` aponta para o projeto

O `doc-tools` sabe onde está o código Angular pelo arquivo `config.json`:

```json
{
  "projeto": "projeto-xyz-angular",
  "caminhoSrc": "D:\\Projetos\\ClienteABC\\ProjetoXYZ\\projeto-xyz-angular\\src",
  "stack": "angular"
}
```

O Claude Code abre no `doc-tools`, lê o `config.json` e vai buscar
o código do projeto pelo caminho absoluto — sem precisar abrir o projeto.

---

## 📋 Pré-requisitos

- **Node.js** 18 ou superior → https://nodejs.org
- **Claude Code** instalado → `winget install Anthropic.ClaudeCode`
- **Conta Anthropic** com acesso ao Claude Code

---

## 🚀 Instalação

### 1. Criar a estrutura de pastas

Cole este bloco completo no PowerShell — ele cria tudo de uma vez:

```powershell
# Defina o caminho onde o doc-tools vai ficar (FORA do repositório git)
$root = "D:\Projetos\MeuProjeto\doc-tools"

# Criar toda a estrutura
New-Item -ItemType Directory -Force -Path $root
New-Item -ItemType Directory -Force -Path "$root\specs"
New-Item -ItemType Directory -Force -Path "$root\endpoints"
New-Item -ItemType Directory -Force -Path "$root\doc-output"
New-Item -ItemType Directory -Force -Path "$root\.claude\skills\gerar-doc"

# Confirmar
Write-Host ""
Write-Host "✅ Estrutura criada em $root" -ForegroundColor Green
Write-Host ""
Get-ChildItem $root -Force | Select-Object Name, Attributes
```

Resultado esperado:

```
doc-tools├── .claude│   └── skills│       └── gerar-doc\     ← pasta criada, aguardando SKILL.md
├── specs\                 ← vazia, pronta para receber arquivos
├── endpoints\             ← vazia, pronta para receber arquivos
└── doc-output\            ← vazia, será preenchida ao rodar /gerar-doc
```

### 2. Copiar os arquivos do sistema

Extraia o ZIP baixado e copie os arquivos para as pastas certas:

```powershell
# Ajuste $src para onde o ZIP foi extraído
$src = "$env:USERPROFILE\Downloads\doc-tools-release"
$dst = "D:\Projetos\MeuProjeto\doc-tools"

# Arquivos da raiz
Copy-Item "$src\CLAUDE.md"            "$dst\CLAUDE.md"                                  -Force
Copy-Item "$src\generate-doc.js"      "$dst\generate-doc.js"                            -Force
Copy-Item "$src\generate-painel.js"   "$dst\generate-painel.js"                         -Force
Copy-Item "$src\convert-specs.js"     "$dst\convert-specs.js"                           -Force
Copy-Item "$src\config.json"          "$dst\config.json"                                -Force
Copy-Item "$src\config.exemplo.json"  "$dst\config.exemplo.json"                        -Force
Copy-Item "$src\package.json"         "$dst\package.json"                               -Force

# Skill do Claude Code
Copy-Item "$src\.claude\skills\gerar-doc\SKILL.md" "$dst\.claude\skills\gerar-doc\SKILL.md" -Force

# Confirmar
Write-Host ""
Write-Host "✅ Arquivos copiados com sucesso" -ForegroundColor Green
Get-ChildItem $dst | Select-Object Name
```

Estrutura final depois da cópia:

```
doc-tools├── .claude│   └── skills│       └── gerar-doc│           └── SKILL.md        ← ✅ copiado
├── specs\                      ← vazia (coloque seus arquivos aqui)
├── endpoints\                  ← vazia (coloque seus arquivos aqui)
├── doc-output\                 ← vazia (gerada ao rodar /gerar-doc)
├── CLAUDE.md                   ← ✅ copiado
├── SKILL.md                    ← ✅ copiado
├── config.json                 ← ✅ copiado (edite a seguir)
├── config.exemplo.json         ← ✅ copiado
├── package.json                ← ✅ copiado
├── convert-specs.js            ← ✅ copiado
├── generate-doc.js             ← ✅ copiado
└── generate-painel.js          ← ✅ copiado
```

### 3. Configurar o projeto

Abra o `config.json` e edite com os dados do seu projeto:

```powershell
# Abrir para editar no VS Code
code "D:\Projetos\MeuProjeto\doc-tools\config.json"
```

```json
{
  "projeto": "Nome do Projeto",
  "caminhoSrc": "D:\\Caminho\\Para\\Seu\\Projeto\\src",
  "stack": "angular"
}
```

> ⚠️ Use barras duplas `\\` no caminho no Windows.
> Dica: copie o caminho do Explorer e substitua cada `\` por `\\`.

### 4. Instalar dependências

```powershell
cd "D:\Projetos\MeuProjeto\doc-tools"
npm install
```

Instala tudo de uma vez: `docx`, `mammoth`, `xlsx`, `adm-zip`, `pdf-parse`.

### 5. Fazer login no Claude Code

```powershell
claude login
```

Vai abrir o navegador para autenticar com sua conta Anthropic.

---

## 📁 Estrutura de pastas

```
doc-tools\
│
├── config.json              ← configuração do projeto (edite aqui)
├── CLAUDE.md                ← instruções para o Claude Code (não editar)
├── generate-doc.js          ← script gerador de Word (não editar)
├── generate-painel.js       ← script gerador do painel HTML (não editar)
├── convert-specs.js         ← conversor de arquivos para texto (não editar)
│
├── .claude\
│   └── skills\
│       └── gerar-doc\
│           └── SKILL.md     ← skill do Claude Code (não editar)
│
├── specs\                   ← COLOQUE AQUI: specs de telas
│   │                           Aceita: .docx .xlsx .pptx .pdf .json .txt .md
│   │                           Sem limite de arquivos — misture à vontade
│   ├── minha-tela.docx
│   ├── regras.xlsx
│   ├── fluxos.pptx
│   └── spec-formal.pdf
│
├── endpoints\               ← COLOQUE AQUI: contratos de API
│   │                           Aceita: .json .docx .xlsx .pdf .txt .md
│   │                           Sem limite de arquivos — misture à vontade
│   ├── openapi.json
│   ├── endpoints.docx
│   ├── tabela-api.xlsx
│   └── contrato.pdf
│
├── specs-txt\               ← gerado automaticamente (não editar)
├── endpoints-txt\           ← gerado automaticamente (não editar)
│
└── doc-output\              ← DOCUMENTAÇÃO GERADA (não editar manualmente)
    ├── painel.html          ← painel visual interativo (3 abas)
    ├── _indice.docx         ← índice mestre de todas as páginas
    ├── _regras-negocio.docx ← todas as regras de negócio concentradas
    ├── _ui-componentes.docx ← componentes, pipes e diretivas
    ├── _endpoints.docx      ← contratos de API com request/response
    ├── _arquitetura.docx    ← interceptors, enums, ambientes, state
    ├── _controle.json       ← controle interno de status (não editar)
    └── [nome-da-rota].docx  ← um arquivo por página do frontend
        ex: cotacao-inicio.docx
            pagamento.docx
            login.docx
```

---

## 📂 O que colocar em cada pasta de entrada

> ✅ **Ambas as pastas são opcionais.** Se estiverem vazias, o Claude documenta apenas pelo código Angular.
> Você pode misturar quantos arquivos quiser, em qualquer combinação de formatos.

---

### Formatos aceitos (nas duas pastas)

| Formato | Ícone | Quando usar |
|---------|-------|-------------|
| `.docx` | 📄 | Documentos Word com requisitos em texto |
| `.xlsx` | 📊 | Planilhas com tabelas de regras, campos, permissões, matrizes |
| `.pptx` | 📽️ | Apresentações com fluxos de tela, wireframes, slides de arquitetura |
| `.pdf`  | 📋 | Documentos formais de especificação, contratos, manuais |
| `.json` | 🔧 | OpenAPI/Swagger, contratos de API estruturados |
| `.txt`  | 📝 | Texto simples, notas, rascunhos |
| `.md`   | 📝 | Markdown com requisitos ou documentação |

---

### `specs\` — Especificações de telas

Coloque qualquer arquivo que descreva telas, funcionalidades ou regras de negócio.
Sem limite de quantidade — coloque todos que tiver.

```
specs\
├── cotacao-inicio.docx       📄 requisitos da tela em Word
├── selecao-planos.docx       📄 requisitos de outra tela
├── regras-negocio.xlsx       📊 tabela com todas as regras por módulo
├── matriz-permissoes.xlsx    📊 quem pode acessar cada tela
├── fluxo-navegacao.pptx      📽️ slides com wireframes e fluxos
├── arquitetura-frontend.pptx 📽️ slides com componentes e módulos
├── especificacao-formal.pdf  📋 documento oficial de requisitos
├── manual-usuario.pdf        📋 manual com fluxos descritos
├── notas-reuniao.txt         📝 anotações de reunião com o cliente
└── glossario.md              📝 glossário de termos do negócio
```

**O que incluir no documento:**
- Nome e propósito da tela
- Fluxo do usuário (passo a passo)
- Regras de negócio
- Campos e validações
- Comportamentos esperados

**Exemplo de conteúdo:**
```
Tela: Cotação Início
Rota: /cotacao/inicio

Descrição:
Tela inicial do fluxo de cotação onde o corretor informa os dados
básicos da empresa para iniciar uma proposta.

Fluxo:
1. Corretor informa o CNPJ da empresa
2. Sistema busca dados na Receita Federal
3. Corretor confirma os dados e informa número de vidas
4. Sistema valida elegibilidade
5. Corretor avança para seleção de planos

Regras de negócio:
- CNPJ deve ser válido e ativo na Receita Federal
- Número mínimo de vidas: 3
- Número máximo de vidas: 999
- Empresa com menos de 6 meses não é elegível
```

---

### `endpoints\` — Contratos de API

Coloque qualquer arquivo que descreva endpoints, contratos ou integrações.
Sem limite de quantidade — coloque todos que tiver.

```
endpoints\
├── openapi.json              🔧 especificação OpenAPI/Swagger completa
├── swagger-auth.json         🔧 spec do módulo de autenticação
├── endpoints-cotacao.docx    📄 endpoints do módulo de cotação em Word
├── endpoints-proposta.docx   📄 endpoints do módulo de proposta em Word
├── tabela-endpoints.xlsx     📊 tabela completa de endpoints em Excel
├── matriz-http-status.xlsx   📊 planilha com status codes por endpoint
├── contrato-integracao.pdf   📋 contrato formal de integração
└── manual-api.pdf            📋 manual da API com exemplos
```

**Formato JSON aceito (OpenAPI/Swagger):**
```json
{
  "paths": {
    "/api/cotacao/iniciar": {
      "post": {
        "summary": "Inicia nova cotação",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "properties": {
                  "cnpj":     { "type": "string",  "description": "CNPJ da empresa" },
                  "numVidas": { "type": "integer", "description": "Número de vidas" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Cotação iniciada com sucesso" },
          "400": { "description": "Dados inválidos" }
        }
      }
    }
  }
}
```

**Formato Word aceito:**
```
Endpoint: Iniciar Cotação
Método: POST
URL: /api/cotacao/iniciar

Request:
- cnpj (string, obrigatório): CNPJ da empresa
- numVidas (number, obrigatório): número de vidas

Response 200:
- cotacaoId (string): ID da cotação gerada
- status (string): status inicial

Response 400:
- mensagem (string): descrição do erro
```

---

## ▶️ Como usar

### Comandos disponíveis

| Comando | O que faz |
|---------|-----------|
| `/gerar-doc` | Documentação completa — lê specs, código, formulários, permissões, rastreabilidade |
| `/gerar-doc --fast` | Modo rápido — gera só rotas, componentes, serviços e endpoints básicos |
| `/gerar-doc src/app/modulo` | Documenta apenas um módulo específico |

---

### `/gerar-doc` — Modo completo

O modo padrão. Processa tudo:

- ✅ Lê specs (Excel, Word, PowerPoint, PDF) e identifica a qual tela cada uma pertence
- ✅ Lê apenas os arquivos de código necessários para cada tela (não lê o `src/app` inteiro)
- ✅ Documenta formulários Angular com campos, tipos e validações (`FormGroup`, `Validators`)
- ✅ Rastreia endpoints mesmo quando passam por wrappers (`ApiService`, `Gateway`)
- ✅ Mapeia permissões, roles, claims e guards de cada rota
- ✅ Registra a fonte de cada informação (qual arquivo de spec, qual linha do código)
- ✅ Pula páginas sem mudanças usando controle de hash
- ✅ Gera fluxo de navegação com origem de cada transição no código

```
# No chat do Claude Code:
/gerar-doc
```

---

### `/gerar-doc --fast` — Modo rápido ⚡

Gera documentação básica em menos tempo e com menos tokens. Ideal para:
- Primeira passagem em projetos grandes
- Quando você quer só um esqueleto rápido
- Projetos com centenas de componentes

O que é gerado no modo `--fast`:
- ✅ Rotas e componentes de cada tela
- ✅ Serviços e endpoints (básico, sem rastreamento de wrappers)
- ✅ Regras de negócio das specs
- ✅ Guards e permissões
- ❌ Formulários e validações (pulado)
- ❌ Rastreabilidade detalhada (pulado)
- ❌ State management, interceptors, storage (pulado)

```
# No chat do Claude Code:
/gerar-doc --fast
```

---

### `/gerar-doc src/app/modulo` — Módulo específico

Documenta apenas um módulo ou pasta. Útil em projetos grandes onde você quer
documentar por etapas ou atualizar apenas o que mudou em um módulo específico.

```
# Exemplos:
/gerar-doc src/app/cotacao
/gerar-doc src/app/auth
/gerar-doc src/app/shared
```

Pode combinar com `--fast`:
```
/gerar-doc src/app/cotacao --fast
```

---

### Uso diário

```powershell
# 1. Abrir o Claude Code na pasta doc-tools
cd "D:\Projetos\MeuProjeto\doc-tools"
claude

# 2. No chat do Claude Code, escolha o comando:
/gerar-doc           # completo
/gerar-doc --fast    # rápido
```

### Primeira vez (projeto novo)

```powershell
# 1. Instalar dependências
npm install

# 2. Editar config.json com o caminho do projeto

# 3. Opcionalmente colocar specs em specs\ e endpoints em endpoints\

# 4. Abrir o Claude Code
claude

# 5. Gerar a documentação
/gerar-doc
```

---

## 📊 Documentação gerada

Após rodar `/gerar-doc`, os arquivos aparecem em `doc-output\`:

| Arquivo                  | Conteúdo                                                      |
|--------------------------|---------------------------------------------------------------|
| `painel.html`            | Painel interativo com 3 abas (abrir no navegador)             |
| `_indice.docx`           | Índice de todas as páginas documentadas                       |
| `_regras-negocio.docx`   | Todas as regras de negócio centralizadas                      |
| `_ui-componentes.docx`   | Componentes Angular com inputs, outputs, pipes e diretivas    |
| `_endpoints.docx`        | Contratos de API com request/response detalhados              |
| `_arquitetura.docx`      | Interceptors, resolvers, pipes, enums, ambientes, state       |
| `login.docx`             | Documentação da página /login                                 |
| `cotacao-inicio.docx`    | Documentação da página /cotacao/inicio                        |
| *(um por página)*        | ...                                                           |

### Abrindo o painel

```powershell
start "doc-output\painel.html"
```

O painel tem **3 abas**:

- **Páginas** — status de cobertura de cada tela (Documentada / Parcial / Não iniciada / Pendente)
- **Endpoints** — lista de todos os endpoints com filtro por método HTTP
- **Fluxo de Navegação** — tabela e diagrama mostrando como as telas se conectam

---

## 🔄 Status de cobertura

O sistema controla automaticamente o que já foi documentado:

| Status | Cor | O que o Claude faz |
|--------|-----|-------------------|
| Documentada | 🟢 Verde | Pula — não reprocessa |
| Parcial | 🟡 Âmbar | Lê o arquivo e complementa |
| Não iniciada | 🔵 Azul | Cria do zero |
| Pendente | 🔴 Vermelho | Avisa — aguarda spec ou código |

---

## ⚡ Controle de hash — evita reprocessamento

O sistema calcula o hash MD5 de cada arquivo de spec e do código Angular.
Na próxima execução, compara com os hashes salvos:

- **Hash não mudou** → página pulada automaticamente. Zero tokens gastos.
- **Hash mudou** → página reprocessada como **parcial** (complementa o existente)
- **Arquivo novo** → página criada do zero

Os hashes ficam em `doc-output/_hashes-specs.json` — não edite manualmente.

```
📊 Análise de mudanças (exibido no início de cada execução):
  ⏭️  3 páginas sem mudanças — pulando
  🔄  2 páginas com mudanças — atualizando
  ✨  1 página nova — criando
```

---

## 🔍 Rastreabilidade spec → código

Cada informação documentada registra sua origem:

- **Regras de negócio** mostram o arquivo de spec e linha de origem
  - `↳ Fonte: cotacao-inicio.xlsx — aba Regras, linha 3`
- **Fluxo de navegação** mostra onde cada transição foi encontrada no código
  - `Fonte: CotacaoInicioComponent.ts — método onSubmit()`
- **Seção de rastreabilidade** no final de cada `.docx` lista:
  - Quais arquivos de spec foram usados
  - Quais arquivos de código foram analisados
  - Tabela com a origem de cada regra de negócio

---

## 🔒 Git — o que NÃO sobe

Adicione no `.gitignore` do seu projeto se quiser garantia extra:

```gitignore
# doc-tools — nunca sobe para o git
doc-tools/
```

Como o `doc-tools` fica **fora** da pasta do repositório, ele naturalmente não é rastreado pelo git. Mas se colocar dentro do projeto por algum motivo, adicione as linhas acima.

---

## 🆕 Usar em um novo projeto

1. Copie a pasta `doc-tools` inteira para ao lado do novo projeto
2. Edite apenas o `config.json`:
   ```json
   {
     "projeto": "Novo Projeto",
     "caminhoSrc": "D:\\Caminho\\Novo\\Projeto\\src",
     "stack": "angular"
   }
   ```
3. Limpe as pastas de entrada e saída:
   ```powershell
   Remove-Item specs\* -Force
   Remove-Item endpoints\* -Force
   Remove-Item doc-output\* -Force
   ```
4. Abra o Claude Code e rode `/gerar-doc`

---

## ❓ Problemas comuns

**`claude` não reconhecido no terminal**
```powershell
winget install Anthropic.ClaudeCode
# Feche e abra um novo terminal
```

**`Cannot find module 'docx'`**
```powershell
npm install docx mammoth
```

**`doc-output/_doc-data.json não encontrado`**
O Claude não terminou de gerar o JSON. Rode `/gerar-doc` novamente e aguarde terminar completamente.

**Skill `/gerar-doc` não reconhecida**
Verifique se o `SKILL.md` está exatamente em:
```
doc-tools\.claude\skills\gerar-doc\SKILL.md
```

**Claude não encontra o código do projeto**
Verifique o caminho no `config.json` — use barras duplas `\\` e confirme que o caminho existe no Explorer.

---

## 📦 Dependências

| Pacote      | Versão   | Para que serve                         |
|-------------|----------|----------------------------------------|
| `docx`      | ^8.5.0   | Gerar arquivos Word (.docx)            |
| `mammoth`   | ^1.12.0  | Ler arquivos Word (.docx) de spec      |
| `xlsx`      | ^0.18.5  | Ler planilhas Excel (.xlsx)            |
| `adm-zip`   | ^0.5.10  | Ler apresentações PowerPoint (.pptx)   |
| `pdf-parse` | ^1.1.1   | Ler arquivos PDF                       |

```powershell
npm install
```

---

## 📄 Arquivos do sistema

| Arquivo              | Editar? | Descrição                                      |
|----------------------|---------|------------------------------------------------|
| `config.json`        | ✅ Sim  | Configuração do projeto (caminho, nome, stack) |
| `CLAUDE.md`          | ❌ Não  | Instruções para o Claude Code                  |
| `SKILL.md`           | ❌ Não  | Skill `/gerar-doc` do Claude Code              |
| `generate-doc.js`    | ❌ Não  | Script gerador de Word                         |
| `generate-painel.js` | ❌ Não  | Script gerador do painel HTML                  |
| `convert-specs.js`   | ❌ Não  | Conversor de Word para texto                   |
