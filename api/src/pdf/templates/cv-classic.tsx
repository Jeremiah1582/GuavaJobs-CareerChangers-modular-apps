import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CvPdfDocumentProps } from './types';
import { contactLine, CvBodySections, sharedStyles } from './shared';

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    fontFamily: 'Helvetica',
    color: '#111111',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#333333',
    marginBottom: 4,
  },
  contact: {
    ...sharedStyles.muted,
    marginBottom: 4,
  },
});

export function ClassicCvDocument({ cv }: CvPdfDocumentProps) {
  const contact = contactLine(cv.basics);
  const label = cv.basics.label || cv.label;

  return (
    <Document
      title={`${cv.basics.name} — CV`}
      author={cv.basics.name}
      subject={cv.meta?.tailoredFor || 'Curriculum Vitae'}
    >
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{cv.basics.name}</Text>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {contact ? <Text style={styles.contact}>{contact}</Text> : null}
        </View>
        <CvBodySections cv={cv} />
      </Page>
    </Document>
  );
}
