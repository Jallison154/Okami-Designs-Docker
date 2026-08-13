# Adding a new tool

Adding a first-party tool page should only require registry + tool files. The Tools nav dropdown (desktop + mobile) and the Tools hub grid both read from `OkamiPageRegistry.getToolPages()` — do **not** hardcode tool links in page headers.

## Checklist

### 1. Register the page

In `shared/registry/pages.js`:

1. Add one entry to `PUBLIC_PAGES`:

```js
{
    key: 'myNewTool',
    title: 'My New Tool',
    filePaths: ['tools/my-new-tool.html'],
    publicPath: '/tools/my-new-tool',
    analyticsPath: '/tools/my-new-tool',
    canonicalPath: '/tools/my-new-tool',
    trackAnalytics: true,
    productId: 'okami-my-new-tool' // optional; for commercial metadata
}
```

2. Add a legacy redirect in `LEGACY_HTML_REDIRECTS`:

```js
'/tools/my-new-tool.html': '/tools/my-new-tool',
```

3. Add the key to `TOOL_PAGE_KEYS` (this is what drives nav + Tools hub membership):

```js
const TOOL_PAGE_KEYS = ['ledVideoWallCalculator', 'okamiSignalLab', 'myNewTool'];
```

4. If the tool should appear in admin visibility controls:
   - Add the key to `ADMIN_NAV_ITEM_KEYS` in `shared/registry/pages.js`
   - Add a default entry in `DEFAULT_PAGE_CONFIG` inside `shared/settings/site-settings.js` (visibility + `navOrder`) so settings normalize/persist correctly

### 2. Create the tool HTML shell

Create `tools/my-new-tool.html` following the bootstrap script order in [SCRIPT-LOAD-ORDER.md](SCRIPT-LOAD-ORDER.md).

Use the same header pattern as other pages: empty Tools menus with only the static **All Tools** hub link — tool links are injected by `site-layout.js`:

```html
<div class="nav-dropdown-menu" data-tools-dropdown role="menu">
    <a href="/tools" class="nav-dropdown-item" data-tools-hub role="menuitem">All Tools</a>
</div>
<!-- ... -->
<div class="nav-mobile-submenu" data-tools-mobile-submenu>
    <a href="/tools" class="nav-link nav-sublink" data-tools-hub>All Tools</a>
</div>
```

For full-viewport tools, put `full-height-tool` on `<main>`.

### 3. Put logic in a tool folder

Match the Signal Lab layout:

```
tools/
  my-new-tool.html          # page shell + script tags
  my-new-tool/
    app.js                  # UI / DOM / events
    engine/                 # portable pure logic (no DOM, no secrets)
```

| Layer | Path | Put here |
|-------|------|----------|
| UI | `tools/<name>/app.js`, HTML | DOM, events, layout |
| Engine | `tools/<name>/engine/` | Pure calculations, serializers |
| Shared | `shared/`, `tools/led-wall-calculator/` | Cross-tool math / registry |
| Server | `server.js`, `server/**` | Secrets, APIs |

See [CONTRIBUTING.md](CONTRIBUTING.md) for layer rules.

### 4. Catalog entry (optional, admin-managed)

Public Tools hub cards and homepage Featured Projects come from `files/tools.json` (admin Tools tab), not from the page registry alone.

- Registry (`TOOL_PAGE_KEYS`) → nav dropdown + route + visibility key
- Catalog (`tools.json`) → hub cards, featured projects, icons, external links

For an internal tool, create/enable a matching catalog row in admin (or seed `files/tools.json`) with `pageKey` set to the registry key and `url` set to `publicPath`.

### 5. What you should NOT edit

These are already registry-driven — leave them alone when adding a tool:

- Hardcoded tool `<a>` tags inside every page header (removed; do not reintroduce)
- `home.html` Featured Projects markup (API-driven)
- Tools hub grid template (`tools/index.html` + `client/tools/tools-hub.js`)
- Per-page nav lists for LED / Signal Lab / future tools

## Verify

1. Open any public page → Tools dropdown lists the new title with the correct `href`.
2. Open `/tools` → hub still works (catalog entry required for a card).
3. Hit the clean URL (`/tools/my-new-tool`) → tool loads; legacy `.html` redirects.
4. Admin → Visibility shows the new key when it was added to `ADMIN_NAV_ITEM_KEYS`.

## Standalone / externally hosted tools

First-party tools may live in their own repo + Docker container (see sibling `okami-signal-lab` and `okami-app-template`).

1. Set `publicPath` to the absolute URL (e.g. `https://signallab.okamidesigns.com/`).
2. Set `external: true` and leave `filePaths` empty.
3. Add legacy redirects in `LEGACY_HTML_REDIRECTS` from the old `/tools/...` paths to the absolute URL.
4. `site-layout.js` / `getNavItemDefinition()` treat `https://` tool URLs as external (SPA does not intercept).
5. Do **not** re-add tool source under `tools/` on the main site.

## Related docs

- [SCRIPT-LOAD-ORDER.md](SCRIPT-LOAD-ORDER.md) — required `<script>` bootstrap (in-site pages)
- [CONTRIBUTING.md](CONTRIBUTING.md) — layer rules and PR checks
- [ADMIN-LOGIN-SETUP.md](ADMIN-LOGIN-SETUP.md) — admin access for catalog / visibility
- Sibling `okami-app-template/` — design tokens + chrome for standalone apps
