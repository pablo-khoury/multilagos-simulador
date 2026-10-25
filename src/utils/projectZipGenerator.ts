import JSZip from 'jszip';

// Vite inlines all source files as raw text strings at build time
const rawSources = import.meta.glob(
  [
    '/src/**/*',
    '/index.html',
    '/package.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/Dockerfile',
    '/nginx.conf',
    '/README-PRODUCAO.md',
    '/metadata.json',
    '/firebase-applet-config.json',
    '/scripts/generate-zip.js',
  ],
  { query: '?raw', eager: true, import: 'default' }
) as Record<string, string>;

/**
 * Generates a complete, ready-to-push Git repository ZIP containing 100% of the project files.
 */
export async function generateFullProjectZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Add all source files, components, documents, configs
  for (const [filepath, content] of Object.entries(rawSources)) {
    // Skip binary files that may not be raw strings or the zip itself
    if (typeof content !== 'string') continue;
    if (filepath.endsWith('.zip') || filepath.endsWith('.jpg') || filepath.endsWith('.png')) continue;

    // Normalize path by removing leading slash
    const cleanPath = filepath.startsWith('/') ? filepath.slice(1) : filepath;
    zip.file(cleanPath, content);
  }

  // 2. Add .gitignore
  zip.file(
    '.gitignore',
    `node_modules/\ndist/\nbuild/\ncoverage/\n*.log\n*.zip\n.DS_Store\n.env\n.env.local\n!.env.example\n`
  );

  // 3. Add .env.example
  zip.file(
    '.env.example',
    `# GEMINI_API_KEY: Required for Gemini AI API calls.\nGEMINI_API_KEY="MY_GEMINI_API_KEY"\nAPP_URL="http://localhost:3000"\n\n# OPÇÃO A (RECOMENDADA - 24H SEM EXPIRAR): URL do Web App Google Apps Script\nVITE_GOOGLE_WEBHOOK_URL=""\n\n# OPÇÃO B: FIREBASE / GOOGLE WORKSPACE OAUTH CONFIGURATION (Easypanel/Servidor Próprio)\nVITE_FIREBASE_API_KEY=""\nVITE_FIREBASE_AUTH_DOMAIN=""\nVITE_FIREBASE_PROJECT_ID=""\nVITE_FIREBASE_STORAGE_BUCKET=""\nVITE_FIREBASE_MESSAGING_SENDER_ID=""\nVITE_FIREBASE_APP_ID=""\nVITE_FIREBASE_OAUTH_CLIENT_ID=""\n`
  );

  // 4. Add comprehensive README for Git and Deployment
  zip.file(
    'README.md',
    `# Multilagos - Simulador Comercial & Aceite Digital

Plataforma oficial da Multilagos (Negócios & Tecnologia) para diagnóstico financeiro empresarial, esteiras de cobrança Asaas, réguas automatizadas via WhatsApp (N8N) e aceite digital com geração de PDF e sincronização com Google Workspace.

## 🚀 Como Executar Localmente

\`\`\`bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build
\`\`\`

## 📦 Como Subir para o GitHub

\`\`\`bash
git init
git add .
git commit -m "feat: projeto simulador multilagos completo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
\`\`\`

## 🐳 Deploy via Docker / Easypanel

O projeto inclui \`Dockerfile\` e \`nginx.conf\` otimizados para deploy direto no Easypanel, Coolify, VPS ou Cloud Run.
`
  );

  // 5. Try fetching the 2 JPG images if possible to include them in the zip
  try {
    const imgUrls = [
      '/src/assets/images/MULTILAGOS_Completo_fundo_escuro.svg',
      '/src/assets/images/MULTILAGOS_Completo_fundo_branco.svg',
      '/src/assets/images/executive_consulting_1790783949020.jpg',
      '/src/assets/images/hero_tech_business_1790783939623.jpg',
    ];

    for (const url of imgUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const cleanPath = url.startsWith('/') ? url.slice(1) : url;
          zip.file(cleanPath, blob);
        }
      } catch {
        // Continue if single asset fails
      }
    }
  } catch {
    // Continue
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}
