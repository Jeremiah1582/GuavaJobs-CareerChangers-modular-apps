"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldMapForAts = getFieldMapForAts;
exports.detectAtsType = detectAtsType;
exports.splitFullName = splitFullName;
exports.buildAutofillValues = buildAutofillValues;
const ashby_fields_1 = require("./templates/ashby.fields");
const greenhouse_fields_1 = require("./templates/greenhouse.fields");
const lever_fields_1 = require("./templates/lever.fields");
const FIELD_MAPS = {
    greenhouse: greenhouse_fields_1.greenhouseFieldMap,
    lever: lever_fields_1.leverFieldMap,
    ashby: ashby_fields_1.ashbyFieldMap,
};
function getFieldMapForAts(atsType) {
    if (atsType === 'greenhouse' || atsType === 'lever' || atsType === 'ashby') {
        return FIELD_MAPS[atsType];
    }
    return null;
}
function detectAtsType(canonicalJobKey, applyUrl) {
    if (canonicalJobKey) {
        const decoded = decodeURIComponent(canonicalJobKey).trim().toLowerCase();
        const atsType = decoded.split(':')[0];
        if (atsType === 'greenhouse' || atsType === 'lever' || atsType === 'ashby') {
            return atsType;
        }
    }
    if (applyUrl) {
        try {
            const host = new URL(applyUrl).hostname.toLowerCase();
            if (host.includes('greenhouse.io') || host.includes('grnh.se')) {
                return 'greenhouse';
            }
            if (host.includes('lever.co') || host.includes('jobs.lever')) {
                return 'lever';
            }
            if (host.includes('ashbyhq.com') || host.includes('jobs.ashbyhq')) {
                return 'ashby';
            }
        }
        catch {
        }
    }
    return 'unknown';
}
function splitFullName(name) {
    const trimmed = name.trim();
    const space = trimmed.indexOf(' ');
    if (space === -1) {
        return { firstName: trimmed, lastName: '', fullName: trimmed };
    }
    return {
        firstName: trimmed.slice(0, space),
        lastName: trimmed.slice(space + 1).trim(),
        fullName: trimmed,
    };
}
function buildAutofillValues(input) {
    const { firstName, lastName, fullName } = splitFullName(input.user.name);
    const location = [input.profile.locationCity, input.profile.locationCountry]
        .filter(Boolean)
        .join(', ');
    const savedAnswers = input.profile.autofillAnswers &&
        typeof input.profile.autofillAnswers === 'object' &&
        !Array.isArray(input.profile.autofillAnswers)
        ? input.profile.autofillAnswers
        : {};
    const values = {
        firstName,
        lastName,
        fullName,
        email: input.user.email,
        phone: input.profile.contactPhone,
        linkedinUrl: input.user.linkedinUrl,
        githubUrl: input.user.githubUrl,
        jobTitle: input.profile.jobTitle,
        targetRole: input.application.jobRoleTitle ?? input.profile.jobTitle,
        companyName: input.application.companyName,
        locationCity: input.profile.locationCity,
        locationCountry: input.profile.locationCountry,
        location,
        coverLetter: input.application.coverLetterContent,
    };
    for (const [key, value] of Object.entries(savedAnswers)) {
        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null) {
            values[key] = value;
        }
        else if (value !== undefined) {
            values[key] = String(value);
        }
    }
    for (const key of Object.keys(values)) {
        if (values[key] === undefined) {
            values[key] = null;
        }
    }
    return values;
}
//# sourceMappingURL=autofill.util.js.map