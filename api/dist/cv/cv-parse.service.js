"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CvParseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParseService = void 0;
const common_1 = require("@nestjs/common");
const mammoth_1 = __importDefault(require("mammoth"));
const pdf_parse_1 = require("pdf-parse");
const MAX_EXTRACT_CHARS = 120_000;
let CvParseService = CvParseService_1 = class CvParseService {
    logger = new common_1.Logger(CvParseService_1.name);
    async extractText(buffer, mimeType, fileName) {
        const normalizedMime = mimeType.toLowerCase();
        const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
        let text = '';
        if (normalizedMime === 'application/pdf' ||
            ext === 'pdf') {
            text = await this.parsePdf(buffer);
        }
        else if (normalizedMime ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            ext === 'docx') {
            text = await this.parseDocx(buffer);
        }
        else if (normalizedMime === 'application/msword' ||
            ext === 'doc') {
            throw new Error('Legacy .doc files are not supported; please upload PDF or DOCX');
        }
        else if (normalizedMime.startsWith('text/')) {
            text = buffer.toString('utf8');
        }
        else {
            throw new Error(`Unsupported CV file type: ${mimeType || ext}`);
        }
        const trimmed = text.replace(/\s+/g, ' ').trim();
        if (!trimmed) {
            throw new Error('No readable text found in CV');
        }
        return trimmed.slice(0, MAX_EXTRACT_CHARS);
    }
    async parsePdf(buffer) {
        const parser = new pdf_parse_1.PDFParse({ data: buffer });
        try {
            const result = await parser.getText();
            return result.text ?? '';
        }
        finally {
            await parser.destroy();
        }
    }
    async parseDocx(buffer) {
        const result = await mammoth_1.default.extractRawText({ buffer });
        if (result.messages.length) {
            this.logger.debug(`DOCX parse messages: ${result.messages.map((m) => m.message).join('; ')}`);
        }
        return result.value ?? '';
    }
};
exports.CvParseService = CvParseService;
exports.CvParseService = CvParseService = CvParseService_1 = __decorate([
    (0, common_1.Injectable)()
], CvParseService);
//# sourceMappingURL=cv-parse.service.js.map