import {
  CV_PDF_LAYOUTS,
  DEFAULT_CV_PDF_LAYOUT,
} from '../constants/cv-pdf-layouts';
import { generatedCvPdfQuerySchema } from './cv-pdf.schema';

describe('cv-pdf.schema', () => {
  it('defaults layout to noir', () => {
    expect(generatedCvPdfQuerySchema.parse({})).toEqual({
      layout: DEFAULT_CV_PDF_LAYOUT,
    });
    expect(DEFAULT_CV_PDF_LAYOUT).toBe('noir');
  });

  it('accepts classic and modern layouts', () => {
    expect(generatedCvPdfQuerySchema.parse({ layout: 'classic' })).toEqual({
      layout: 'classic',
    });
    expect(generatedCvPdfQuerySchema.parse({ layout: 'modern' })).toEqual({
      layout: 'modern',
    });
  });

  it('rejects unknown layout', () => {
    expect(() =>
      generatedCvPdfQuerySchema.parse({ layout: 'fancy' }),
    ).toThrow();
  });

  it('exports three layout ids with noir first', () => {
    expect(CV_PDF_LAYOUTS).toEqual(['noir', 'classic', 'modern']);
  });
});
