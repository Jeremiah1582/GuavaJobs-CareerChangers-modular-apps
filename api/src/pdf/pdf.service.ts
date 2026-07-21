import { Injectable } from '@nestjs/common';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import PDFDocument from 'pdfkit';
import {
  CV_PDF_LAYOUTS,
  DEFAULT_CV_PDF_LAYOUT,
  type CvPdfLayout,
} from '../shared/constants/cv-pdf-layouts';
import type { HydratedGeneratedCvExport } from '../shared/schemas/generated-cv.schema';
import { AppError } from '../shared/schemas/error.schema';
import { ClassicCvDocument } from './templates/cv-classic';
import { ModernCvDocument } from './templates/cv-modern';

@Injectable()
export class PdfService {
  async coverLetterPdf(params: {
    applicantName: string;
    coverLetter: string;
    companyName?: string;
    jobTitle?: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 64,
        size: 'A4',
        info: {
          Title: 'Cover Letter',
          Author: params.applicantName,
        },
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111111')
        .text(params.applicantName, { align: 'left' });

      const contactParts = [params.email, params.phone].filter(
        (v): v is string => Boolean(v && String(v).trim()),
      );
      if (contactParts.length) {
        doc
          .moveDown(0.25)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#444444')
          .text(contactParts.join(' · '), { align: 'left' });
      }

      doc
        .moveDown(0.75)
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#333333')
        .text(formatCoverLetterDate(new Date()), { align: 'left' });

      if (params.companyName || params.jobTitle) {
        doc
          .moveDown(0.9)
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#444444')
          .text(
            [params.jobTitle, params.companyName].filter(Boolean).join(' — '),
            { align: 'left' },
          );
      }

      doc
        .moveDown(1.1)
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#111111')
        .text(params.coverLetter, {
          align: 'left',
          lineGap: 5,
          paragraphGap: 8,
        });

      doc.end();
    });
  }

  async generatedCvPdf(params: {
    content: HydratedGeneratedCvExport;
    layout?: CvPdfLayout | string;
  }): Promise<Buffer> {
    const layout = normalizeCvPdfLayout(params.layout);
    const document =
      layout === 'modern'
        ? createElement(ModernCvDocument, { cv: params.content })
        : createElement(ClassicCvDocument, { cv: params.content });

    const buffer = await renderToBuffer(
      document as ReactElement<DocumentProps>,
    );
    if (!buffer.length) {
      throw new AppError('PDF_RENDER_FAILED', 'Generated CV PDF was empty', 500);
    }
    return buffer;
  }
}

export function normalizeCvPdfLayout(
  layout?: CvPdfLayout | string | null,
): CvPdfLayout {
  if (layout == null || layout === '') {
    return DEFAULT_CV_PDF_LAYOUT;
  }
  if ((CV_PDF_LAYOUTS as readonly string[]).includes(layout)) {
    return layout as CvPdfLayout;
  }
  throw new AppError(
    'VALIDATION_ERROR',
    `layout: Invalid enum value. Expected ${CV_PDF_LAYOUTS.join(' | ')}`,
    400,
    { layout },
  );
}

function formatCoverLetterDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
