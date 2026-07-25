const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const failures = [];

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    failures.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function checkFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`Missing file: ${relativePath}`);
  }
}

function walk(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

const app = readJson('app.json');
if (app) {
  for (const page of app.pages ?? []) {
    for (const extension of ['.js', '.wxml', '.wxss']) {
      checkFile(`${page}${extension}`);
    }
  }
  for (const subpackage of app.subpackages ?? []) {
    for (const page of subpackage.pages ?? []) {
      const base = path.posix.join(subpackage.root, page);
      for (const extension of ['.js', '.wxml', '.wxss']) {
        checkFile(`${base}${extension}`);
      }
    }
  }
}

const project = readJson('project.config.json');
if (project) {
  const ignoredFolders = new Set(
    (project.packOptions?.ignore ?? [])
      .filter((item) => item.type === 'folder')
      .map((item) => item.value),
  );
  for (const folder of ['admin-web', 'api-server', 'packages', 'infra', 'node_modules']) {
    if (!ignoredFolders.has(folder)) failures.push(`Upload ignore missing: ${folder}`);
  }
}

const scriptDirectories = [
  'config',
  'data',
  'pages/official',
  'services/official',
  'utils',
];
for (const file of scriptDirectories.flatMap(walk).filter((item) => item.endsWith('.js'))) {
  try {
    new vm.SourceTextModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      identifier: file,
    });
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

const apiConfigPath = path.join(root, 'config/officialApi.js');
if (fs.existsSync(apiConfigPath)) {
  const content = fs.readFileSync(apiConfigPath, 'utf8');
  if (!/API_BASE_URL\s*=\s*['"]https?:\/\//.test(content)) {
    failures.push('config/officialApi.js: API_BASE_URL must use http or https');
  }
  for (const key of ['LEAD_DATA_SOURCE', 'CONTENT_DATA_SOURCE', 'PRODUCT_DATA_SOURCE']) {
    if (!new RegExp(`${key}\\s*=\\s*['"](?:api|mock)['"]`).test(content)) {
      failures.push(`config/officialApi.js: invalid ${key}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Mini program validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Mini program validation passed.');
