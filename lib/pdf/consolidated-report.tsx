/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { SEVERITY_LABELS } from "@/lib/constants";
import type { ReportProject } from "@/lib/report-builder";
import { getTopCriticalFindings } from "@/lib/consolidation";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 12, marginBottom: 16, color: "#52525b" },
  section: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: "bold" },
  item: { marginBottom: 10, padding: 10, border: "1pt solid #e4e4e7" },
  meta: { color: "#71717a", marginBottom: 4 },
});

export function ConsolidatedPdfDocument({ project }: { project: ReportProject }) {
  const top10 = getTopCriticalFindings(
    project.consolidatedFindings.map((item) => ({
      id: item.id,
      title: item.title,
      finalSeverity: item.finalSeverity,
      summaryHtml: item.summaryHtml,
    })),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte consolidado de evaluación heurística</Text>
        <Text style={styles.subtitle}>{project.name}{project.productName ? ` · ${project.productName}` : ""}</Text>
        <Text style={styles.meta}>{project.evaluators.length} evaluadores · {project.findings.length} hallazgos · {project.consolidatedFindings.length} consolidados</Text>

        <Text style={styles.section}>Top 10 problemas más críticos</Text>
        {top10.length === 0 ? (
          <Text>No hay hallazgos consolidados.</Text>
        ) : (
          top10.map((item, index) => (
            <View key={item.id} style={styles.item}>
              <Text>{index + 1}. {item.title} — {SEVERITY_LABELS[item.finalSeverity]}</Text>
            </View>
          ))
        )}

        <Text style={styles.section}>Detalle consolidado</Text>
        {project.consolidatedFindings.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text>{item.title}</Text>
            <Text style={styles.meta}>{item.principle.title} · {SEVERITY_LABELS[item.finalSeverity]}</Text>
            <Text>{item.findings.map((f) => f.evaluator.name).join(", ")}</Text>
          </View>
        ))}

        <Text style={{ marginTop: 24, fontSize: 9, color: "#71717a" }}>
          Jorge Andrés Ramírez Sierra — Evaluación Heurística (generado localmente)
        </Text>
      </Page>
    </Document>
  );
}
