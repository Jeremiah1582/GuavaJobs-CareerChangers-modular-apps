"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalKey = buildCanonicalKey;
exports.buildAdzunaKey = buildAdzunaKey;
exports.parseCanonicalKey = parseCanonicalKey;
function buildCanonicalKey(atsType, board, jobId) {
    return `${atsType}:${board}:${jobId}`.toLowerCase();
}
function buildAdzunaKey(country, adzunaId) {
    return buildCanonicalKey('adzuna', country.toLowerCase(), adzunaId);
}
function parseCanonicalKey(key) {
    const decoded = decodeURIComponent(key).trim();
    const parts = decoded.split(':');
    if (parts.length < 3) {
        return null;
    }
    return {
        atsType: parts[0],
        board: parts.slice(1, -1).join(':'),
        jobId: parts[parts.length - 1],
    };
}
//# sourceMappingURL=canonical-key.util.js.map