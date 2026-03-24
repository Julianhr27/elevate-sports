/**
 * @file healthService.test.js
 * @description Tests para el servicio de HealthSnapshots.
 * @author @QA (Sara)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { takeHealthSnapshot, getSnapshots, getAthleteHealthHistory, getLatestPlantelHealth, getAtRiskAthletes, clearSnapshots } from "../services/healthService";

// jsdom provides localStorage — just clear before each test
beforeEach(() => {
  localStorage.clear();
});

describe("takeHealthSnapshot", () => {
  it("genera snapshots para atletas presentes", () => {
    const athletes = [
      { id:1, name:"Carlos", status:"P", rpe:7 },
      { id:2, name:"David", status:"P", rpe:3 },
      { id:3, name:"Miguel", status:"A", rpe:null }, // ausente, no incluido
    ];
    const result = takeHealthSnapshot(athletes, [], 1);
    expect(result.length).toBe(2);
    expect(result[0].athleteId).toBe(1);
    expect(result[0].sessionNum).toBe(1);
    expect(result[0].salud).toBeDefined();
    expect(result[0].riskLevel).toBeDefined();
  });

  it("persiste snapshots en localStorage", () => {
    const athletes = [{ id:1, name:"Test", status:"P", rpe:5 }];
    takeHealthSnapshot(athletes, [], 1);
    const stored = getSnapshots();
    expect(stored.length).toBe(1);
    expect(stored[0].athleteId).toBe(1);
  });

  it("acumula snapshots entre llamadas", () => {
    const a = [{ id:1, name:"A", status:"P", rpe:5 }];
    takeHealthSnapshot(a, [], 1);
    takeHealthSnapshot(a, [], 2);
    expect(getSnapshots().length).toBe(2);
  });

  it("maneja plantel sin presentes", () => {
    const athletes = [{ id:1, name:"A", status:"A", rpe:null }];
    const result = takeHealthSnapshot(athletes, [], 1);
    expect(result.length).toBe(0);
  });
});

describe("getAthleteHealthHistory", () => {
  it("filtra por athleteId", () => {
    const a1 = [{ id:1, name:"A", status:"P", rpe:5 }];
    const a2 = [{ id:2, name:"B", status:"P", rpe:8 }];
    takeHealthSnapshot(a1, [], 1);
    takeHealthSnapshot(a2, [], 2);
    const history = getAthleteHealthHistory(1);
    expect(history.length).toBe(1);
    expect(history[0].athleteId).toBe(1);
  });

  it("limita resultados", () => {
    const a = [{ id:1, name:"A", status:"P", rpe:5 }];
    for (let i = 0; i < 10; i++) takeHealthSnapshot(a, [], i);
    const history = getAthleteHealthHistory(1, 3);
    expect(history.length).toBe(3);
  });

  it("retorna vacio si no hay snapshots del atleta", () => {
    expect(getAthleteHealthHistory(999).length).toBe(0);
  });
});

describe("getLatestPlantelHealth", () => {
  it("retorna ultimo snapshot por atleta", () => {
    const athletes = [
      { id:1, name:"A", status:"P", rpe:3 },
      { id:2, name:"B", status:"P", rpe:9 },
    ];
    takeHealthSnapshot(athletes, [], 1);
    // Segundo snapshot con RPE diferente
    athletes[0].rpe = 8;
    takeHealthSnapshot(athletes, [], 2);

    const map = getLatestPlantelHealth();
    expect(map.size).toBe(2);
    // El ultimo snapshot de id:1 deberia tener rpe=8
    expect(map.get(1).rpeActual).toBe(8);
  });
});

describe("getAtRiskAthletes", () => {
  it("identifica atletas en riesgo (salud < 30)", () => {
    const athletes = [
      { id:1, name:"A", status:"P", rpe:9 },  // salud = 100-90 = 10 → riesgo
      { id:2, name:"B", status:"P", rpe:2 },  // salud = 100-20 = 80 → optimo
    ];
    takeHealthSnapshot(athletes, [], 1);
    const atRisk = getAtRiskAthletes();
    expect(atRisk.length).toBe(1);
    expect(atRisk[0].athleteId).toBe(1);
    expect(atRisk[0].riskLevel).toBe("riesgo");
  });

  it("retorna vacio si no hay riesgo", () => {
    const athletes = [{ id:1, name:"A", status:"P", rpe:2 }];
    takeHealthSnapshot(athletes, [], 1);
    expect(getAtRiskAthletes().length).toBe(0);
  });
});

describe("clearSnapshots", () => {
  it("limpia todos los snapshots", () => {
    const a = [{ id:1, name:"A", status:"P", rpe:5 }];
    takeHealthSnapshot(a, [], 1);
    expect(getSnapshots().length).toBe(1);
    clearSnapshots();
    expect(getSnapshots().length).toBe(0);
  });
});

describe("sanitize.js - sanitizeText via DOMPurify", () => {
  // Import here to also test sanitize
  it("strips HTML tags", async () => {
    const { sanitizeText } = await import("../utils/sanitize");
    expect(sanitizeText("<script>alert(1)</script>")).toBe("");
    expect(sanitizeText("Hello <b>world</b>")).toBe("Hello world");
  });

  it("strips event handlers", async () => {
    const { sanitizeText } = await import("../utils/sanitize");
    expect(sanitizeText('<img onerror="alert(1)">')).toBe("");
  });

  it("handles non-string input", async () => {
    const { sanitizeText } = await import("../utils/sanitize");
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
  });

  it("sanitizePhone only allows digits and separators", async () => {
    const { sanitizePhone } = await import("../utils/sanitize");
    expect(sanitizePhone("300 <script>123")).toBe("300 123");
    expect(sanitizePhone("+57 (300) 123-4567")).toBe("+57 (300) 123-4567");
  });
});
