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

### Exemplo real (MeuCliente)

```
D:\Projetos\
└── MeuCliente\
    └── MeuProjeto\
        └── MeuCliente\
            │
            ├── meu-projeto-angular\          ← repositório git (sobe pro git)
            │   ├── .git\
            │   ├── src\
            │   │   └── app\
            │   ├── angular.json
            │   └── package.json
            │
            └── doc-tools\                ← sistema de documentação (NÃO sobe pro git)
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
  "projeto": "meu-projeto-angular",
  "caminhoSrc": "D:\\Projetos\\MeuCliente\\MeuProjeto\\meu-projeto-angular\\src",
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

```powershell
# Escolha onde criar o doc-tools — FORA do repositório git
# Exemplo: ao lado do projeto
mkdir "D:\Projetos\MeuProjeto\doc-tools"

# Criar subpastas
cd "D:\Projetos\MeuProjeto\doc-tools"
mkdir specs
mkdir endpoints
mkdir doc-output
mkdir .claude\skills\gerar-doc
```

### 2. Copiar os arquivos do sistema

Copie os arquivos baixados para as seguintes pastas:

| Arquivo             | Destino                                    |
|---------------------|--------------------------------------------|
| `CLAUDE.md`         | `doc-tools\`                               |
| `generate-doc.js`   | `doc-tools\`                               |
| `generate-painel.js`| `doc-tools\`                               |
| `convert-specs.js`  | `doc-tools\`                               |
| `config.json`       | `doc-tools\`                               |
| `SKILL.md`          | `doc-tools\.claude\skills\gerar-doc\`      |

```powershell
# Exemplo copiando da pasta Downloads
$dst = "D:\Projetos\MeuProjeto\doc-tools"
$src = "$env:USERPROFILE\Downloads"

Copy-Item "$src\CLAUDE.md"            "$dst\CLAUDE.md"           -Force
Copy-Item "$src\generate-doc.js"      "$dst\generate-doc.js"     -Force
Copy-Item "$src\generate-painel.js"   "$dst\generate-painel.js"  -Force
Copy-Item "$src\convert-specs.js"     "$dst\convert-specs.js"    -Force
Copy-Item "$src\config.json"          "$dst\config.json"         -Force
Copy-Item "$src\SKILL.md"             "$dst\.claude\skills\gerar-doc\SKILL.md" -Force
```

### 3. Configurar o projeto

Abra o arquivo `config.json` e edite com os dados do seu projeto:

```json
{
  "projeto": "Nome do Projeto",
  "caminhoSrc": "D:\\Caminho\\Para\\Seu\\Projeto\\src",
  "stack": "angular"
}
```

> ⚠️ Use barras duplas `\\` no caminho no Windows.

### 4. Instalar dependências

```powershell
cd "D:\Projetos\MeuProjeto\doc-tools"
npm install docx mammoth
```

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
├── convert-specs.js         ← conversor de Word para texto (não editar)
│
├── .claude\
│   └── skills\
│       └── gerar-doc\
│           └── SKILL.md     ← skill do Claude Code (não editar)
│
├── specs\                   ← COLOQUE AQUI: specs de telas (.docx)
│   └── cotacao-inicio.docx
│   └── pagamento.docx
│
├── endpoints\               ← COLOQUE AQUI: contratos de API (.json ou .docx)
│   └── openapi.json
│   └── endpoints-auth.docx
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

### `specs\` — Especificações de telas

Coloque arquivos descrevendo as telas do frontend. Formatos aceitos:

| Formato | Quando usar |
|---------|-------------|
| `.docx` | Documentos Word com requisitos em texto |
| `.xlsx` | Planilhas com tabelas de regras, campos, permissões |
| `.pptx` | Apresentações com fluxos de tela e wireframes |
| `.pdf`  | Documentos formais de especificação ou contratos |

```
specs\
├── cotacao-inicio.docx       ← requisitos em Word
├── regras-negocio.xlsx       ← tabela de regras por módulo
├── fluxo-navegacao.pptx      ← slides com wireframes e fluxos
└── especificacao-formal.pdf  ← documento oficial de requisitos
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

Coloque arquivos `.json` (OpenAPI/Swagger) ou `.docx` descrevendo os endpoints:

```
endpoints\
├── openapi.json             ← especificação OpenAPI/Swagger completa
├── endpoints-cotacao.docx   ← endpoints em Word
├── endpoints-auth.xlsx      ← tabela de endpoints em Excel
└── contrato-integracao.pdf  ← contrato formal de integração
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

### Uso diário

```powershell
# 1. Abrir o Claude Code na pasta doc-tools
cd "D:\Projetos\MeuProjeto\doc-tools"
claude

# 2. No chat do Claude Code, digitar:
/gerar-doc
```

### Primeira vez (projeto novo)

```powershell
# 1. Instalar dependências
npm install docx mammoth

# 2. Editar config.json com o caminho do projeto

# 3. Opcionalmente colocar specs em specs\ e endpoints em endpoints\

# 4. Abrir o Claude Code
claude

# 5. Gerar a documentação
/gerar-doc
```

### Documentar apenas um módulo

```
/gerar-doc src/app/cotacao
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

| Status         | Cor      | O que o Claude faz           |
|----------------|----------|------------------------------|
| Documentada    | 🟢 Verde | Pula — não reprocessa        |
| Parcial        | 🟡 Âmbar | Lê o arquivo e complementa   |
| Não iniciada   | 🔵 Azul  | Cria do zero                 |
| Pendente       | 🔴 Vermelho | Avisa — aguarda spec ou código |

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
