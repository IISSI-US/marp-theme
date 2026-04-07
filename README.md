# marp-theme

Shared `dr-iissi` Marp theme for the IISSI slide decks.

## Contents

```text
css/
  dr-iissi.css
  us-footer.png
  us-title-bg.png
  us-default-bg.png
fonts/
scripts/
  marp-engine.js
  install-local-fonts.sh
templates/
  templates.md
  package.json
```

## What is in this submodule

- Theme CSS in `css/dr-iissi.css`
- Local image assets and local fonts
- Custom Marp engine logic in `scripts/marp-engine.js`
- A guide and visual regression deck in `templates/templates.md`

## What you need to install

Required:

- Node.js
- npm
- Marp CLI
- A browser supported by Marp in `PATH`

Install Node.js first, because Marp CLI is distributed through npm:

```bash
node --version
npm --version
```

Then install Marp CLI globally:

```bash
npm i -g @marp-team/marp-cli
```

Verify the installation:

```bash
marp --version
```

Supported browser resolution in the scripts:

- `chromium-browser`
- `google-chrome`
- `chromium`
- `firefox`

Optional:

```bash
npm run install-fonts
```

## Runtime model

The theme is not only CSS.

The full rendering stack is:

- Marp CLI
- `dr-iissi.css`
- `marp-engine.js`
- local fonts and local background assets

The engine adds behavior for:

- column markers
- `mr` code blocks
- SQL highlighting
- KaTeX and relational algebra macros
- asset resolution through `marp-theme-rel-dir`

## Typical usage

From a repo that vendors this submodule:

```bash
marp --theme-set ./marp-theme/css/dr-iissi.css --engine ./marp-theme/scripts/marp-engine.js slide.md --pdf
```

In the slide front matter:

```yaml
---
marp: true
theme: dr-iissi
marp-theme-rel-dir: ./marp-theme
paginate: true
image-box: false
---
```

Adjust `marp-theme-rel-dir` so it is relative to the markdown file being rendered.

Optional front matter:

- `image-box: false` disables the default framed box around images for that deck
- omit it, or use `image-box: true`, to keep the current framed style

Default image styling:

- images keep a very subtle granate frame by default
- `image-box: false` removes that frame, padding, and rounded corners

## Templates guide

The reference deck lives in:

- `templates/templates.md`
- `templates/run-marp.js` is the portable launcher used by the local `build` and `watch` scripts

Build it with:

```bash
npm --prefix marp-theme/templates run build
```

Watch it with:

```bash
npm --prefix marp-theme/templates run watch
```

Implementation note:

- the templates scripts no longer rely on POSIX-style inline environment variables
- `run-marp.js` resolves `CHROME_PATH` in a cross-platform way
- `CHOKIDAR_USEPOLLING=1` is enabled automatically only for WSL watch mode
- this avoids the previous failure mode on native Windows shells
