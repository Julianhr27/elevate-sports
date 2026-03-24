/**
 * @component ConfirmModal
 * @description Modal de confirmacion reutilizable estilo FIFA.
 * @author @Desarrollador (Andres)
 */
import { motion } from "framer-motion";
import { PALETTE as C } from "../constants/palette";

export default function ConfirmModal({ title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", accentColor = C.neon, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        transition={{ type:"spring", stiffness:300, damping:25 }}
        onClick={e => e.stopPropagation()}
        style={{ background:"rgba(10,16,32,0.98)", border:`1px solid ${C.border}`, borderTop:`3px solid ${accentColor}`, padding:"24px 28px", maxWidth:380, width:"90%" }}
      >
        <div style={{ fontSize:14, fontWeight:900, color:"white", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.6, marginBottom:24 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <div onClick={onCancel} style={{ flex:1, padding:"10px 16px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", textAlign:"center", cursor:"pointer", border:`1px solid ${C.border}`, color:C.textMuted }}>
            {cancelLabel}
          </div>
          <div onClick={onConfirm} style={{ flex:1, padding:"10px 16px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", textAlign:"center", cursor:"pointer", background:accentColor, color:"#0a0a0a" }}>
            {confirmLabel}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
