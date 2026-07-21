import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CvPdfDocumentProps } from './types';
import { contactLine, CvBodySections } from './shared';

const accent = '#1a3a4a';

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 44,
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    color: '#111111',
  },
  header: {
    backgroundColor: accent,
    paddingTop: 36,
    paddingBottom: 22,
    paddingHorizontal: 48,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#d7e4ea',
    marginBottom: 6,
  },
  contact: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#e8f0f4',
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 16,
  },
});

export function ModernCvDocument({ cv }: CvPdfDocumentProps) {
  const contact = contactLine(cv.basics);
  const label = cv.basics.label || cv.label;

  return (
    <Document
      title={`${cv.basics.name} — CV`}
      author={cv.basics.name}
      subject={cv.meta?.tailoredFor || 'Curriculum Vitae'}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{cv.basics.name}</Text>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {contact ? <Text style={styles.contact}>{contact}</Text> : null}
        </View>
        <View style={styles.body}>
          <CvBodySections cv={cv} />
        </View>
      </Page>
    </Document>
  );
}

/** Exported for tests / future theming — accent used by Modern header. */
export const MODERN_CV_ACCENT = accent;
