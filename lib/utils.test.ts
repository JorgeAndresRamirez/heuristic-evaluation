/**
 * heuristic-evaluation
 * Jorge Andrés Ramírez Sierra, Ingeniero de Software - Máster en Diseño de Experiencia de Usuario
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachmentHeader } from "./utils";

describe("attachmentHeader", () => {
  it("no rompe con el guion largo ni con tildes del nombre del proyecto demo", () => {
    const header = attachmentHeader("reporte-consolidado-App de reservas — Evaluación piloto", "pdf");
    // Los encabezados HTTP solo admiten Latin-1: ningún carácter puede pasar de 255 (el defecto original daba error 500).
    assert.ok([...header].every((char) => char.charCodeAt(0) <= 255));
    assert.match(header, /filename="reporte-consolidado-App-de-reservas-Evaluacion-piloto\.pdf"/);
    assert.match(header, /filename\*=UTF-8''/);
  });

  it("usa un nombre por defecto si el nombre queda vacío", () => {
    assert.match(attachmentHeader("———", "csv"), /filename="archivo\.csv"/);
  });
});
