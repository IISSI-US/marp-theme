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
  '\\Diff': '\\mathbin{\\Large\\setminus}',
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

        if (lang === 'mr') {
          const html = highlightMr(token.content);
          return `<pre class="language-mr${codeFontClass}" data-lang="mr"><code class="language-mr">${html}</code></pre>\n`;
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
