# Guia Definitivo de Implantação e Produção
## Simulador Comercial Multilagos (`simulador.multilagos.com.br`)

---

### 1. Entendendo o Arquivo ZIP Exportado (Por que não vêm todos os arquivos?)

Quando você clica em "Exportar em ZIP" ou "Baixar código", você está baixando o **código-fonte** de uma aplicação moderna em **React + TypeScript + Vite**:

1. **A pasta `node_modules` não vem no ZIP (Padrão mundial da programação)**:
   - A pasta `node_modules` contém dezenas de milhares de bibliotecas e pesa cerca de 300MB a 600MB.
   - Ela **nunca** é incluída em arquivos ZIP nem em repositórios Git.
   - Para gerá-la no seu computador ou servidor, basta rodar o comando:
     ```bash
     npm install
     ```

2. **A pasta `dist` (arquivos compilados finais) não vem no ZIP do código-fonte**:
   - O código que nós desenvolvemos está em arquivos `.tsx` e `.ts` (TypeScript moderno). Navegadores comuns não executam TypeScript diretamente se você der duplo clique no `index.html`.
   - Por isso, o `index.html` bruto aponta para `<script type="module" src="/src/main.tsx"></script>`.
   - Para transformar tudo em HTML, CSS e JavaScript puros prontos para produção, roda-se o comando:
     ```bash
     npm run build
     ```
   - Esse comando cria a pasta **`dist/`**, que contém o site 100% pronto para qualquer servidor web ou GitHub Pages.

---

### 2. Onde Hospedar? As Duas Melhores Opções para Você

Você mencionou que tem uma **VPS na Hostinger com Easypanel** e que seu site principal já está no **GitHub Pages**. Ambas são excelentes opções:

---

### OPÇÃO A: Easypanel na VPS Hostinger (Recomendado - 100% Automatizado e Profissional)

O seu projeto já está equipado com um **`Dockerfile` multi-stage** e um arquivo **`nginx.conf`** otimizados para alta performance e suporte a rotas SPA (Single Page Application).

#### Passo a Passo no Easypanel:
1. **Suba o código para um repositório no seu GitHub**:
   - Crie um repositório (ex: `simulador-multilagos`) no seu GitHub.
   - Envie todos os arquivos do projeto para ele.
2. **Abra o Easypanel na sua VPS Hostinger**:
   - Faça login no seu painel Easypanel.
   - Selecione o seu projeto (ou crie um novo projeto chamado `Multilagos`).
3. **Crie a Aplicação**:
   - Clique em **+ Service** -> **App**.
   - Dê o nome de `simulador`.
   - Em **Source**, selecione **GitHub**.
   - Conecte sua conta do GitHub e selecione o repositório `simulador-multilagos`.
   - O Easypanel detectará automaticamente o arquivo `Dockerfile` que já deixamos pronto na raiz!
4. **Configure o Domínio**:
   - No menu lateral do aplicativo no Easypanel, clique na aba **Domains**.
   - Clique em **Add Domain** e digite:
     `simulador.multilagos.com.br`
   - Marque a opção de **SSL (HTTPS)** automático (o Easypanel emite o certificado gratuito Let's Encrypt sozinho).
5. **Clique em Deploy**:
   - O Easypanel vai baixar o código, rodar o `npm install`, executar o `npm run build`, colocar os arquivos compilados no servidor Nginx ultra-leve e ativar o site com HTTPS.

---

### OPÇÃO B: GitHub Pages (Sem Custo de Servidor)

Como você já usa o GitHub Pages, nós criamos o arquivo de automação `.github/workflows/deploy.yml` no projeto.

#### Passo a Passo no GitHub Pages:
1. **Envie os arquivos para o repositório GitHub**:
   - Garanta que a pasta `.github/workflows/deploy.yml` foi enviada.
2. **Ative o GitHub Actions no GitHub Pages**:
   - No GitHub, acesse seu repositório -> **Settings** -> **Pages**.
   - Em **Build and deployment** -> **Source**, mude de "Deploy from a branch" para:
     👉 **GitHub Actions**
3. **Configure o Domínio Personalizado**:
   - Ainda na aba **Pages**, no campo **Custom domain**, digite:
     `simulador.multilagos.com.br`
   - Clique em **Save**.
   - Marque a caixa **Enforce HTTPS**.
4. **Pronto!**:
   - A cada alteração ou push no repositório, o GitHub vai compilar e publicar o simulador automaticamente.

---

### 3. Configuração de DNS (Apontamento do subdomínio `simulador.multilagos.com.br`)

Onde você gerencia o domínio `multilagos.com.br` (no painel da Hostinger, Cloudflare ou Registro.br), crie uma nova entrada DNS:

#### Se for usar o Easypanel (Hostinger VPS):
- **Tipo**: `A`
- **Nome / Host**: `simulador`
- **Valor / Aponta para**: `IP_DA_SUA_VPS` (o IP da sua máquina Hostinger)
- **TTL**: `3600` (ou padrão)

#### Se for usar o GitHub Pages:
- **Tipo**: `CNAME`
- **Nome / Host**: `simulador`
- **Valor / Aponta para**: `SEU_USUARIO.github.io` (onde seu_usuario é o seu usuário/organização no GitHub)
- **TTL**: `3600`

---

### 4. Como Rodar e Testar no seu Computador (Localhost)

Se você quiser testar no seu computador:
1. Instale o [Node.js](https://nodejs.org) (versão 20 LTS ou superior).
2. Extraia o ZIP em uma pasta.
3. Abra o terminal (PowerShell, Prompt de Comando ou Terminal do Mac/Linux) dentro dessa pasta.
4. Execute:
   ```bash
   npm install
   npm run dev
   ```
5. Abra no navegador o endereço indicado (ex: `http://localhost:3000`).

---

### 5. Resumo das Melhorias Recentes Implementadas no Sistema
- ✅ **Anotações ou Obs.**: Caixa de texto livre para anotações do consultor adicionada tanto no Diagnóstico quanto no Simulador de Proposta.
- ✅ **Download de PDFs 100% Ajustado**: Ao confirmar a assinatura digital, o sistema agora faz exatamente **1 download da Proposta Comercial + 1 download do Contrato Mestre (total 2 arquivos)**, com travas anti-clique duplo e proteção de concorrência.
- ✅ **Grade de Planos Completa**: Restaurada com a visualização de todos os itens de escopo, badges, investimento e personalização dinâmica de adicionais.
- ✅ **Arquivos de Produção Prontos**: `Dockerfile`, `nginx.conf` e `.github/workflows/deploy.yml` incluídos.
