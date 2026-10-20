import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createProjectZip() {
  const zip = new JSZip();
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const ignoreDirs = new Set(['node_modules', '.git', '.aistudio', 'public']);
  const ignoreFiles = new Set(['.DS_Store', 'simulador-multilagos-completo.zip']);

  function addDirToZip(currentDir, relativePath = '') {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.gitignore') {
        continue;
      }
      if (ignoreFiles.has(entry.name)) continue;

      const fullPath = path.join(currentDir, entry.name);
      const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        addDirToZip(fullPath, entryRelPath);
      } else if (entry.isFile()) {
        const fileData = fs.readFileSync(fullPath);
        zip.file(entryRelPath, fileData);
      }
    }
  }

  console.log('Adicionando arquivos do projeto ao ZIP...');
  addDirToZip(rootDir);

  console.log('Gerando arquivo ZIP oficial...');
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const zipPath = path.join(publicDir, 'simulador-multilagos-completo.zip');
  fs.writeFileSync(zipPath, content);
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'simulador-multilagos-completo.zip'), content);
  }
  console.log(`ZIP criado com sucesso em: ${zipPath} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
}

createProjectZip().catch((err) => {
  console.error('Erro ao gerar ZIP:', err);
  process.exit(1);
});
