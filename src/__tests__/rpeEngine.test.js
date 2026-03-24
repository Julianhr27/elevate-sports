/**
 * @file rpeEngine.test.js
 * @description Tests unitarios para el motor RPE de Salud Actual.
 * Formula: SaludActual = 100 - (RPE_avg_7d * 10)
 *
 * @author @QA (Sara-QA_Seguridad)
 * @version 1.0.0
 */

import { describe, it, expect } from "vitest";
import { calcSaludActual, calcSaludPlantel, saludColor } from "../utils/rpeEngine";

// ════════════════════════════════════════════════
// calcSaludActual
// ════════════════════════════════════════════════

describe("calcSaludActual", () => {
  it("retorna salud 100 y sin_datos cuando no hay RPE", () => {
    const result = calcSaludActual(null, []);
    expect(result.salud).toBe(100);
    expect(result.riskLevel).toBe("sin_datos");
    expect(result.rpeAvg7d).toBeNull();
  });

  it("calcula correctamente con RPE actual de 5 → salud 50", () => {
    const result = calcSaludActual(5, []);
    expect(result.salud).toBe(50);
    expect(result.riskLevel).toBe("precaucion");
    expect(result.rpeAvg7d).toBe(5);
  });

  it("calcula correctamente con RPE actual de 1 → salud 90", () => {
    const result = calcSaludActual(1, []);
    expect(result.salud).toBe(90);
    expect(result.riskLevel).toBe("optimo");
  });

  it("calcula correctamente con RPE actual de 10 → salud 0", () => {
    const result = calcSaludActual(10, []);
    expect(result.salud).toBe(0);
    expect(result.riskLevel).toBe("riesgo");
  });

  it("promedia RPE actual + historial correctamente", () => {
    const historial = [
      { rpeAvg: 6, fecha: "fecha no parseable" },
      { rpeAvg: 8, fecha: "otra fecha" },
    ];
    // RPE actual=4, historial=[6,8] → avg = (4+6+8)/3 = 6 → salud = 100-60 = 40
    const result = calcSaludActual(4, historial);
    expect(result.salud).toBe(40);
    expect(result.rpeAvg7d).toBe(6);
    expect(result.riskLevel).toBe("precaucion");
  });

  it("ignora RPE fuera de rango en historial", () => {
    const historial = [
      { rpeAvg: 15, fecha: "x" }, // fuera de rango, ignorado
      { rpeAvg: 0, fecha: "x" },  // fuera de rango, ignorado
      { rpeAvg: 5, fecha: "x" },  // valido
    ];
    // RPE actual=3, validos del historial=[5] → avg = (3+5)/2 = 4 → salud = 60
    const result = calcSaludActual(3, historial);
    expect(result.salud).toBe(60);
    expect(result.riskLevel).toBe("optimo");
  });

  it("ignora RPE null y '—' en historial", () => {
    const historial = [
      { rpeAvg: null, fecha: "x" },
      { rpeAvg: "\u2014", fecha: "x" },
      { rpeAvg: 7, fecha: "x" },
    ];
    // RPE actual=null → solo historial [7] → avg=7 → salud=30
    const result = calcSaludActual(null, historial);
    expect(result.salud).toBe(30);
    expect(result.riskLevel).toBe("precaucion");
  });

  it("limita a 7 entradas maximo", () => {
    const historial = Array.from({ length: 20 }, (_, i) => ({
      rpeAvg: 5, fecha: "x",
    }));
    // RPE actual=5, + 20 del historial pero limita a 7 total
    // avg = 5, salud = 50
    const result = calcSaludActual(5, historial);
    expect(result.salud).toBe(50);
  });

  it("clamps salud entre 0 y 100", () => {
    // RPE=10 → salud=0 (no negativo)
    expect(calcSaludActual(10, []).salud).toBe(0);
    // Sin RPE → salud=100 (no mayor a 100)
    expect(calcSaludActual(null, []).salud).toBe(100);
  });

  it("retorna null para rpeAvg7d cuando no hay RPE", () => {
    expect(calcSaludActual(null, []).rpeAvg7d).toBeNull();
  });

  it("retorna rpeAvg7d con 1 decimal", () => {
    const result = calcSaludActual(7, [{ rpeAvg: 8, fecha: "x" }]);
    // avg = (7+8)/2 = 7.5
    expect(result.rpeAvg7d).toBe(7.5);
  });
});

// ════════════════════════════════════════════════
// saludColor
// ════════════════════════════════════════════════

describe("saludColor", () => {
  it("retorna verde para salud >= 60", () => {
    expect(saludColor(60)).toBe("#1D9E75");
    expect(saludColor(100)).toBe("#1D9E75");
    expect(saludColor(75)).toBe("#1D9E75");
  });

  it("retorna ambar para salud 30-59", () => {
    expect(saludColor(30)).toBe("#EF9F27");
    expect(saludColor(59)).toBe("#EF9F27");
    expect(saludColor(45)).toBe("#EF9F27");
  });

  it("retorna rojo para salud < 30", () => {
    expect(saludColor(29)).toBe("#E24B4A");
    expect(saludColor(0)).toBe("#E24B4A");
    expect(saludColor(10)).toBe("#E24B4A");
  });
});

// ════════════════════════════════════════════════
// calcSaludPlantel
// ════════════════════════════════════════════════

describe("calcSaludPlantel", () => {
  it("retorna Map con salud para cada atleta", () => {
    const athletes = [
      { id: 1, rpe: 3 },
      { id: 2, rpe: 8 },
      { id: 3, rpe: null },
    ];
    const map = calcSaludPlantel(athletes, []);
    expect(map.size).toBe(3);
    expect(map.get(1).salud).toBe(70); // 100 - 30
    expect(map.get(2).salud).toBe(20); // 100 - 80
    expect(map.get(3).riskLevel).toBe("sin_datos");
  });

  it("maneja plantel vacio", () => {
    const map = calcSaludPlantel([], []);
    expect(map.size).toBe(0);
  });

  it("incorpora historial en calculo", () => {
    const athletes = [{ id: 1, rpe: 5 }];
    const historial = [{ rpeAvg: 7, fecha: "x" }];
    const map = calcSaludPlantel(athletes, historial);
    // avg = (5+7)/2 = 6 → salud = 40
    expect(map.get(1).salud).toBe(40);
  });
});
