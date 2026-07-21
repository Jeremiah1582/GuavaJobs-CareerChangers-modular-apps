import type { ReactNode } from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { HydratedGeneratedCvExport } from '../../shared/schemas/generated-cv.schema';

export function formatDateRange(
  start?: string | null,
  end?: string | null,
): string {
  const s = start?.trim() || '';
  if (!s) return '';
  const e = end?.trim() || 'Present';
  return `${s} – ${e}`;
}

export function contactLine(basics: HydratedGeneratedCvExport['basics']): string {
  const parts: string[] = [];
  if (basics.email) parts.push(basics.email);
  if (basics.phone) parts.push(basics.phone);
  const city = basics.location?.city?.trim();
  const country = basics.location?.country?.trim();
  if (city || country) {
    parts.push([city, country].filter(Boolean).join(', '));
  }
  for (const p of basics.profiles ?? []) {
    if (p.url) parts.push(p.url);
  }
  return parts.join(' · ');
}

export function skillNames(cv: HydratedGeneratedCvExport): string {
  const fromSkills = (cv.skills ?? []).flatMap((s) => {
    const kws = s.keywords?.length ? s.keywords : [];
    return kws.length ? [`${s.name}: ${kws.join(', ')}`] : [s.name];
  });
  const competencies = cv.coreCompetencies ?? [];
  const merged = [...competencies, ...fromSkills];
  return [...new Set(merged)].join(' · ');
}

/** Shared ATS-safe section chrome used by both layouts. */
export const sharedStyles = StyleSheet.create({
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  body: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#111111',
  },
  muted: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#444444',
  },
  item: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    flexGrow: 1,
    flexShrink: 1,
  },
  bullet: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    marginLeft: 10,
    marginTop: 2,
    lineHeight: 1.35,
  },
});

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={sharedStyles.section}>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View>
      {items.map((item, i) => (
        <Text key={`${i}-${item.slice(0, 24)}`} style={sharedStyles.bullet}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

export function CvBodySections({ cv }: { cv: HydratedGeneratedCvExport }) {
  const skills = skillNames(cv);

  return (
    <>
      {cv.summary ? (
        <Section title="Summary">
          <Text style={sharedStyles.body}>{cv.summary}</Text>
        </Section>
      ) : null}

      {cv.work?.length ? (
        <Section title="Experience">
          {cv.work.map((job, i) => (
            <View key={`${job.name}-${job.position}-${i}`} style={sharedStyles.item}>
              <View style={sharedStyles.itemHeader}>
                <Text style={sharedStyles.itemTitle}>
                  {job.position} — {job.name}
                </Text>
                <Text style={sharedStyles.muted}>
                  {formatDateRange(job.startDate, job.endDate)}
                </Text>
              </View>
              {job.location ? (
                <Text style={sharedStyles.muted}>{job.location}</Text>
              ) : null}
              <BulletList items={job.highlights ?? []} />
            </View>
          ))}
        </Section>
      ) : null}

      {cv.education?.length ? (
        <Section title="Education">
          {cv.education.map((ed, i) => {
            const degree = [ed.studyType, ed.area].filter(Boolean).join(', ');
            return (
              <View
                key={`${ed.institution}-${i}`}
                style={sharedStyles.item}
              >
                <View style={sharedStyles.itemHeader}>
                  <Text style={sharedStyles.itemTitle}>
                    {ed.institution}
                    {degree ? ` — ${degree}` : ''}
                  </Text>
                  <Text style={sharedStyles.muted}>
                    {formatDateRange(ed.startDate, ed.endDate)}
                  </Text>
                </View>
              </View>
            );
          })}
        </Section>
      ) : null}

      {skills ? (
        <Section title="Skills">
          <Text style={sharedStyles.body}>{skills}</Text>
        </Section>
      ) : null}

      {cv.projects?.length ? (
        <Section title="Projects">
          {cv.projects.map((p, i) => (
            <View key={`${p.name}-${i}`} style={sharedStyles.item}>
              <View style={sharedStyles.itemHeader}>
                <Text style={sharedStyles.itemTitle}>{p.name}</Text>
                <Text style={sharedStyles.muted}>
                  {formatDateRange(p.startDate, p.endDate)}
                </Text>
              </View>
              {p.description ? (
                <Text style={sharedStyles.body}>{p.description}</Text>
              ) : null}
              <BulletList items={p.highlights ?? []} />
            </View>
          ))}
        </Section>
      ) : null}

      {cv.certificates?.length ? (
        <Section title="Certificates">
          {cv.certificates.map((c, i) => (
            <View key={`${c.name}-${i}`} style={sharedStyles.item}>
              <Text style={sharedStyles.itemTitle}>
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ''}
              </Text>
              {c.date ? (
                <Text style={sharedStyles.muted}>{c.date}</Text>
              ) : null}
            </View>
          ))}
        </Section>
      ) : null}

      {cv.languages?.length ? (
        <Section title="Languages">
          <Text style={sharedStyles.body}>
            {cv.languages
              .map((l) =>
                l.fluency ? `${l.language} (${l.fluency})` : l.language,
              )
              .join(' · ')}
          </Text>
        </Section>
      ) : null}

      {cv.awards?.length ? (
        <Section title="Awards">
          {cv.awards.map((a, i) => (
            <View key={`${a.title}-${i}`} style={sharedStyles.item}>
              <Text style={sharedStyles.itemTitle}>
                {a.title}
                {a.awarder ? ` — ${a.awarder}` : ''}
              </Text>
              {a.summary ? (
                <Text style={sharedStyles.body}>{a.summary}</Text>
              ) : null}
            </View>
          ))}
        </Section>
      ) : null}

      {cv.volunteer?.length ? (
        <Section title="Volunteer">
          {cv.volunteer.map((v, i) => (
            <View key={`${v.organization}-${i}`} style={sharedStyles.item}>
              <View style={sharedStyles.itemHeader}>
                <Text style={sharedStyles.itemTitle}>
                  {v.position
                    ? `${v.position} — ${v.organization}`
                    : v.organization}
                </Text>
                <Text style={sharedStyles.muted}>
                  {formatDateRange(v.startDate, v.endDate)}
                </Text>
              </View>
              {v.summary ? (
                <Text style={sharedStyles.body}>{v.summary}</Text>
              ) : null}
              <BulletList items={v.highlights ?? []} />
            </View>
          ))}
        </Section>
      ) : null}
    </>
  );
}
