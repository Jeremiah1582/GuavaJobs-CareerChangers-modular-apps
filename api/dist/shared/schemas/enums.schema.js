"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salaryPeriodSchema = exports.userTierSchema = exports.seniorityLevelSchema = exports.profileIndustrySchema = void 0;
const zod_1 = require("zod");
exports.profileIndustrySchema = zod_1.z.enum([
    'SOFTWARE',
    'SALES',
    'DATA_ANALYSIS',
    'FINANCE',
    'HR',
    'MARKETING',
    'OPERATIONS',
    'PRODUCT',
    'DESIGN',
    'OTHER',
]);
exports.seniorityLevelSchema = zod_1.z.enum([
    'INTERN',
    'JUNIOR',
    'MID',
    'SENIOR',
    'LEAD',
    'EXECUTIVE',
    'C_LEVEL',
]);
exports.userTierSchema = zod_1.z.enum(['FREE', 'PAID']);
exports.salaryPeriodSchema = zod_1.z.enum(['ANNUAL', 'MONTHLY', 'HOURLY']);
//# sourceMappingURL=enums.schema.js.map