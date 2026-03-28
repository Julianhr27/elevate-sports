/**
 * @component Toast
 * @description Sistema de notificaciones no-intrusivas.
 * Reemplaza alert() bloqueante.
 * @author @Desarrollador (Andres)
 */
import { useState, useEffect, useCallback } from "react";
import { PALETTE as C } from "../constants/palette";

let globalShow = null;

/** Muestra un toast desde cualquier parte de la app */
export function showToast(message, type = "success", duration = 3000) {
  if (globalShow) globalShow(message, type, duration);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type, duration) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  useEffect(() => { globalShow = show; return () => { globalShow = null; }; }, [show]);

  const colors = {
    success: C.green,
    error: C.danger,
    warning: C.amber,
    info: C.purple,
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{ position:"fixed", top:12, right:12, zIndex:99999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} role="alert" aria-live="assertive" style={{
          padding:"10px 20px", background:"rgba(10,16,32,0.95)",
          borderLeft:`3px solid ${colors[t.type] || C.neon}`,
          border:`1px solid ${colors[t.type] || C.neon}33`,
          color:"white", fontSize:12, fontFamily:"'Arial Narrow',Arial,sans-serif",
          pointerEvents:"auto", minWidth:220, maxWidth:360,
          animation:"toast_in 0.3s ease-out",
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toast_in{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}
