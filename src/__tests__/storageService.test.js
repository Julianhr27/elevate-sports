/**
 * @file storageService.test.js
 * @description Tests para el servicio de storage.
 * @author @QA (Sara)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { calcStats, buildSesion } from "../services/storageService";

describe("calcStats", () => {
  it("calcula stats correctamente con datos", () => {
    const athletes = [
      { id:1, status:"P", rpe:7 },
      { id:2, status:"P", rpe:8 },
      { id:3, status:"A", rpe:null },
      { id:4, status:"L", rpe:null },
    ];
    const historial = [
      { presentes:3, total:4 },
      { presentes:4, total:4 },
    ];
    const s = calcStats(athletes, historial);
    expect(s.presentes).toBe(2);
    expect(s.ausentes).toBe(1);
    expect(s.lesionados).toBe(1);
    expect(s.rpeAvg).toBe("7.5");
    expect(s.sesiones).toBe(2);
    expect(s.asistencia).toBe(88); // (3+4)/(4+4)*100 = 87.5 → 88
  });

  it("maneja plantel vacio", () => {
    const s = calcStats([], []);
    expect(s.presentes).toBe(0);
    expect(s.rpeAvg).toBe("\u2014");
    expect(s.sesiones).toBe(0);
    expect(s.asistencia).toBe(0);
  });

  it("maneja atletas sin RPE", () => {
    const athletes = [{ id:1, status:"P", rpe:null }];
    const s = calcStats(athletes, []);
    expect(s.presentes).toBe(1);
    expect(s.rpeAvg).toBe("\u2014");
  });
});

describe("buildSesion", () => {
  it("crea una sesion con datos correctos", () => {
    const athletes = [
      { id:1, status:"P", rpe:7 },
      { id:2, status:"P", rpe:9 },
      { id:3, status:"A", rpe:null },
    ];
    const historial = [{ num:5 }];
    const sesion = buildSesion(athletes, historial, "Buena sesion", "Tactica");
    expect(sesion.num).toBe(6);
    expect(sesion.presentes).toBe(2);
    expect(sesion.total).toBe(3);
    expect(sesion.rpeAvg).toBe("8.0");
    expect(sesion.tipo).toBe("Tactica");
    expect(sesion.nota).toBe("Buena sesion");
    expect(sesion.savedAt).toBeDefined();
  });

  it("maneja historial vacio (primera sesion)", () => {
    const sesion = buildSesion([], [], "Primera", "Fisico");
    expect(sesion.num).toBe(1);
    expect(sesion.presentes).toBe(0);
    expect(sesion.rpeAvg).toBeNull();
  });

  it("usa tipo default si no se provee", () => {
    const sesion = buildSesion([], [], "Nota", null);
    expect(sesion.tipo).toBe("Sesion");
  });

  it("calcula RPE promedio solo de presentes con RPE", () => {
    const athletes = [
      { id:1, status:"P", rpe:6 },
      { id:2, status:"P", rpe:null }, // presente pero sin RPE
      { id:3, status:"P", rpe:10 },
    ];
    const sesion = buildSesion(athletes, [], "Test", "Fisico");
    expect(sesion.rpeAvg).toBe("8.0"); // (6+10)/2
    expect(sesion.presentes).toBe(3);
  });
});
