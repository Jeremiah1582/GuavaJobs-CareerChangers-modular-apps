import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async coverLetterPdf(params: {
    applicantName: string;
    coverLetter: string;
    companyName?: string;
    jobTitle?: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(11)
        .text(params.applicantName, { align: 'left' })
        .moveDown(0.5);

      if (params.companyName || params.jobTitle) {
        doc
          .fontSize(10)
          .fillColor('#444444')
          .text(
            [params.jobTitle, params.companyName].filter(Boolean).join(' — '),
          )
          .moveDown(1);
        doc.fillColor('#000000');
      }

      doc.fontSize(11).text(params.coverLetter, {
        align: 'left',
        lineGap: 4,
      });

      doc.end();
    });
  }
}
