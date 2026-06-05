import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const cwd = process.cwd();
const nextDir = path.join(cwd, '.next');
const staticChunksDir = path.join(nextDir, 'static', 'chunks');
const appBuildManifestPath = path.join(nextDir, 'app-build-manifest.json');

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function gzipSize(bytes) {
  return zlib.gzipSync(bytes).length;
}

function summarizeChunkSizes() {
  if (!fs.existsSync(staticChunksDir)) {
    throw new Error('No .next/static/chunks directory found. Run `npm run build` first.');
  }

  const entries = fs.readdirSync(staticChunksDir, { withFileTypes: true });
  const jsFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));
  const chunkStats = jsFiles.map((entry) => {
    const filePath = path.join(staticChunksDir, entry.name);
    const buffer = fs.readFileSync(filePath);
    return {
      file: entry.name,
      rawBytes: buffer.length,
      gzipBytes: gzipSize(buffer),
    };
  });

  const totalRaw = chunkStats.reduce((sum, entry) => sum + entry.rawBytes, 0);
  const totalGzip = chunkStats.reduce((sum, entry) => sum + entry.gzipBytes, 0);

  return {
    files: chunkStats.sort((a, b) => b.gzipBytes - a.gzipBytes),
    totalRaw,
    totalGzip,
  };
}

function summarizeRoutes() {
  if (!fs.existsSync(appBuildManifestPath)) {
    return [];
  }

  const manifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
  const pages = manifest.pages || {};
  return Object.entries(pages)
    .map(([route, files]) => ({ route, files: Array.isArray(files) ? files.length : 0 }))
    .sort((a, b) => a.route.localeCompare(b.route));
}

try {
  const chunkSummary = summarizeChunkSizes();
  const routes = summarizeRoutes();

  console.log('Communium performance audit');
  console.log('===========================');
  console.log(`Total JS chunks (raw): ${formatKb(chunkSummary.totalRaw)}`);
  console.log(`Total JS chunks (gzip): ${formatKb(chunkSummary.totalGzip)}`);
  console.log(`Target initial JS budget (gzip): 250.0 KB`);
  console.log(chunkSummary.totalGzip <= 250 * 1024 ? 'Status: within target budget' : 'Status: over target budget');
  console.log('');
  console.log('Largest JS chunks (gzip)');
  console.log('------------------------');

  chunkSummary.files.slice(0, 12).forEach((file) => {
    console.log(`${file.file}: ${formatKb(file.gzipBytes)} gzip / ${formatKb(file.rawBytes)} raw`);
  });

  if (routes.length) {
    console.log('');
    console.log('App routes discovered');
    console.log('---------------------');
    routes.forEach((entry) => {
      console.log(`${entry.route} -> ${entry.files} manifest entries`);
    });
  }

  console.log('');
  console.log('Recommended follow-ups');
  console.log('----------------------');
  console.log('- Run Lighthouse mobile against the built app for LCP/CLS validation.');
  console.log('- Keep large member/public surfaces split by route and lazy-load heavy media.');
  console.log('- Review oversized chunks above if the gzip budget is exceeded.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Performance audit failed.');
  process.exit(1);
}
