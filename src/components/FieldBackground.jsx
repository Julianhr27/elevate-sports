export default function FieldBackground() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden" }}>
      <svg viewBox="0 0 900 620" preserveAspectRatio="xMidYMid slice" style={{ width:"100%", height:"100%", display:"block" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fl1" cx="12%" cy="6%" r="40%">
            <stop offset="0%" stopColor="#e8f5c8" stopOpacity="0.55"/>
            <stop offset="50%" stopColor="#c8e870" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="fl2" cx="88%" cy="6%" r="40%">
            <stop offset="0%" stopColor="#e8f5c8" stopOpacity="0.55"/>
            <stop offset="50%" stopColor="#c8e870" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="fl3" cx="12%" cy="94%" r="38%">
            <stop offset="0%" stopColor="#fffde0" stopOpacity="0.38"/>
            <stop offset="50%" stopColor="#ffe870" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="fl4" cx="88%" cy="94%" r="38%">
            <stop offset="0%" stopColor="#fffde0" stopOpacity="0.38"/>
            <stop offset="50%" stopColor="#ffe870" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="flc" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1e4a1a"/>
            <stop offset="60%" stopColor="#0f2a0c"/>
            <stop offset="100%" stopColor="#040904"/>
          </radialGradient>
          <radialGradient id="flspot" cx="50%" cy="50%" r="35%">
            <stop offset="0%" stopColor="#2a5e22" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#2a5e22" stopOpacity="0"/>
          </radialGradient>
        </defs>

        <rect width="900" height="620" fill="#040904"/>
        <rect x="0" y="0" width="900" height="620" fill="url(#flc)"/>
        <rect x="0" y="0" width="900" height="620" fill="url(#flspot)"/>

        <rect x="0" y="0" width="450" height="310" fill="#1a3d14" opacity="0.35"/>
        <rect x="450" y="0" width="450" height="310" fill="#163610" opacity="0.35"/>
        <rect x="0" y="310" width="450" height="310" fill="#163610" opacity="0.35"/>
        <rect x="450" y="310" width="450" height="310" fill="#1a3d14" opacity="0.35"/>

        <rect x="55" y="25" width="790" height="570" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2"/>
        <line x1="450" y1="25" x2="450" y2="595" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5"/>
        <circle cx="450" cy="310" r="78" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5"/>
        <circle cx="450" cy="310" r="4" fill="rgba(255,255,255,0.3)"/>
        <rect x="55" y="170" width="140" height="280" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5"/>
        <rect x="705" y="170" width="140" height="280" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5"/>
        <rect x="55" y="230" width="62" height="160" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        <rect x="783" y="230" width="62" height="160" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        <circle cx="450" cy="25" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        <circle cx="450" cy="595" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        <line x1="55" y1="310" x2="195" y2="310" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        <line x1="705" y1="310" x2="845" y2="310" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>

        <rect x="0" y="0" width="900" height="620" fill="url(#fl1)"/>
        <rect x="0" y="0" width="900" height="620" fill="url(#fl2)"/>
        <rect x="0" y="0" width="900" height="620" fill="url(#fl3)"/>
        <rect x="0" y="0" width="900" height="620" fill="url(#fl4)"/>

        <rect x="95" y="0" width="12" height="52" fill="rgba(255,253,180,0.7)"/>
        <rect x="110" y="0" width="5" height="38" fill="rgba(255,253,180,0.4)"/>
        <rect x="82" y="0" width="5" height="38" fill="rgba(255,253,180,0.35)"/>

        <rect x="783" y="0" width="12" height="52" fill="rgba(255,253,180,0.7)"/>
        <rect x="798" y="0" width="5" height="38" fill="rgba(255,253,180,0.4)"/>
        <rect x="770" y="0" width="5" height="38" fill="rgba(255,253,180,0.35)"/>

        <rect x="95" y="578" width="12" height="42" fill="rgba(255,253,180,0.45)"/>
        <rect x="110" y="588" width="5" height="32" fill="rgba(255,253,180,0.25)"/>
        <rect x="783" y="578" width="12" height="42" fill="rgba(255,253,180,0.45)"/>
        <rect x="770" y="588" width="5" height="32" fill="rgba(255,253,180,0.25)"/>

        <line x1="107" y1="0" x2="55" y2="25" stroke="rgba(255,253,180,0.3)" strokeWidth="1.5"/>
        <line x1="789" y1="0" x2="845" y2="25" stroke="rgba(255,253,180,0.3)" strokeWidth="1.5"/>
        <line x1="107" y1="620" x2="55" y2="595" stroke="rgba(255,253,180,0.2)" strokeWidth="1"/>
        <line x1="789" y1="620" x2="845" y2="595" stroke="rgba(255,253,180,0.2)" strokeWidth="1"/>

        <ellipse cx="107" cy="0" rx="60" ry="45" fill="rgba(255,253,180,0.12)"/>
        <ellipse cx="793" cy="0" rx="60" ry="45" fill="rgba(255,253,180,0.12)"/>
        <ellipse cx="107" cy="620" rx="50" ry="40" fill="rgba(255,253,180,0.08)"/>
        <ellipse cx="793" cy="620" rx="50" ry="40" fill="rgba(255,253,180,0.08)"/>

        <rect x="0" y="0" width="900" height="620" fill="rgba(0,0,0,0.22)"/>
      </svg>
    </div>
  );
}
