(function(global) {
    'use strict';

    let initialized = false;
    let headerResizeObserver = null;

    function findSiteHeader() {
        return document.querySelector('header.header')
            || document.querySelector('header')
            || document.querySelector('.site-header')
            || document.querySelector('.navbar')
            || document.querySelector('nav.navbar');
    }

    function updateOkamiHeaderHeight() {
        const header = findSiteHeader();
        const height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
        document.documentElement.style.setProperty('--okami-header-height', `${height}px`);
        return height;
    }

    function refreshLayout() {
        updateOkamiHeaderHeight();
        requestAnimationFrame(() => {
            global.dispatchEvent(new Event('resize'));
        });
    }

    function bindHeaderObserver() {
        const header = findSiteHeader();
        if (!header || typeof ResizeObserver === 'undefined' || headerResizeObserver) {
            return;
        }

        headerResizeObserver = new ResizeObserver(() => {
            refreshLayout();
        });
        headerResizeObserver.observe(header);
    }

    function normalizePathname(pathname) {
        let normalized = (pathname || '/').split('?')[0].replace(/\\/g, '/').toLowerCase();
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        return normalized || '/';
    }

    function isAbsoluteUrl(value) {
        const registry = global.OkamiPageRegistry || global.OkamiShared?.Registry;
        if (typeof registry?.isAbsoluteUrl === 'function') {
            return registry.isAbsoluteUrl(value);
        }
        return typeof value === 'string' && /^https?:\/\//i.test(value);
    }

    const NAV_GROUP_LABELS = { apps: 'Apps', avTools: 'AV Tools' };
    const TOOLS_API_URL = '/api/tools';
    const TOOLS_FALLBACK_URL = '/files/tools.json';

    let toolsCatalogPromise = null;

    /**
     * Tools dropdown contents (Apps / AV Tools) come from the tools catalog, not
     * a hardcoded list — adding or removing an app only requires a catalog entry
     * (via the admin Tools editor), no code changes.
     */
    function fetchToolsCatalogData() {
        if (toolsCatalogPromise) {
            return toolsCatalogPromise;
        }
        toolsCatalogPromise = (async () => {
            try {
                const response = await fetch(TOOLS_API_URL, { cache: 'no-store' });
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                // fall through to static fallback
            }
            try {
                const fallback = await fetch(TOOLS_FALLBACK_URL, { cache: 'no-store' });
                if (fallback.ok) {
                    return await fallback.json();
                }
            } catch (error) {
                // no catalog data available
            }
            return { tools: [] };
        })();
        return toolsCatalogPromise;
    }

    function resolveCatalogToolHref(tool) {
        const catalogApi = global.OkamiShared?.ToolsCatalog;
        if (catalogApi?.resolveToolHref) {
            return catalogApi.resolveToolHref(tool);
        }
        return tool.url || '#';
    }

    function createCatalogToolLink(tool, { isMobile = false } = {}) {
        const link = document.createElement('a');
        const href = resolveCatalogToolHref(tool);
        link.href = href;
        link.dataset.catalogToolId = tool.id;
        link.textContent = tool.title || tool.id;

        if (isMobile) {
            link.className = 'nav-link nav-sublink';
        } else {
            link.className = 'nav-dropdown-item';
            link.setAttribute('role', 'menuitem');
        }

        if (tool.openInNewTab) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        } else if (isAbsoluteUrl(href)) {
            link.rel = 'noopener';
        }

        return link;
    }

    function buildNavGroup(groupKey, tools, { isMobile = false } = {}) {
        if (!tools || !tools.length) {
            return null;
        }
        const wrapper = document.createElement('div');
        wrapper.className = isMobile ? 'nav-mobile-subgroup' : 'nav-dropdown-group';
        wrapper.dataset.navGroup = groupKey;

        const label = document.createElement('span');
        label.className = isMobile ? 'nav-mobile-subgroup-label' : 'nav-dropdown-group-label';
        label.textContent = NAV_GROUP_LABELS[groupKey] || groupKey;
        wrapper.appendChild(label);

        tools.forEach((tool) => wrapper.appendChild(createCatalogToolLink(tool, { isMobile })));
        return wrapper;
    }

    /**
     * Fill a tools menu with catalog-driven Apps / AV Tools groups.
     * Keeps the static "All Tools" hub link; clears and rebuilds only [data-nav-group]
     * nodes, so it's safe to call again after a nav rebuild (e.g. site-visibility.js).
     */
    async function ensureToolsMenuLinks(menu, { isMobile = false } = {}) {
        if (!menu || typeof document === 'undefined') {
            return menu;
        }

        const catalogApi = global.OkamiShared?.ToolsCatalog;
        const data = await fetchToolsCatalogData();
        const grouped = catalogApi?.getNavGroupedTools
            ? catalogApi.getNavGroupedTools(data)
            : { apps: [], avTools: [] };

        menu.querySelectorAll('[data-nav-group]').forEach((el) => el.remove());

        const appsGroup = buildNavGroup('apps', grouped.apps, { isMobile });
        const avToolsGroup = buildNavGroup('avTools', grouped.avTools, { isMobile });
        if (appsGroup) menu.appendChild(appsGroup);
        if (avToolsGroup) menu.appendChild(avToolsGroup);

        return menu;
    }

    function renderToolsDropdowns(root) {
        const scope = root && root.querySelectorAll ? root : document;

        scope.querySelectorAll('[data-tools-dropdown]').forEach((menu) => {
            ensureToolsMenuLinks(menu, { isMobile: false });
        });

        scope.querySelectorAll('[data-tools-mobile-submenu]').forEach((menu) => {
            ensureToolsMenuLinks(menu, { isMobile: true });
        });
    }

    function initOkamiSiteLayout() {
        renderToolsDropdowns();
        updateOkamiHeaderHeight();

        if (initialized) {
            return;
        }

        initialized = true;

        global.addEventListener('resize', updateOkamiHeaderHeight);
        global.addEventListener('orientationchange', () => {
            requestAnimationFrame(updateOkamiHeaderHeight);
        });

        if (global.document?.fonts?.ready) {
            global.document.fonts.ready.then(updateOkamiHeaderHeight).catch(() => {});
        }

        bindHeaderObserver();

        // After visibility rebuilds the nav, only refresh header metrics.
        // Do not re-fill tool links here — that would undo visibility filtering.
        document.addEventListener('okami:nav-rendered', () => {
            updateOkamiHeaderHeight();
        });
    }

    global.OkamiSiteLayout = {
        findSiteHeader,
        updateOkamiHeaderHeight,
        refreshLayout,
        ensureToolsMenuLinks,
        renderToolsDropdowns,
        normalizePathname,
        init: initOkamiSiteLayout
    };

    if (global.document?.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', initOkamiSiteLayout);
    } else {
        initOkamiSiteLayout();
    }
})(typeof window !== 'undefined' ? window : globalThis);
