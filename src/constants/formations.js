/**
 * @module formations
 * @description Formaciones tacticas para Elevate Sports.
 *
 * Se exportan DOS formatos porque se usan en contextos distintos:
 * - FORMATIONS_VERTICAL: posiciones como strings con "%" (para GestionPlantilla, campo vertical)
 * - FORMATIONS_HORIZONTAL: posiciones como numeros + label (para TacticalBoard, campo horizontal con drag&drop)
 *
 * @version 1.0
 * @author Elevate Sports
 */

// ─────────────────────────────────────────────
// FORMACIONES VERTICALES (campo vertical, posiciones en %)
// Usadas en GestionPlantilla > TacticalBoardView
// ─────────────────────────────────────────────
export const FORMATIONS_VERTICAL = {
  "4-3-3": [
    { posCode:"GK", left:"50%", top:"88%" },
    { posCode:"LB", left:"14%", top:"72%" },
    { posCode:"CB", left:"34%", top:"74%" },
    { posCode:"CB", left:"66%", top:"74%" },
    { posCode:"RB", left:"86%", top:"72%" },
    { posCode:"CM", left:"25%", top:"52%" },
    { posCode:"CM", left:"50%", top:"48%" },
    { posCode:"CM", left:"75%", top:"52%" },
    { posCode:"LW", left:"18%", top:"22%" },
    { posCode:"ST", left:"50%", top:"15%" },
    { posCode:"RW", left:"82%", top:"22%" },
  ],
  "4-4-2": [
    { posCode:"GK", left:"50%", top:"88%" },
    { posCode:"LB", left:"14%", top:"74%" },
    { posCode:"CB", left:"34%", top:"76%" },
    { posCode:"CB", left:"66%", top:"76%" },
    { posCode:"RB", left:"86%", top:"74%" },
    { posCode:"LM", left:"14%", top:"52%" },
    { posCode:"CM", left:"36%", top:"54%" },
    { posCode:"CM", left:"64%", top:"54%" },
    { posCode:"RM", left:"86%", top:"52%" },
    { posCode:"ST", left:"36%", top:"18%" },
    { posCode:"ST", left:"64%", top:"18%" },
  ],
  "3-5-2": [
    { posCode:"GK", left:"50%", top:"88%" },
    { posCode:"CB", left:"25%", top:"74%" },
    { posCode:"CB", left:"50%", top:"76%" },
    { posCode:"CB", left:"75%", top:"74%" },
    { posCode:"LM", left:"10%", top:"52%" },
    { posCode:"CM", left:"30%", top:"54%" },
    { posCode:"CM", left:"50%", top:"49%" },
    { posCode:"CM", left:"70%", top:"54%" },
    { posCode:"RM", left:"90%", top:"52%" },
    { posCode:"ST", left:"36%", top:"18%" },
    { posCode:"ST", left:"64%", top:"18%" },
  ],
  "4-2-3-1": [
    { posCode:"GK", left:"50%", top:"88%" },
    { posCode:"LB", left:"14%", top:"74%" },
    { posCode:"CB", left:"34%", top:"76%" },
    { posCode:"CB", left:"66%", top:"76%" },
    { posCode:"RB", left:"86%", top:"74%" },
    { posCode:"DM", left:"38%", top:"60%" },
    { posCode:"DM", left:"62%", top:"60%" },
    { posCode:"LW", left:"18%", top:"38%" },
    { posCode:"CAM",left:"50%", top:"35%" },
    { posCode:"RW", left:"82%", top:"38%" },
    { posCode:"ST", left:"50%", top:"15%" },
  ],
  "5-3-2": [
    { posCode:"GK", left:"50%", top:"88%" },
    { posCode:"LWB",left:"10%", top:"70%" },
    { posCode:"CB", left:"28%", top:"76%" },
    { posCode:"CB", left:"50%", top:"78%" },
    { posCode:"CB", left:"72%", top:"76%" },
    { posCode:"RWB",left:"90%", top:"70%" },
    { posCode:"CM", left:"30%", top:"50%" },
    { posCode:"CM", left:"50%", top:"47%" },
    { posCode:"CM", left:"70%", top:"50%" },
    { posCode:"ST", left:"36%", top:"18%" },
    { posCode:"ST", left:"64%", top:"18%" },
  ],
};

// ─────────────────────────────────────────────
// FORMACIONES HORIZONTALES (campo horizontal, posiciones numericas)
// Usadas en TacticalBoard (drag & drop)
// left: 5% (porteria propia) -> 95% (porteria rival)
// top:  5% (arriba) -> 95% (abajo)
// ─────────────────────────────────────────────
export const FORMATIONS_HORIZONTAL = {
  "4-3-3": {
    label: "Ataque",
    positions: [
      { posCode:"GK",  left:6,  top:50 },
      { posCode:"LB",  left:22, top:15 },
      { posCode:"CB",  left:24, top:38 },
      { posCode:"CB",  left:24, top:62 },
      { posCode:"RB",  left:22, top:85 },
      { posCode:"CM",  left:45, top:25 },
      { posCode:"CM",  left:47, top:50 },
      { posCode:"CM",  left:45, top:75 },
      { posCode:"LW",  left:72, top:12 },
      { posCode:"ST",  left:78, top:50 },
      { posCode:"RW",  left:72, top:88 },
    ],
  },
  "4-4-2": {
    label: "Holding",
    positions: [
      { posCode:"GK",  left:6,  top:50 },
      { posCode:"LB",  left:22, top:15 },
      { posCode:"LCB", left:24, top:38 },
      { posCode:"RCB", left:24, top:62 },
      { posCode:"RB",  left:22, top:85 },
      { posCode:"LM",  left:45, top:15 },
      { posCode:"LDM", left:47, top:38 },
      { posCode:"RDM", left:47, top:62 },
      { posCode:"RM",  left:45, top:85 },
      { posCode:"LS",  left:76, top:33 },
      { posCode:"RS",  left:76, top:67 },
    ],
  },
  "3-5-2": {
    label: "Compacto",
    positions: [
      { posCode:"GK",  left:6,  top:50 },
      { posCode:"CB",  left:22, top:25 },
      { posCode:"CB",  left:24, top:50 },
      { posCode:"CB",  left:22, top:75 },
      { posCode:"LWB", left:42, top:10 },
      { posCode:"CM",  left:44, top:32 },
      { posCode:"CM",  left:47, top:50 },
      { posCode:"CM",  left:44, top:68 },
      { posCode:"RWB", left:42, top:90 },
      { posCode:"ST",  left:76, top:33 },
      { posCode:"ST",  left:76, top:67 },
    ],
  },
  "4-2-3-1": {
    label: "Control",
    positions: [
      { posCode:"GK",  left:6,  top:50 },
      { posCode:"LB",  left:22, top:15 },
      { posCode:"CB",  left:24, top:38 },
      { posCode:"CB",  left:24, top:62 },
      { posCode:"RB",  left:22, top:85 },
      { posCode:"DM",  left:40, top:38 },
      { posCode:"DM",  left:40, top:62 },
      { posCode:"LW",  left:58, top:18 },
      { posCode:"CAM", left:62, top:50 },
      { posCode:"RW",  left:58, top:82 },
      { posCode:"ST",  left:80, top:50 },
    ],
  },
  "5-3-2": {
    label: "Defensivo",
    positions: [
      { posCode:"GK",  left:6,  top:50 },
      { posCode:"LWB", left:20, top:8  },
      { posCode:"CB",  left:23, top:28 },
      { posCode:"CB",  left:25, top:50 },
      { posCode:"CB",  left:23, top:72 },
      { posCode:"RWB", left:20, top:92 },
      { posCode:"CM",  left:46, top:28 },
      { posCode:"CM",  left:48, top:50 },
      { posCode:"CM",  left:46, top:72 },
      { posCode:"ST",  left:76, top:33 },
      { posCode:"ST",  left:76, top:67 },
    ],
  },
};
