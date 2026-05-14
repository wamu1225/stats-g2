// stats-app/scripts/validate-data.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const filesToWatch = ['src/data/modules.ts', 'src/data/glossary.ts'];
let errors = [];

// Supported interactive types (Must match InteractiveGraph.tsx)
const validInteractiveTypes = [
  'normal', 't', 'chi2', 'f', 'pca', 'regression', 'logistic', 'mcmc', 'gibbs', 'update', 'overfit', 'outlier', 'multico', 'skewkurt'
];

const mathKeywords = [
  'xrightarrow', 'chi', 'sigma', 'mu', 'alpha', 'beta', 'theta', 'gamma', 'lambda', 'epsilon', 'phi', 'pi',
  'frac', 'sqrt', 'exp', 'log', 'sum', 'prod', 'int', 'infty', 'partial', 'nabla', 'propto',
  'pm', 'mp', 'le', 'ge', 'ne', 'approx', 'sim', 'equiv', 'dots', 'ldots', 'cdots', 'quad', 'qquad',
  'text', 'mathbf', 'mathbb', 'mathcal'
];

const bareSymbols = ['σ', 'μ', 'χ', '±', 'ρ', 'θ', 'λ', 'ε', 'π'];

function checkFile(filePath) {
  const fullPath = path.join(root, filePath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Syntax Integrity: Backtick count
  const backtickCount = (raw.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    errors.push(`[Critical] Unterminated template literal (backtick \`) found in ${filePath}. Count: ${backtickCount}`);
  }

  // 2. Single backslash check
  mathKeywords.forEach(word => {
    const regex = new RegExp(`(?<!\\\\)\\\\${word}\\b`, 'gi');
    if (regex.test(raw)) {
      errors.push(`[Error] Single backslash for '${word}' in ${filePath}. Use \\\\\\\\.`);
    }
  });

  // 3. Quiz count check
  if (filePath.includes('modules.ts')) {
    // Split on module-level id fields only (not quiz question ids).
    // Module IDs appear at object top level: "  id: '1.1-foo'" with chapter/content nearby.
    // Quiz question IDs like "{ id: '1.1-q1', question:" are nested inside quiz arrays.
    // Strategy: split on id fields that are followed by a chapter field within the next 300 chars.
    const moduleChunks = raw.split(/\{\s*\n\s*id:\s*['"`]/).slice(1);
    moduleChunks.forEach((chunk, i) => {
      const idMatch = chunk.match(/^([^'"`]+)/);
      const id = idMatch ? idMatch[1] : `Module ${i+1}`;
      // Skip quiz question chunks (they don't have a 'chapter:' field)
      if (!chunk.includes('chapter:')) return;
      if (!chunk.includes('placeholder10')) {
        // Count quiz question entries by counting { id: 'xxx-qN' patterns
        const questionCount = (chunk.match(/\{\s*id:\s*['"`][^'"`]+-q\d+['"`]/g) || []).length;
        if (questionCount !== 10) {
          errors.push(`[Error] ${id} has ${questionCount} questions (Required: 10).`);
        }
      }
    });
  }

  const lines = raw.split('\n');
  let isInContent = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Toggle isInContent when encountering a backtick
    if (trimmed.includes('`')) {
      // If it's a property like content: `... or quiz: [ `...
      if (trimmed.includes('content:') || trimmed.includes('explanation:') || trimmed.includes('question:') || trimmed.includes('options:')) {
        isInContent = true;
      } else {
        isInContent = false;
      }
    }

    if (!isInContent) return;

    // Inside content block checks
    const contentLine = line.replace(/^\s*(content|explanation|question|options):\s*`/, '').replace(/`,?$/, '');
    const trimmedContent = contentLine.trim();

    // 4. Bare Math Symbols (outside $ $)
    const parts = contentLine.split('$');
    for (let i = 0; i < parts.length; i += 2) {
      const outsideText = parts[i];
      bareSymbols.forEach(sym => {
        if (outsideText.includes(sym)) {
          errors.push(`[Error] Bare math symbol '${sym}' outside $ $ at ${filePath}:${lineNum}`);
        }
      });
      
      mathKeywords.forEach(word => {
        const regex = new RegExp(`(?<!\\\\)\\b${word}\\b`, 'gi');
        if (regex.test(outsideText)) {
          if (['much', 'mutation', 'fraction', 'logical', 'logic'].includes(word.toLowerCase())) return;
          errors.push(`[Error] Naked math keyword '${word}' outside $ $ at ${filePath}:${lineNum}`);
        }
      });
    }

    // 5. Unpaired $
    if ((contentLine.match(/\$/g) || []).length % 2 !== 0) {
      errors.push(`[Error] Unpaired '$' symbol at ${filePath}:${lineNum}`);
    }

    // 6. Supported Markdown Check
    if (trimmedContent.startsWith('#')) {
      if (!trimmedContent.match(/^#+\s/)) {
        errors.push(`[Error] Missing space after '#' heading marker at ${filePath}:${lineNum}`);
      }
      if (!trimmedContent.startsWith('##')) {
        errors.push(`[Error] Unsupported single '#' heading at ${filePath}:${lineNum}. Use '##' or '###'.`);
      }
      // Check for blank line before header (excluding first line of content)
      if (index > 0) {
        const prevLine = lines[index-1];
        const prevTrimmed = prevLine.trim();
        // A header MUST be preceded by an empty line, a horizontal rule, or the start of a template literal
        if (prevTrimmed !== '' && !prevTrimmed.startsWith('---') && !prevTrimmed.includes('`')) {
          errors.push(`[Error] Markdown syntax error: Header must be preceded by a blank line at ${filePath}:${lineNum}. Found: "${prevTrimmed}"`);
        }
      }
    }
    if (trimmed.startsWith('-') && !trimmed.startsWith('- ') && !trimmed.startsWith('---')) {
      // Allow negative numbers and mathematical expressions (e.g. -1, -(x-mu))
      const isMath = /^-\d/.test(trimmed) || /^-[\$\\(\[]/.test(trimmed);
      if (!isMath) {
        errors.push(`[Error] Missing space after '-' list marker at ${filePath}:${lineNum}. Found: "${trimmed}"`);
      }
    }
    if (trimmed.startsWith('>') && !trimmed.startsWith('💡')) {
      errors.push(`[Error] Unsupported blockquote '>' at ${filePath}:${lineNum}. Use '💡' for callouts.`);
    }

    // 7. Interactive Tag Validation
    const interactiveMatches = line.match(/\[\[interactive:(.*?)\]\]/g);
    if (interactiveMatches) {
      interactiveMatches.forEach(tag => {
        const typeMatch = tag.match(/\[\[interactive:(.*?)\]\]/);
        if (typeMatch && !validInteractiveTypes.includes(typeMatch[1])) {
          errors.push(`[Error] Unsupported interactive type '${typeMatch[1]}' at ${filePath}:${lineNum}`);
        }
      });
    }
    const legacyTags = ['[[mcmc]]', '[[update]]', '[[gibbs]]', '[[overfit]]', '[[outlier]]', '[[multico]]'];
    legacyTags.forEach(tag => {
      if (line.includes(tag)) {
        errors.push(`[Error] Legacy tag '${tag}' found at ${filePath}:${lineNum}. Use [[interactive:${tag.slice(2, -2)}]].`);
      }
    });
  });
}

// ── Deployed ID removal check ──────────────────────
// Once a module ID is deployed and indexed by Google, removing it creates a 404.
// This check prevents accidental removal by comparing against the committed record.
function checkDeployedIds() {
  const deployedIdsPath = path.join(__dirname, 'deployed-ids.json');
  if (!fs.existsSync(deployedIdsPath)) return; // first deploy: no record yet

  const { ids: deployedIds } = JSON.parse(fs.readFileSync(deployedIdsPath, 'utf8'));
  const raw = fs.readFileSync(path.join(root, 'src/data/modules.ts'), 'utf8');

  // Extract module IDs (not quiz IDs like 1.1-q1)
  const currentIds = new Set(
    [...raw.matchAll(/\{id:`([0-9]+\.[0-9]+[a-z]?-(?!q\d)[^`]+)`/g)].map(m => m[1])
  );

  for (const id of deployedIds) {
    if (!currentIds.has(id)) {
      errors.push(
        `[Critical] Module ID "${id}" was in deployed-ids.json but is now missing from modules.ts.\n` +
        `  → Removing a deployed ID creates a 404 for Google-indexed pages.\n` +
        `  → If this rename is intentional: add a legacyRedirects entry in prerender.ts,\n` +
        `    then remove "${id}" from scripts/deployed-ids.json.`
      );
    }
  }
}

console.log('--- Data Integrity Validation ---');
checkDeployedIds();
filesToWatch.forEach(checkFile);

if (errors.length > 0) {
  console.error('\n❌ VALIDATION FAILED!\n');
  [...new Set(errors)].forEach(err => console.error(err));
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! The data is clean.\n');
  process.exit(0);
}
