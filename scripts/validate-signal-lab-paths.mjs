#!/usr/bin/env node
/**
 * Validates that the standalone Okami Signal Lab app (sibling repo) has
 * resolvable local asset paths. Main site no longer hosts the tool files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const signalLabRoot = path.resolve(root, '..', 'okami-signal-lab');

function collectRefs(htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const baseDir = path.dirname(htmlPath);
    const refs = [];
    const re = /(?:href|src)=["']([^"'?#]+)/g;
    let match;
    while ((match = re.exec(html)) !== null) {
        const ref = match[1];
        if (/^(https?:|\/\/|data:|mailto:)/.test(ref)) {
            continue;
        }
        refs.push({
            ref,
            resolved: path.normalize(path.join(baseDir, ref))
        });
    }
    return refs;
}

if (!fs.existsSync(signalLabRoot)) {
    console.error(`Standalone Signal Lab repo not found at:\n  ${signalLabRoot}`);
    console.error('Expected sibling folder: ../okami-signal-lab');
    process.exit(1);
}

const pages = [
    path.join(signalLabRoot, 'index.html'),
    path.join(signalLabRoot, 'app.html'),
    path.join(signalLabRoot, 'signal-lab-output.html')
];

let failed = false;

for (const page of pages) {
    if (!fs.existsSync(page)) {
        failed = true;
        console.log(`MISSING PAGE  ${page}`);
        continue;
    }
    console.log(`\n${path.relative(root, page)}`);
    for (const { ref, resolved } of collectRefs(page)) {
        if (!fs.existsSync(resolved)) {
            failed = true;
            console.log(`  MISSING  ${ref}`);
            console.log(`           -> ${resolved}`);
        }
    }
}

if (failed) {
    process.exit(1);
}

console.log('\nAll standalone Signal Lab referenced paths exist.');
