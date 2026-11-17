// Which browser the test scripts use: BROWSER=chromium (default), webkit (Safari's engine) or firefox.
// Chromium honours PW_CHROMIUM_PATH for a preinstalled binary.
const pw = require('playwright');
const name = (process.env.BROWSER || 'chromium').toLowerCase();
if (!['chromium', 'webkit', 'firefox'].includes(name)) throw new Error(`Unknown BROWSER "${name}"`);
const launch = (opts = {}) => pw[name].launch({ ...(name === 'chromium' && process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}), ...opts });
module.exports = { launch, name, chromium: pw.chromium };
