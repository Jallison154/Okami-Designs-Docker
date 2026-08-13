# Script load order

Public pages must load shared modules **before** `site-visibility.js`. Use explicit `<script>` tags (not dynamic injection).

`site-layout.js` (after the registry) fills the Tools nav dropdown from `OkamiPageRegistry.getToolPages()`. Keep only the static **All Tools** hub link in HTML — see [ADDING-A-TOOL.md](ADDING-A-TOOL.md).

## Site root pages

`home.html`, `services.html`, `support.html`, `contact.html`, `index.html`, `page-template.html`, `admin.html`:

```html
<script src="shared/settings/site-settings.js"></script>
<script src="shared/registry/pages.js"></script>
<script src="shared/visibility/access-policy.js"></script>
<script src="page-registry.js"></script>
<script src="site-visibility.js"></script>
<script src="analytics-tracker.js"></script>
<script src="site-layout.js"></script>
<script src="script.js"></script>
```

Admin pages omit visibility/analytics/site-layout unless needed:

```html
<script src="shared/settings/site-settings.js"></script>
<script src="shared/registry/pages.js"></script>
<script src="shared/visibility/access-policy.js"></script>
<script src="page-registry.js"></script>
<!-- admin scripts -->
```

## Tool pages (in-site shells only)

First-party apps (Signal Lab, LED Calculator) are **standalone sibling repos** and do not use this bootstrap. For any remaining in-site tool shells under `tools/*.html`, use the same block with a `../` prefix:

```html
<script src="../shared/settings/site-settings.js"></script>
<script src="../shared/registry/pages.js"></script>
<script src="../shared/visibility/access-policy.js"></script>
<script src="../page-registry.js"></script>
<script src="../site-visibility.js"></script>
<script src="../analytics-tracker.js"></script>
<script src="../site-layout.js"></script>
<script src="../script.js"></script>
<!-- tool-specific scripts below -->
```

Standalone apps copy chrome from sibling `okami-app-template/` instead.

## Commercial client (Phase 4+ only)

Do **not** load on tool pages until licensing is ready:

```html
<script src="client/commercial/commercial-client.js"></script>
<script src="client/commercial/commercial-ui.js"></script>
```

## SPA navigation

`script.js` skips re-loading bootstrap and shared scripts when navigating client-side. Tool scripts load per destination page.

## `page-registry.js`

Validation shim only. It logs an error if shared registry scripts were omitted.
