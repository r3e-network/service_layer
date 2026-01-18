const hashes = require('@noble/hashes/package.json');
console.log(JSON.stringify(hashes.exports, null, 2));
console.log('Files:', require('fs').readdirSync(require.resolve('@noble/hashes/package.json').replace('package.json', '')));
