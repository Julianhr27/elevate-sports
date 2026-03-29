/**
 * @component DrawingToolbar
 * @description Barra de herramientas de dibujo — v9.1 BOTTOM BAR.
 * Posicionada en el borde inferior del campo (como TacticalPad).
 * No roba ancho lateral al campo — centrada horizontalmente.
 * Herramientas en fila horizontal, colores en fila horizontal.
 * Panel expandible hacia arriba con AnimatePresence.
 *
 * @prop {object}   drawingEngine - Retorno de useDrawingEngine()
 * @prop {Function} onClearAll    - Callback para "Limpiar todo"
 */

"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE as C } from "../../../constants/palette";
import { DRAW_COLORS } from "../../../hooks/useDrawingEngine";

/** Definiciones de herramientas */
const TOOLS = [
  {
    id: "arrow",
    label: "Flecha",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15 3 L10 3 M15 3 L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "curve",
    label: "Curva",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M3 15 Q9 3 15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M15 6 L11 4 M15 6 L14 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "zone",
    label: "Zona",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <ellipse cx="9" cy="9" rx="6.5" ry="4.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <text x="9" y="12" textAnchor="middle" fontSize="6" fill="currentColor" fontWeight="700">P</text>
      </svg>
    ),
  },
  {
    id: "cut",
    label: "Corte",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 2" />
        <circle cx="3" cy="9" r="1.5" fill="currentColor" />
        <circle cx="15" cy="9" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "free",
    label: "Libre",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M3 14 C5 10, 7 12, 9 8 C11 4, 13 6, 15 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "eraser",
    label: "Borrar",
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M10 4 L14 8 L7 15 L3 15 L3 11 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
        <line x1="8" y1="6" x2="12" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="3" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** Icono de papelera */
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M5 3 L6 1 L10 1 L11 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="0.4" />
    <path d="M4 5 L4.5 14 L11.5 14 L12 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="7" x2="7" y2="12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
    <line x1="9" y1="7" x2="9" y2="12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const DrawingToolbar = memo(function DrawingToolbar({ drawingEngine, onClearAll }) {
  const { activeTool, setActiveTool, activeColor, setActiveColor } = drawingEngine;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToolClick = (toolId) => {
    setActiveTool((prev) => (prev === toolId ? null : toolId));
    if (!isExpanded) setIsExpanded(true);
  };

  const isAnyToolActive = activeTool !== null;

  return (
    /* Posicionado en el borde inferior del campo, centrado horizontalmente */
    <div style={{
      position: "absolute",
      bottom: 8,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      pointerEvents: "none", // el contenedor no intercepta clicks
    }}>

      {/* Panel expandido — aparece encima de la barra al abrir */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              pointerEvents: "auto",
              background: "rgba(5,8,16,0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10,
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Colores neón — fila horizontal */}
            <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
              {DRAW_COLORS.map((c) => {
                const isSelected = activeColor === c.hex;
                return (
                  <motion.div
                    key={c.id}
                    onClick={() => setActiveColor(c.hex)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.88 }}
                    title={c.label}
                    style={{
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      borderRadius: 6,
                      background: isSelected ? `${c.hex}14` : "transparent",
                    }}
                  >
                    <div style={{
                      width: isSelected ? 20 : 16,
                      height: isSelected ? 20 : 16,
                      borderRadius: "50%",
                      background: c.hex,
                      border: isSelected ? `2px solid rgba(255,255,255,0.9)` : "1.5px solid transparent",
                      boxShadow: isSelected
                        ? `0 0 10px ${c.hex}, 0 0 18px ${c.hex}66`
                        : `0 0 5px ${c.hex}44`,
                      transition: "all 0.12s",
                    }} />
                  </motion.div>
                );
              })}

              {/* Separador vertical */}
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />

              {/* Botón limpiar todo */}
              <motion.div
                onClick={onClearAll}
                whileHover={{ scale: 1.12, background: "rgba(226,75,74,0.18)" }}
                whileTap={{ scale: 0.9 }}
                title="Limpiar todos los trazados"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: "rgba(226,75,74,0.08)",
                  border: "1px solid rgba(226,75,74,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#E24B4A",
                  transition: "background 0.14s",
                }}
              >
                <TrashIcon />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra principal — herramientas + toggle */}
      <div style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 3,
        background: "rgba(5,8,16,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${isAnyToolActive ? `${activeColor}44` : "rgba(255,255,255,0.09)"}`,
        borderRadius: 28,
        padding: "5px 8px",
        boxShadow: isAnyToolActive
          ? `0 4px 20px rgba(0,0,0,0.65), 0 0 12px ${activeColor}22`
          : "0 4px 20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}>
        {/* Herramientas en fila */}
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <motion.div
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              title={tool.label}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: isActive
                  ? `linear-gradient(135deg, ${activeColor}28, ${activeColor}0e)`
                  : "transparent",
                border: isActive
                  ? `1.5px solid ${activeColor}`
                  : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: isActive ? activeColor : "rgba(255,255,255,0.45)",
                boxShadow: isActive
                  ? `0 0 12px ${activeColor}55, 0 0 6px ${activeColor}33`
                  : "none",
                transition: "background 0.12s, border 0.12s, color 0.12s, box-shadow 0.12s",
                flexShrink: 0,
              }}
            >
              {tool.icon}
            </motion.div>
          );
        })}

        {/* Separador */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 3px", flexShrink: 0 }} />

        {/* Botón toggle paleta de colores */}
        <motion.div
          onClick={() => setIsExpanded(v => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          title={isExpanded ? "Cerrar colores" : "Colores"}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: isExpanded
              ? `${activeColor}18`
              : "transparent",
            border: isExpanded
              ? `1.5px solid ${activeColor}66`
              : "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.14s",
            flexShrink: 0,
          }}
        >
          {/* Círculo de color activo */}
          <div style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: activeColor,
            boxShadow: `0 0 8px ${activeColor}88`,
            border: "1.5px solid rgba(255,255,255,0.7)",
          }} />
        </motion.div>
      </div>
    </div>
  );
});

export default DrawingToolbar;
