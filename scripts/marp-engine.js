const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

function findInBases(pkg) {
  const bases = new Set();

  if (require.main && require.main.filename) {
    let p = path.dirname(require.main.filename);
    while (p && p !== path.dirname(p)) {
      bases.add(p);
      p = path.dirname(p);
    }
  }

  let d = __dirname;
  while (d && d !== path.dirname(d)) {
    bases.add(d);
    d = path.dirname(d);
  }

  for (const base of bases) {
    const candidate = path.join(base, 'node_modules', ...pkg.split('/'));
    if (fs.existsSync(candidate)) {
      try { return require(candidate); } catch (_) {}
    }
  }

  return null;
}

function loadMarpCore() {
  try { return require('@marp-team/marp-core'); } catch (_) {}
  const m = findInBases('@marp-team/marp-core');
  if (m) return m;
  throw new Error(
    "Cannot resolve '@marp-team/marp-core'. Install it locally with: npm i -D @marp-team/marp-core"
  );
}

function loadHljs() {
  try { return require('highlight.js'); } catch (_) {}
  return findInBases('highlight.js');
}

const { Marp } = loadMarpCore();
const hljs = loadHljs();

const AR_KATEX_MACROS = {
  // Operadores AR base (uso natural: \Proj_{...}, \Sel_{...}, \Group^{...}_{...})
  '\\Proj': '\\mathop{\\Large\\Pi}\\limits',
  '\\Sel': '\\mathop{\\Large\\sigma}\\limits',
  '\\Ren': '\\mathop{\\Large\\rho}\\limits',
  '\\Group': '\\mathop{\\Large\\Upsilon}\\limits',

  // Atajos opcionales (si quieres pasar argumentos directos)
  '\\ProjBy': '\\mathop{\\Large\\Pi}\\limits_{#1}',
  '\\SelBy': '\\mathop{\\Large\\sigma}\\limits_{#1}',
  '\\RenBy': '\\mathop{\\Large\\rho}\\limits_{#1}',
  '\\GroupBy': '\\mathop{\\Large\\Upsilon}\\limits_{#1}',
  '\\GroupAgg': '\\mathop{\\Large\\Upsilon}\\limits^{#1}_{#2}',
  '\\GroupUp': '\\mathop{\\Large\\Upsilon}\\limits^{#1}',
  '\\GroupDown': '\\mathop{\\Large\\Upsilon}\\limits_{#1}',

  // Joins y conjuntos
  '\\JoinR': '\\mathbin{\\Large\\bowtie}',
  '\\JoinBy': '\\mathbin{\\mathop{\\Large\\bowtie}\\limits_{#1}}',
  '\\NatJoin': '\\mathbin{\\Large\\bowtie}',
  '\\Union': '\\mathbin{\\Large\\cup}',
  '\\Inter': '\\mathbin{\\Large\\cap}',
};

function buildMathOptions(inputMath) {
  const base = {
    lib: 'katex',
    katexOption: {
      throwOnError: false,
      strict: 'ignore',
      macros: AR_KATEX_MACROS,
    },
  };

  // Si viene desactivado explícitamente, respetarlo.
  if (inputMath === false) return false;
  if (inputMath === true || inputMath === undefined) return base;
  if (inputMath === 'katex' || inputMath === 'mathjax') return inputMath;

  // Merge suave si marp-cli pasa opciones de math.
  if (typeof inputMath === 'object' && inputMath !== null) {
    const inKatex = inputMath.katexOption || {};
    const inMacros = inKatex.macros || {};

    return {
      ...base,
      ...inputMath,
      katexOption: {
        ...base.katexOption,
        ...inKatex,
        macros: {
          ...AR_KATEX_MACROS,
          ...inMacros,
        },
      },
    };
  }

  return base;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightMr(code) {
  const tokenPattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:PK|AK|FK)\b|\bnull\b|[(){}])/gi;
  const relationPattern = /^(\s*)([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ]*)(\s*=.*)$/;
  const lines = code.split('\n');
  const highlightTokens = (text) => {
    let out = '';
    let lastIndex = 0;

    for (const match of text.matchAll(tokenPattern)) {
      const token = match[0];
      const index = match.index ?? 0;

      out += escapeHtml(text.slice(lastIndex, index));

      let cls = '';
      if (/^['"]/.test(token)) cls = 'mr-string';
      else if (/^(PK|AK|FK)$/i.test(token)) cls = 'mr-keyword';
      else if (/^null$/i.test(token)) cls = 'mr-null';
      else if (/^[{}]$/.test(token)) cls = 'mr-brace';
      else cls = 'mr-paren';

      out += `<span class="${cls}">${escapeHtml(token)}</span>`;
      lastIndex = index + token.length;
    }

    out += escapeHtml(text.slice(lastIndex));
    return out;
  };

  const rendered = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('--')) {
      return `<span class="mr-comment">${escapeHtml(line)}</span>`;
    }

    const relationMatch = line.match(relationPattern);
    if (relationMatch) {
      const [, indent, name, rest] = relationMatch;
      return `${escapeHtml(indent)}<span class="mr-relation">${escapeHtml(name)}</span>${highlightTokens(rest)}`;
    }

    return highlightTokens(line);
  });

  return rendered.join('\n');
}

function splitTopLevel(text, separator = ',') {
  const parts = [];
  let current = '';
  let quote = '';
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = text[i - 1];

    if (quote) {
      current += ch;
      if (ch === quote && prev !== '\\') quote = '';
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') depth += 1;
    if (ch === ')' || ch === '}' || ch === ']') depth = Math.max(0, depth - 1);

    if (ch === separator && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function stripOuterQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function cleanMrAttribute(raw) {
  return raw
    .trim()
    .replace(/^(PK|AK|FK)\s+/i, '')
    .replace(/\s+(PK|AK|FK)$/i, '')
    .replace(/\s+/g, ' ');
}

function splitMrLineComment(line) {
  let quote = '';

  for (let i = 0; i < line.length - 1; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    const prev = line[i - 1];

    if (quote) {
      if (ch === quote && prev !== '\\') quote = '';
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '-' && next === '-') {
      return {
        code: line.slice(0, i).trimEnd(),
        comment: line.slice(i + 2).trim(),
      };
    }
  }

  return { code: line, comment: '' };
}

function isMrStructuralComment(comment) {
  return /^(intensión|extension|extensión)\b/i.test(comment.replace(/-+$/g, '').trim());
}

function relationByName(relations, name, knownSchemas = null) {
  let relation = relations.find((candidate) => candidate.name === name);
  if (!relation) {
    const known = knownSchemas && knownSchemas[name];
    relation = {
      name,
      attributes: known ? [...known.attributes] : [],
      rows: [],
      constraints: known ? [...known.constraints] : [],
      comments: [],
    };
    relations.push(relation);
  }
  return relation;
}

function parseMrConstraint(line) {
  const match = line.trim().match(/^(PK|AK|FK)\s*\(([^)]*)\)\s*(?:\/\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ]*))?\s*$/i);
  if (!match) return null;

  const [, kind, attrs, target] = match;
  const normalizedKind = kind.toUpperCase();
  const normalizedAttrs = splitTopLevel(attrs).join(', ');
  return target
    ? `${normalizedKind}(${normalizedAttrs}) / ${target}`
    : `${normalizedKind}(${normalizedAttrs})`;
}

function parseMrRows(body) {
  const rows = [];
  const tuplePattern = /\(([^()]*)\)/g;

  for (const match of body.matchAll(tuplePattern)) {
    rows.push(splitTopLevel(match[1]).map(stripOuterQuotes));
  }

  if (rows.length > 0 && /\.\.\./.test(body)) {
    const ellipsisRow = [];
    ellipsisRow.ellipsis = true;
    rows.push(ellipsisRow);
  }

  return rows;
}

function collectMrAssignment(lines, startIndex, firstLine) {
  const first = splitMrLineComment(firstLine);
  const match = first.code.trim().match(/^([^={}]+?)\s*=\s*\{(.*)$/);
  if (!match) return null;

  const [, namePart, firstBody] = match;
  const name = namePart.trim();
  if (!name) return null;

  const bodyLines = [];
  const comments = [];
  let body = firstBody;
  let endIndex = startIndex;
  if (first.comment && !isMrStructuralComment(first.comment)) comments.push(first.comment);

  while (true) {
    const close = body.indexOf('}');
    if (close >= 0) {
      bodyLines.push(body.slice(0, close));
      break;
    }

    bodyLines.push(body);
    endIndex += 1;
    if (endIndex >= lines.length) return null;
    const line = splitMrLineComment(lines[endIndex]);
    body = line.code;
    if (line.comment && !isMrStructuralComment(line.comment)) comments.push(line.comment);
  }

  return {
    name,
    body: bodyLines.join('\n').trim(),
    comments,
    endIndex,
  };
}

function parseMr(code, knownSchemas = null) {
  const relations = [];
  const lines = code.split('\n');
  let currentRelation = null;
  let pendingComments = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineParts = splitMrLineComment(line);
    const trimmed = lineParts.code.trim();

    if (!trimmed) {
      if (lineParts.comment && !isMrStructuralComment(lineParts.comment)) {
        if (currentRelation) {
          currentRelation.comments.push(lineParts.comment);
        } else {
          pendingComments.push(lineParts.comment);
        }
      }
      continue;
    }

    const assignment = collectMrAssignment(lines, i, line);
    if (assignment) {
      const rows = parseMrRows(assignment.body);
      const relation = relationByName(relations, assignment.name, knownSchemas);
      if (rows.length > 0) {
        relation.rows = rows;
      } else {
        relation.attributes = splitTopLevel(assignment.body).map(cleanMrAttribute).filter(Boolean);
        relation.rows = [];
        relation.constraints = [];
        relation.comments = [];
      }
      relation.comments.push(...pendingComments, ...assignment.comments);
      pendingComments = [];
      currentRelation = relation;
      i = assignment.endIndex;
      continue;
    }

    const constraint = parseMrConstraint(trimmed);
    if (constraint && currentRelation) {
      currentRelation.constraints.push(constraint);
      if (lineParts.comment && !isMrStructuralComment(lineParts.comment)) {
        currentRelation.comments.push(lineParts.comment);
      }
      continue;
    }

    return null;
  }

  const valid = relations.filter((relation) => relation.name && relation.attributes.length > 0);
  return valid.length > 0 ? valid : null;
}

function mrConstraintAttrs(constraint, kind) {
  const match = constraint.match(new RegExp(`^${kind}\\(([^)]*)\\)`, 'i'));
  return match ? splitTopLevel(match[1]) : [];
}

function mrAttributeKey(attribute) {
  return attribute.replace(/\s+null$/i, '').trim();
}

function mrAttributeClasses(relation, attribute) {
  const attr = mrAttributeKey(attribute);
  const pkAttrs = relation.constraints.flatMap((constraint) => mrConstraintAttrs(constraint, 'PK'));
  const fkAttrs = relation.constraints.flatMap((constraint) => mrConstraintAttrs(constraint, 'FK'));
  const classes = [];

  if (pkAttrs.includes(attr)) classes.push('mr-pk-col');
  if (fkAttrs.includes(attr)) classes.push('mr-fk-col');
  return classes.join(' ');
}

function renderMrCell(value, className = '') {
  const trimmed = String(value).trim();
  const classes = className ? [className] : [];
  if (/^null$/i.test(trimmed)) classes.push('mr-null');
  const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
  return `<td${cls}>${escapeHtml(trimmed)}</td>`;
}

function renderMrConstraint(constraint) {
  const match = constraint.match(/^(PK|AK|FK)(\(.*)$/);
  if (!match) return escapeHtml(constraint);

  const [, kind, rest] = match;
  return `<span class="mr-constraint-kind mr-constraint-${kind.toLowerCase()}">${kind}</span>${escapeHtml(rest)}`;
}

function renderMrTable(relation) {
  const colCount = Math.max(1, relation.attributes.length);
  const constraints = [...new Set(relation.constraints)];
  const headerCells = relation.attributes
    .map((attr) => {
      const className = mrAttributeClasses(relation, attr);
      const cls = className ? ` class="${className}"` : '';
      return `<th${cls}>${escapeHtml(attr)}</th>`;
    })
    .join('');
  const bodyRows = relation.rows
    .map((row) => {
      if (row.ellipsis) {
        return `<tr class="mr-ellipsis"><td colspan="${colCount}">...</td></tr>`;
      }

      const cells = relation.attributes.map((attr, index) => {
        const className = mrAttributeClasses(relation, attr);
        return renderMrCell(row[index] ?? '', className);
      });
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');
  const comments = [...new Set(relation.comments || [])];
  const footItems = [
    ...constraints.map((constraint) => `<div class="mr-constraint">${renderMrConstraint(constraint)}</div>`),
    ...comments.map((comment) => `<div class="mr-comment">${escapeHtml(comment)}</div>`),
  ].join('');
  const notesRow = footItems
    ? `<tr class="mr-notes"><td colspan="${colCount}">${footItems}</td></tr>`
    : '';

  return [
    '<figure class="mr-relation-block">',
    '<table class="mr-table">',
    '<thead>',
    `<tr class="mr-relation-name"><th colspan="${colCount}">${escapeHtml(relation.name)}</th></tr>`,
    notesRow,
    `<tr class="mr-intension">${headerCells}</tr>`,
    '</thead>',
    bodyRows ? `<tbody>${bodyRows}</tbody>` : '',
    '</table>',
    '</figure>',
  ].join('');
}

function rememberMrSchemas(relations, knownSchemas) {
  if (!knownSchemas) return;

  for (const relation of relations) {
    if (relation.attributes.length === 0) continue;

    knownSchemas[relation.name] = {
      attributes: [...relation.attributes],
      constraints: [...new Set(relation.constraints)],
    };
  }
}

function renderMr(code, knownSchemas = null) {
  const relations = parseMr(code, knownSchemas);
  if (!relations) return null;

  rememberMrSchemas(relations, knownSchemas);
  return `<div class="mr-relations">${relations.map(renderMrTable).join('')}</div>`;
}

function codeFontClassFromInfo(info) {
  const parts = (info || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const flags = new Set(parts.slice(1));
  if (flags.has('jetbrains') || flags.has('jb')) return ' code-font-jetbrains';
  if (flags.has('default') || flags.has('consolas')) return ' code-font-default';
  return '';
}

function preprocessColumnMarkers(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let inFence = false;
  let fenceChar = '';
  let openCol = null;

  const closeCol = () => {
    if (openCol) {
      out.push('</div>');
      out.push('');
      openCol = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(```+|~~~+)/);
    if (fenceMatch) {
      const ch = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (ch === fenceChar) {
        inFence = false;
        fenceChar = '';
      }
      out.push(line);
      continue;
    }

    if (!inFence) {
      if (/^\*\*\*\s+(left|izq(?:uierda)?)\s+\*\*\*$/i.test(trimmed)) {
        closeCol();
        out.push('<div class="col left">');
        out.push('');
        openCol = 'left';
        continue;
      }

      if (/^\*\*\*\s+(right|rigut|der(?:echa)?)\s+\*\*\*$/i.test(trimmed)) {
        closeCol();
        out.push('<div class="col right">');
        out.push('');
        openCol = 'right';
        continue;
      }

      if (/^\*\*\*\s+(center|centro)\s+\*\*\*$/i.test(trimmed)) {
        closeCol();
        out.push('<div class="col center">');
        out.push('');
        openCol = 'center';
        continue;
      }

      // Si empieza nueva slide, cerrar columna para no romper el separador `---`.
      if (/^---\s*$/.test(trimmed)) {
        closeCol();
        out.push(line);
        continue;
      }
    }

    out.push(line);
  }

  closeCol();
  return out.join('\n');
}

function preprocessVAlignBody(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let inFence = false;
  let fenceChar = '';
  let inFrontMatter = lines.length > 0 && lines[0].trim() === '---';
  let frontMatterDelims = inFrontMatter ? 1 : 0;

  let slideClass = '';
  let wrapThisSlide = false;
  let wrapperOpen = false;
  let h1Seen = false;

  const closeWrapper = () => {
    if (wrapperOpen) {
      out.push('</div>');
      out.push('');
      wrapperOpen = false;
    }
  };

  const resetSlide = () => {
    slideClass = '';
    wrapThisSlide = false;
    wrapperOpen = false;
    h1Seen = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    const fenceMatch = trimmed.match(/^(```+|~~~+)/);
    if (fenceMatch) {
      const ch = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (ch === fenceChar) {
        inFence = false;
        fenceChar = '';
      }
      out.push(line);
      continue;
    }

    if (inFrontMatter) {
      out.push(line);
      if (!inFence && trimmed === '---') {
        frontMatterDelims += 1;
        if (frontMatterDelims >= 2) inFrontMatter = false;
      }
      continue;
    }

    // Separador de diapositiva (fuera de bloques de código)
    if (!inFence && trimmed === '---') {
      closeWrapper();
      out.push(line);
      resetSlide();
      continue;
    }

    // Captura clase de slide para decidir si aplicar v-align al body
    if (!inFence) {
      const classMatch = line.match(/<!--\s*_class:\s*([^>]*)-->/);
      if (classMatch) {
        slideClass = classMatch[1].trim();
        const hasVAlign = /\bv-align\b/.test(slideClass);
        const isColumns = /\b(two-col|two-col-3-7|two-col-7-3|three-col)\b/.test(slideClass);
        wrapThisSlide = hasVAlign && !isColumns;
        out.push(line);
        continue;
      }
    }

    if (wrapThisSlide && !wrapperOpen) {
      if (/^#\s+/.test(trimmed)) {
        h1Seen = true;
        out.push(line);
        out.push('');
        out.push('<div class="v-body">');
        wrapperOpen = true;
        continue;
      }

      if (trimmed !== '' && !h1Seen) {
        out.push('<div class="v-body">');
        wrapperOpen = true;
        out.push(line);
        continue;
      }
    }

    if (wrapThisSlide && h1Seen && !wrapperOpen && trimmed !== '') {
      out.push('<div class="v-body">');
      wrapperOpen = true;
    }

    out.push(line);
  }

  closeWrapper();
  return out.join('\n');
}

function parseThemeRelDir(markdown) {
  if (typeof markdown !== 'string') return null;

  const frontMatter = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!frontMatter) return null;

  for (const line of frontMatter[1].split('\n')) {
    const match = line.match(/^\s*marp-theme-rel-dir\s*:\s*(.+?)\s*$/);
    if (!match) continue;

    const value = match[1].trim().replace(/^['"]|['"]$/g, '');
    return value || null;
  }

  return null;
}

function parseBooleanFrontMatter(markdown, key) {
  if (typeof markdown !== 'string') return null;

  const frontMatter = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!frontMatter) return null;

  const pattern = new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`);

  for (const line of frontMatter[1].split('\n')) {
    const match = line.match(pattern);
    if (!match) continue;

    const raw = match[1].trim().replace(/^['"]|['"]$/g, '').toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  }

  return null;
}

function guessMarkdownPathFromArgv() {
  for (let i = process.argv.length - 1; i >= 0; i -= 1) {
    const arg = process.argv[i];
    if (!arg || arg.startsWith('-')) continue;
    if (!/\.md(?:own)?$/i.test(arg)) continue;

    const resolved = path.resolve(process.cwd(), arg);
    if (fs.existsSync(resolved)) return resolved;
  }

  return null;
}

function buildThemeAssetBase(markdown) {
  const themeRelDir = parseThemeRelDir(markdown);
  if (!themeRelDir) return null;

  const assetMode = (process.env.MARP_THEME_ASSET_MODE || 'file').trim();
  const assetBaseOverride = (process.env.MARP_THEME_ASSET_BASE || '').trim();

  if (assetMode === 'relative') {
    return {
      mode: 'relative',
      css: path.posix.join(assetBaseOverride || themeRelDir, 'css'),
      fonts: path.posix.join(assetBaseOverride || themeRelDir, 'fonts'),
    };
  }

  const markdownPath = guessMarkdownPathFromArgv();
  if (!markdownPath) return null;

  const themeRoot = path.resolve(path.dirname(markdownPath), themeRelDir);
  return {
    mode: 'file',
    root: themeRoot,
    css: path.join(themeRoot, 'css'),
    fonts: path.join(themeRoot, 'fonts'),
  };
}

function absolutizeThemeAssetUrls(content, themeAssetBase) {
  if (!content || !themeAssetBase) return content;

  const cssAssetUrls = new Map([
    ['us-title-bg.png', themeAssetBase.mode === 'relative' ? path.posix.join(themeAssetBase.css, 'us-title-bg.png') : pathToFileURL(path.join(themeAssetBase.css, 'us-title-bg.png')).href],
    ['us-default-bg.png', themeAssetBase.mode === 'relative' ? path.posix.join(themeAssetBase.css, 'us-default-bg.png') : pathToFileURL(path.join(themeAssetBase.css, 'us-default-bg.png')).href],
    ['us-footer.png', themeAssetBase.mode === 'relative' ? path.posix.join(themeAssetBase.css, 'us-footer.png') : pathToFileURL(path.join(themeAssetBase.css, 'us-footer.png')).href],
  ]);

  let out = content;

  for (const [asset, fileUrl] of cssAssetUrls) {
    const escapedAsset = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(`url\\((['"])${escapedAsset}\\1\\)`, 'g'),
      `url("${fileUrl}")`
    );
    out = out.replace(new RegExp(`url\\(${escapedAsset}\\)`, 'g'), `url("${fileUrl}")`);
  }

  out = out.replace(
    /url\((['"])\.\.\/fonts\/([^'")]+)\1\)/g,
    (_, _quote, fontPath) =>
      `url("${
        themeAssetBase.mode === 'relative'
          ? path.posix.join(themeAssetBase.fonts, fontPath)
          : pathToFileURL(path.join(themeAssetBase.fonts, fontPath)).href
      }")`
  );
  out = out.replace(
    /url\(\.\.\/fonts\/([^'")]+)\)/g,
    (_, fontPath) =>
      `url("${
        themeAssetBase.mode === 'relative'
          ? path.posix.join(themeAssetBase.fonts, fontPath)
          : pathToFileURL(path.join(themeAssetBase.fonts, fontPath)).href
      }")`
  );

  return out;
}

function buildImageBoxInlineStyle(markdown) {
  const imageBox = parseBooleanFrontMatter(markdown, 'image-box');
  if (imageBox !== false) return null;

  return [
    '--iissi-image-box-border:0 solid transparent',
    '--iissi-image-box-radius:0px',
    '--iissi-image-box-padding:0px',
    '--iissi-image-inner-radius:0px',
  ].join(';');
}

function applyThemeFrontMatterOptionsToHtml(html, markdown) {
  if (typeof html !== 'string') return html;

  const imageBoxInlineStyle = buildImageBoxInlineStyle(markdown);
  if (!imageBoxInlineStyle) return html;

  return html.replace(/<section\b([^>]*)>/g, (match, attrs) => {
    if (/style="/.test(attrs)) {
      return match.replace(
        /style="([^"]*)"/,
        (_, existingStyle) => `style="${existingStyle}${existingStyle.trim().endsWith(';') ? '' : ';'}${imageBoxInlineStyle};"`
      );
    }

    return `<section${attrs} style="${imageBoxInlineStyle};">`;
  });
}

module.exports = class MarpEngine extends Marp {
  constructor(opts = {}) {
    super({
      ...opts,
      math: buildMathOptions(opts.math),
    });

    this.markdown.use((md) => {
      const defaultFence =
        md.renderer.rules.fence ||
        ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = (token.info || '').trim();
        const lang = info.split(/\s+/)[0];
        const codeFontClass = codeFontClassFromInfo(info);
        const hljsLanguages = new Set(['sql', 'python', 'javascript', 'html', 'css']);

        if (lang === 'mr-table') {
          env.__mrSchemas = env.__mrSchemas || {};
          const html = renderMr(token.content, env.__mrSchemas);
          if (html) return html.replace('class="mr-relations"', `class="mr-relations${codeFontClass}"`) + '\n';

          const highlighted = highlightMr(token.content);
          return `<pre class="language-mr-text${codeFontClass}" data-lang="mr-text"><code class="language-mr-text">${highlighted}</code></pre>\n`;
        }

        if (lang === 'mr-text' || lang === 'mr') {
          const highlighted = highlightMr(token.content);
          return `<pre class="language-mr-text${codeFontClass}" data-lang="mr-text"><code class="language-mr-text">${highlighted}</code></pre>\n`;
        }

        if (hljsLanguages.has(lang)) {
          const html = hljs
            ? hljs.highlight(token.content, { language: lang }).value
            : escapeHtml(token.content);
          return `<pre class="language-${lang}${codeFontClass}" data-lang="${lang}"><code class="language-${lang}">${html}</code></pre>\n`;
        }

        return defaultFence(tokens, idx, options, env, self);
      };
    });
  }

  render(...args) {
    if (typeof args[0] === 'string') {
      args[0] = preprocessColumnMarkers(args[0]);
      args[0] = preprocessVAlignBody(args[0]);
    }
    const themeAssetBase = buildThemeAssetBase(args[0]);

    const out = super.render(...args);

    if (out && typeof out.html === 'string') {
      // Avoid per-formula downscaling in display math blocks:
      // Marp may emit: <span is="marp-span" data-auto-scaling="downscale-only" class="katex-display">...
      // which causes the same font-size to appear different depending on formula width.
      out.html = out.html.replace(
        /<(?:span|marp-span)\b[^>]*\bkatex-display\b[^>]*>/g,
        (tag) => tag.replace(/\sdata-auto-scaling="downscale-only"/g, '')
      );
      out.html = absolutizeThemeAssetUrls(out.html, themeAssetBase);
      out.html = applyThemeFrontMatterOptionsToHtml(out.html, args[0]);
    }

    if (out && typeof out.css === 'string') {
      out.css = absolutizeThemeAssetUrls(out.css, themeAssetBase);
    }

    return out;
  }
};
