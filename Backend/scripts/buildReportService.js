const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'reportsSource.js');
const src = fs.readFileSync(srcPath, 'utf8');

const routeNames = {
    '/financial/daily': 'getFinancialDaily',
    '/financial/period': 'getFinancialPeriod',
    '/financial/plate-code': 'getFinancialPlateCode',
    '/financial/payment-methods': 'getFinancialPaymentMethods',
    '/operational/activity': 'getOperationalActivity',
    '/operational/duration': 'getOperationalDuration',
    '/operational/location': 'getOperationalLocation',
    '/operational/peak-hours': 'getOperationalPeakHours',
    '/operational/plate-code-distribution': 'getOperationalPlateCodeDistribution',
    '/customer/vehicle-history': 'getCustomerVehicleHistory',
    '/customer/activity': 'getCustomerActivity',
    '/administrative/users': 'getAdministrativeUsers',
    '/administrative/valet-performance': 'getAdministrativeValetPerformance',
    '/compliance/transactions': 'getComplianceTransactions',
    '/compliance/system-activity': 'getComplianceSystemActivity',
};

function findMatchingBrace(text, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < text.length; i++) {
        const ch = text[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function extractTryBody(handlerBody) {
    const tryIdx = handlerBody.indexOf('try {');
    if (tryIdx === -1) return handlerBody.trim();

    const openBrace = handlerBody.indexOf('{', tryIdx);
    const closeBrace = findMatchingBrace(handlerBody, openBrace);
    return handlerBody.slice(openBrace + 1, closeBrace).trim();
}

function isAuthIfLine(trimmed) {
    return trimmed.startsWith('if (!checkAdminAccess')
        || trimmed.startsWith("if (currentUser?.type !== 'system_admin'")
        || trimmed.startsWith('if (!licensePlate && !phoneNumber)');
}

function stripAuthBlocks(body) {
    const lines = body.split('\n');
    const out = [];
    let skipDepth = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        if (skipDepth > 0) {
            skipDepth += (line.match(/{/g) || []).length;
            skipDepth -= (line.match(/}/g) || []).length;
            continue;
        }

        if (line.includes('const currentUser = await User.findOne')) continue;

        if (isAuthIfLine(trimmed)) {
            skipDepth += (line.match(/{/g) || []).length;
            skipDepth -= (line.match(/}/g) || []).length;
            continue;
        }

        if (trimmed.startsWith('return res.status(403)') || trimmed.startsWith('return res.status(400)')) {
            continue;
        }

        out.push(line);
    }

    return out.join('\n');
}

function transformBody(body, fnName) {
    let result = stripAuthBlocks(body);

    result = result
        .replace(/req\.query/g, 'query')
        .replace(/res\.json\(/g, 'return (');

    result = result.replace(
        /return res\.status\(400\)\.json\(\{ error: "licensePlate or phoneNumber is required" \}\);/g,
        'throw new AppError("licensePlate or phoneNumber is required", 400);'
    );

    if (fnName === 'getCustomerVehicleHistory') {
        result = result.replace(/let query = \{\};/, 'let dbQuery = {};');
        result = result
            .replace(/query\.licensePlate/g, 'dbQuery.licensePlate')
            .replace(/query\.phoneNumber/g, 'dbQuery.phoneNumber')
            .replace(/ParkedCar\.find\(query\)/g, 'ParkedCar.find(dbQuery)');
    }

    if (fnName === 'getComplianceTransactions') {
        result = result.replace(/let query = \{/, 'let dbQuery = {');
        result = result
            .replace(/query\.\$or/g, 'dbQuery.$or')
            .replace(/query\.paymentMethod/g, 'dbQuery.paymentMethod')
            .replace(/ParkedCar\.find\(query\)/g, 'ParkedCar.find(dbQuery)');
    }

    return result.trim();
}

function extractHandlers(source) {
    const handlers = [];
    const marker = 'reportsRouter.get(';
    let searchFrom = 0;

    while (true) {
        const start = source.indexOf(marker, searchFrom);
        if (start === -1) break;

        const pathMatch = source.slice(start).match(/reportsRouter\.get\("([^"]+)"/);
        if (!pathMatch) break;

        const routePath = pathMatch[1];
        const fnName = routeNames[routePath];
        if (!fnName) {
            throw new Error(`Unknown route: ${routePath}`);
        }

        const asyncIdx = source.indexOf('async (req, res)', start);
        const handlerOpen = source.indexOf('{', asyncIdx);
        const handlerClose = findMatchingBrace(source, handlerOpen);
        const handlerBody = source.slice(handlerOpen + 1, handlerClose);
        const tryBody = extractTryBody(handlerBody);
        const transformed = transformBody(tryBody, fnName);

        handlers.push({ fnName, transformed });
        searchFrom = handlerClose + 1;
    }

    return handlers;
}

// Header: getDateRange helper only (auth lives in middleware)
const headerStart = src.indexOf('const getDateRange');
const headerEnd = src.indexOf('// Helper to check user permissions');
const headerBlock = src.slice(headerStart, headerEnd).trim();
const header = `const AppError = require('../errors/AppError');
const ParkedCar = require('../models/parkedCarSchema');
const User = require('../models/userSchema');

${headerBlock}
`;

const handlers = extractHandlers(src);
const functions = handlers.map(({ fnName, transformed }) =>
    `const ${fnName} = async (query = {}) => {\n${transformed}\n};`
).join('\n\n');

const exportsList = [
    'getDateRange',
    ...handlers.map((h) => h.fnName),
];

const footer = `
module.exports = {
    ${exportsList.join(',\n    ')},
};
`;

const output = header + '\n' + functions + footer;
fs.writeFileSync(path.join(__dirname, '../services/reportService.js'), output, 'utf8');
console.log(`Built reportService.js with ${handlers.length} handlers`);
