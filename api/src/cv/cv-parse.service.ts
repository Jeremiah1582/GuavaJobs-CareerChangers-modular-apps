import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const MAX_EXTRACT_CHARS = 120_000;

@Injectable()
export class CvParseService {
  private readonly logger = new Logger(CvParseService.name);

  async extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
    const normalizedMime = mimeType.toLowerCase();
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

    let text = '';

    if (
      normalizedMime === 'application/pdf' ||
      ext === 'pdf'
    ) {
      text = await this.parsePdf(buffer);
    } else if (
      normalizedMime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      text = await this.parseDocx(buffer);
    } else if (
      normalizedMime === 'application/msword' ||
      ext === 'doc'
    ) {
      throw new Error(
        'Legacy .doc files are not supported; please upload PDF or DOCX',
      );
    } else if (normalizedMime.startsWith('text/')) {
      text = buffer.toString('utf8');
    } else {
      throw new Error(`Unsupported CV file type: ${mimeType || ext}`);
    }

    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      throw new Error('No readable text found in CV');
    }

    return trimmed.slice(0, MAX_EXTRACT_CHARS);
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? '';
    } finally {
      await parser.destroy();
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    if (result.messages.length) {
      this.logger.debug(
        `DOCX parse messages: ${result.messages.map((m) => m.message).join('; ')}`,
      );
    }
    return result.value ?? '';
  }
}
