/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { SEVERITY_LABELS, SCOPE_LABELS } from "@/lib/constants";
import type { EmbeddedEvidence } from "@/lib/evidence-embed";
import { getFindingPrincipleTitles } from "@/lib/finding-principles";
import type { Severity } from "@/lib/generated/prisma";
import { htmlToPlainText } from "@/lib/report-utils";

export type IndividualReportFinding = {
  id: string;
  screen: string;
  task: string;
  step: string;
  severity: Severity;
  scope: string;
  descriptionHtml: string;
  solutionHtml: string | null;
  riskAssessment: string | null;
  principles: Array<{ principle: { title: string } }>;
  evidence: EmbeddedEvidence[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  title: { fontSize: 20, marginBottom: 6, fontWeight: "bold" },
  subtitle: { fontSize: 11, marginBottom: 4, color: "#52525b" },
  meta: { fontSize: 10, color: "#71717a", marginBottom: 16 },
  finding: {
    marginBottom: 14,
    padding: 12,
    border: "1pt solid #e4e4e7",
    borderRadius: 4,
  },
  findingHeader: { fontSize: 12, fontWeight: "bold", marginBottom: 6 },
  findingMeta: { fontSize: 9, color: "#71717a", marginBottom: 6 },
  sectionLabel: { fontSize: 10, fontWeight: "bold", marginTop: 6, marginBottom: 3 },
  bodyText: { fontSize: 10, lineHeight: 1.45 },
  evidenceBlock: { marginTop: 8 },
  evidenceImage: { maxWidth: 420, maxHeight: 260, marginTop: 4, marginBottom: 4, objectFit: "contain" },
  evidenceCaption: { fontSize: 8, color: "#71717a", marginBottom: 4 },
  footer: { marginTop: 24, fontSize: 8, color: "#71717a" },
});

function FindingEvidenceBlock({ evidence }: { evidence: EmbeddedEvidence[] }) {
  if (evidence.length === 0) return null;

  return (
    <View style={styles.evidenceBlock}>
      <Text style={styles.sectionLabel}>Evidencias</Text>
      {evidence.map((item) =>
        item.type === "IMAGE" && item.dataUri ? (
          <View key={item.storagePath}>
            <Image src={item.dataUri} style={styles.evidenceImage} />
            <Text style={styles.evidenceCaption}>{item.fileName}</Text>
          </View>
        ) : (
          <Text key={item.storagePath} style={styles.evidenceCaption}>
            {item.type === "VIDEO" ? "Video adjunto" : "Archivo adjunto"}: {item.fileName}
          </Text>
        ),
      )}
    </View>
  );
}

export function IndividualPdfDocument({
  projectName,
  productName,
  evaluatorName,
  findings,
}: {
  projectName: string;
  productName: string | null;
  evaluatorName: string;
  findings: IndividualReportFinding[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte individual de evaluación heurística</Text>
        <Text style={styles.subtitle}>
          {projectName}
          {productName ? ` · ${productName}` : ""}
        </Text>
        <Text style={styles.meta}>
          Evaluador: {evaluatorName} · {findings.length} hallazgo{findings.length === 1 ? "" : "s"}
        </Text>
        <Text style={styles.meta}>
          Orden: severidad (crítico → menor), principio heurístico, pantalla, tarea y paso.
        </Text>

        {findings.length === 0 ? (
          <Text>No hay hallazgos registrados para este evaluador.</Text>
        ) : (
          findings.map((finding, index) => (
            <View key={finding.id} style={styles.finding}>
              <Text style={styles.findingHeader}>
                {index + 1}. {getFindingPrincipleTitles(finding)} — {SEVERITY_LABELS[finding.severity]}
              </Text>
              <Text style={styles.findingMeta}>
                Pantalla: {finding.screen} · Tarea: {finding.task} · Paso: {finding.step} · Alcance:{" "}
                {SCOPE_LABELS[finding.scope as keyof typeof SCOPE_LABELS] ?? finding.scope}
              </Text>
              <Text style={styles.sectionLabel}>Descripción</Text>
              <Text style={styles.bodyText}>{htmlToPlainText(finding.descriptionHtml)}</Text>
              {finding.solutionHtml ? (
                <>
                  <Text style={styles.sectionLabel}>Solución propuesta</Text>
                  <Text style={styles.bodyText}>{htmlToPlainText(finding.solutionHtml)}</Text>
                </>
              ) : null}
              {finding.riskAssessment ? (
                <>
                  <Text style={styles.sectionLabel}>Riesgos</Text>
                  <Text style={styles.bodyText}>{finding.riskAssessment}</Text>
                </>
              ) : null}
              <FindingEvidenceBlock evidence={finding.evidence} />
            </View>
          ))
        )}

        <Text style={styles.footer}>
          Jorge Andrés Ramírez Sierra — Evaluación Heurística (generado localmente)
        </Text>
      </Page>
    </Document>
  );
}
