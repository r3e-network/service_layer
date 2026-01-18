
const fs = require('fs');
const path = require('path');

const apps = [
    'guardian-policy',
    'hall-of-fame',
    'heritage-trust',
    'lottery',
    'masquerade-dao',
    'memorial-shrine',
    'million-piece-map',
    'neo-convert',
    'neo-gacha',
    'neo-multisig',
    'neo-news-today',
    'neo-ns'
];

const hostStaticBase = path.join(__dirname, '../platform/host-app/public/miniapps');

apps.forEach(app => {
    const srcStatic = path.join(__dirname, `../apps/${app}/src/static`);
    const hostStatic = path.join(hostStaticBase, app, 'static');

    if (!fs.existsSync(hostStatic)) {
        console.log(`Creating directory: ${hostStatic}`);
        fs.mkdirSync(hostStatic, { recursive: true });
    }

    // Copy logo.png if exists
    if (fs.existsSync(path.join(srcStatic, 'logo.png'))) {
        fs.copyFileSync(path.join(srcStatic, 'logo.png'), path.join(hostStatic, 'logo.png'));
        console.log(`Copied logo.png for ${app}`);
    }

    // Copy banner.png if exists
    if (fs.existsSync(path.join(srcStatic, 'banner.png'))) {
        fs.copyFileSync(path.join(srcStatic, 'banner.png'), path.join(hostStatic, 'banner.png'));
        console.log(`Copied banner.png for ${app}`);
    }
});
