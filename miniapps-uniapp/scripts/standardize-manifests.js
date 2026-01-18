#!/usr/bin/env node
/**
 * Merge and standardize MiniApp manifests
 * 
 * This script:
 * 1. Reads src/manifest.json (combined format)
 * 2. Creates/updates neo-manifest.json with platform metadata  
 * 3. Simplifies src/manifest.json to only UniApp build config
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, '../apps');

function processApp(appDir) {
    const appPath = path.join(APPS_DIR, appDir);
    const srcManifestPath = path.join(appPath, 'src/manifest.json');
    const neoManifestPath = path.join(appPath, 'neo-manifest.json');

    if (!fs.existsSync(srcManifestPath)) {
        console.log(`  [SKIP] ${appDir}: no src/manifest.json`);
        return;
    }

    try {
        const srcManifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf-8'));

        // Load existing neo-manifest if exists
        let neoManifest = {};
        if (fs.existsSync(neoManifestPath)) {
            neoManifest = JSON.parse(fs.readFileSync(neoManifestPath, 'utf-8'));
        }

        // Build new neo-manifest from src/manifest.json platform fields
        const newNeoManifest = {
            app_id: srcManifest.app_id || srcManifest.appid || neoManifest.app_id || `miniapp-${appDir}`,
            name: srcManifest.name || neoManifest.name || appDir,
            name_zh: srcManifest.name_zh || neoManifest.name_zh || '',
            description: srcManifest.description || neoManifest.description || '',
            description_zh: srcManifest.description_zh || neoManifest.description_zh || '',
            version: srcManifest.version || neoManifest.version || '1.0.0',
            entry_url: srcManifest.entry_url || neoManifest.entry_url || `mf://builtin?app=miniapp-${appDir}`,
            category: srcManifest.category || neoManifest.category || 'utility',
            status: srcManifest.status || neoManifest.status || 'active',
            tags: srcManifest.tags || neoManifest.tags || [],
            permissions: srcManifest.permissions || neoManifest.permissions || ['wallet'],
            assets_allowed: srcManifest.assets_allowed || neoManifest.assets_allowed || ['NEO', 'GAS'],
            supported_chains: srcManifest.supported_chains || neoManifest.supported_chains || ['neo-n3-mainnet', 'neo-n3-testnet'],
            contracts: neoManifest.contracts || {},
            card: srcManifest.card || neoManifest.card || {
                display: {
                    type: 'icon_title',
                    banner: '/static/banner.png'
                },
                info: {
                    logo: '/static/logo.png'
                }
            }
        };

        // Build minimal src/manifest.json (UniApp only)
        const name = newNeoManifest.name;
        const appid = (newNeoManifest.app_id || `miniapp-${appDir}`).replace(/^miniapp-/, '');

        const newSrcManifest = {
            name: name,
            appid: `miniapp-${appid}`,
            description: `${name} - Neo MiniApp`,
            versionName: newNeoManifest.version,
            versionCode: '100',
            transformPx: false,
            h5: srcManifest.h5 || {
                title: name,
                router: {
                    mode: 'hash'
                }
            }
        };

        // Write files
        fs.writeFileSync(neoManifestPath, JSON.stringify(newNeoManifest, null, 2));
        fs.writeFileSync(srcManifestPath, JSON.stringify(newSrcManifest, null, 2));

        console.log(`  ✓ ${appDir}: manifests updated`);
    } catch (err) {
        console.error(`  ✗ ${appDir}: ${err.message}`);
    }
}

function main() {
    console.log('🔧 Standardizing MiniApp manifests...\n');

    const appDirs = fs.readdirSync(APPS_DIR).filter(dir => {
        const stat = fs.statSync(path.join(APPS_DIR, dir));
        return stat.isDirectory() && !dir.startsWith('.');
    });

    for (const appDir of appDirs) {
        processApp(appDir);
    }

    console.log('\n✅ Done!');
}

main();
