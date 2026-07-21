import {
  CV_PDF_LAYOUTS,
  DEFAULT_CV_PDF_LAYOUT,
} from '../constants/cv-pdf-layouts';
import { generatedCvPdfQuerySchema } from './cv-pdf.schema';

describe('cv-pdf.schema', () => {
  it('defaults layout to classic', () => {
    expect(generatedCvPdfQuerySchema.parse({})).toEqual({
      layout: DEFAULT_CV_PDF_LAYOUT,
    });
  });

  it('accepts modern layout', () => {
    expect(generatedCvPdfQuerySchema.parse({ layout: 'modern' })).toEqual({
      layout: 'modern',
    });
  });

  it('rejects unknown layout', () => {
    expect(() =>
      generatedCvPdfQuerySchema.parse({ layout: 'fancy' }),
    ).toThrow();
  });

  it('exports both layout ids', () => {
    expect(CV_PDF_LAYOUTS).toEqual(['classic', 'modern']);
  });
});
