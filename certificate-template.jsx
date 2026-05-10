// =========================================================
// GIM LMS — Certificate template + shared renderer
// =========================================================
// Single source of truth for certificate styling. Edited via
// AdminCertificateDesignerPage; consumed by CertificatePage.

const CERTIFICATE_DEFAULTS = {
  accent: "#7ac142",          // GIM green
  paper:  "#fdfbf6",
  ink:    "#111111",
  eyebrow: "Awarded with Excellence",
  headline: "Certificate of Completion",
  body: "has successfully completed all required lessons, assessments, and final evaluation for",
  signer1Name: "Ethan Roden",
  signer1Title: "Director of HR & Shared Services",
  signer2Name: "Brian Halverson",
  signer2Title: "Head of Training · GIM",
  showSeal: true,
  showSecondSigner: false,
  showScore: true,
  logoUrl: "assets/logo-landscape.png",
  brandTag: "Learning",
};

// Shared, fixed-size 11×8.5 in @ 96dpi → 1056×816 px certificate.
// Always rendered at full size; callers scale via CSS transform.
const CertificateRender = ({ template, course, learnerName, completedOn, score, certNo }) => {
  const t = template;

  return (
    <div className="cert-doc" style={{
      width: 1056, height: 816, position: "relative", overflow: "hidden",
      background: t.paper, color: t.ink, fontFamily: "var(--font-sans)",
      padding: 56,
      boxSizing: "border-box",
      display: "flex", flexDirection: "column",
    }}>
      {/* Modern: top accent bar + thin inner rule */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: t.accent }} />
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 12, background: t.accent }} />
      <div style={{ position: "absolute", inset: "32px 24px 24px 32px", border: `1px solid ${t.ink}22`, pointerEvents: "none" }} />

      {/* Header: brand + cert no */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {t.logoUrl && (
            <img src={t.logoUrl} alt="" style={{ height: 44, objectFit: "contain", maxWidth: 240 }} onError={(e) => { e.target.style.display = "none"; }} />
          )}
          {t.brandTag && (
            <div style={{
              fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase",
              padding: "4px 10px", border: `1px solid ${t.accent}`, color: t.accent, borderRadius: 999,
            }}>{t.brandTag}</div>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#5f635f", letterSpacing: "0.08em" }}>
          <div>CERTIFICATE NO.</div>
          <div style={{ fontFamily: "var(--font-mono)", color: t.ink, fontWeight: 700, marginTop: 2 }}>{certNo}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 32px" }}>
        {/* Headline (bold, large): "Certificate of Completion" — single line */}
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 52, lineHeight: 1.05,
          color: t.ink, letterSpacing: "-0.01em", fontWeight: 700,
          whiteSpace: "nowrap",
        }}>{t.headline}</div>

        {/* Eyebrow (bold uppercase): "Awarded with Excellence" */}
        <div style={{
          marginTop: 14,
          fontFamily: "var(--font-sans)", fontSize: 16, letterSpacing: "0.32em",
          color: t.accent, fontWeight: 800, textTransform: "uppercase",
        }}>{t.eyebrow}</div>

        <div style={{ marginTop: 38, fontSize: 14, color: "#5f635f", letterSpacing: "0.08em", textTransform: "uppercase" }}>This certifies that</div>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 60, lineHeight: 1.1, marginTop: 6,
          color: t.ink, paddingBottom: 12,
          borderBottom: `2px solid ${t.accent}`, minWidth: 540,
        }}>{learnerName}</div>

        <div style={{ marginTop: 26, fontSize: 15, color: "#3a3a3a", maxWidth: 720, lineHeight: 1.5 }}>{t.body}</div>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1.2, marginTop: 14,
          color: t.ink, fontWeight: 600,
        }}>{course.title}</div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1, gap: 24 }}>
        <div style={{ display: "flex", gap: 36, flex: 1, justifyContent: "flex-start" }}>
          <SigBlock value={t.signer1Name}  label={t.signer1Title} accent={t.accent} ink={t.ink} />
          {t.showSecondSigner && (
            <SigBlock value={t.signer2Name} label={t.signer2Title} accent={t.accent} ink={t.ink} />
          )}
          <SigBlock value={completedOn} label="Date of completion" accent={t.accent} ink={t.ink} />
          {t.showScore && score != null && (
            <SigBlock value={`${score}%`} label="Final assessment score" accent={t.accent} ink={t.ink} />
          )}
        </div>
        {t.showSeal && <OfficialSeal accent={t.accent} ink={t.ink} />}
      </div>
    </div>
  );
};

// Centered signature block
const SigBlock = ({ value, label, accent, ink }) => (
  <div style={{ minWidth: 170, textAlign: "center" }}>
    <div style={{ fontFamily: "var(--font-accent)", fontSize: 22, color: ink, borderBottom: `1px solid ${ink}55`, paddingBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 11, color: "#5f635f", marginTop: 6, letterSpacing: "0.04em" }}>{label}</div>
  </div>
);

// Branded "official" seal — no curved text, just decorative concentric rings,
// rays, and ornamental marks around a central GIM monogram.
const OfficialSeal = ({ accent, ink }) => {
  const SIZE = 170;
  const cx = 85, cy = 85;

  // Helper to compute a point on a circle around (cx, cy)
  const ptOn = (radius, t) => {
    const a = t * Math.PI * 2 - Math.PI / 2; // t=0 at top, increases clockwise
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  };

  return (
    <div style={{ width: SIZE, height: SIZE, flexShrink: 0, position: "relative" }}>
      <svg viewBox="0 0 170 170" width={SIZE} height={SIZE}>
        {/* Outermost: hairline circle */}
        <circle cx={cx} cy={cy} r="80" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />

        {/* Notched outer rim — heavier ring */}
        <circle cx={cx} cy={cy} r="74" fill="none" stroke={accent} strokeWidth="2.5" />
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2;
          return <line key={i}
            x1={cx + Math.cos(a) * 74} y1={cy + Math.sin(a) * 74}
            x2={cx + Math.cos(a) * 70} y2={cy + Math.sin(a) * 70}
            stroke={accent} strokeWidth="1" />;
        })}

        {/* Inner ring */}
        <circle cx={cx} cy={cy} r="56" fill="none" stroke={accent} strokeWidth="1.5" />

        {/* Ornamental dots between the two rings, every 30° */}
        {Array.from({ length: 12 }).map((_, i) => {
          const p = ptOn(63, i / 12);
          return <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="1.5" fill={accent} />;
        })}

        {/* Decorative stars at the four cardinal corners (offset 22.5°) */}
        {[0.125, 0.375, 0.625, 0.875].map(t => {
          const p = ptOn(64, t);
          return (
            <text key={`star-${t}`} x={p.x} y={p.y + 4} textAnchor="middle"
              fontSize="11" fill={accent} fontWeight="700">★</text>
          );
        })}

        {/* Subtle sunburst rays radiating from the center disc */}
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return <line key={`ray-${i}`}
            x1={cx + Math.cos(a) * 42} y1={cy + Math.sin(a) * 42}
            x2={cx + Math.cos(a) * 48} y2={cy + Math.sin(a) * 48}
            stroke={accent} strokeWidth="0.8" opacity="0.45" />;
        })}

        {/* Solid center disc with monogram */}
        <circle cx={cx} cy={cy} r="36" fill={accent} />
        <circle cx={cx} cy={cy} r="32" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        <text x={cx} y={cy + 7} textAnchor="middle"
          fontFamily="var(--font-display)" fontSize="22" fontWeight="400"
          fill="#fff" letterSpacing="1.5">GIM</text>
      </svg>
    </div>
  );
};

// ---- Print helper: opens window with single .cert-doc and triggers print
const printCertificate = (template, course, learnerName, completedOn, score, certNo) => {
  // Render the certificate's HTML by mounting it into a detached node
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  root.render(
    <CertificateRender template={template} course={course} learnerName={learnerName}
      completedOn={completedOn} score={score} certNo={certNo} />
  );
  setTimeout(() => {
    const html = host.innerHTML;
    root.unmount();
    host.remove();

    const w = window.open("", "_blank", "width=1100,height=850");
    if (!w) { alert("Pop-up blocked — allow pop-ups to download as PDF."); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${course.title} — Certificate</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Switzer:wght@400;500;600;700;800&family=Alfa+Slab+One&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{
    --font-sans:"Switzer","Inter",system-ui,sans-serif;
    --font-display:"Alfa Slab One",Georgia,serif;
    --font-accent:"Alfa Slab One",Georgia,serif;
    --font-mono:"JetBrains Mono",ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#eee;font-family:var(--font-sans)}
  .wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  @page{size:11in 8.5in;margin:0}
  @media print{
    html,body{background:#fff}
    .wrap{padding:0;min-height:auto}
    .cert-doc{box-shadow:none !important}
  }
  .cert-doc{box-shadow:0 8px 40px rgba(0,0,0,.18)}
</style>
</head><body><div class="wrap">${html}</div>
<script>window.addEventListener("load",()=>{setTimeout(()=>window.print(),350);});</script>
</body></html>`);
    w.document.close();
  }, 50);
};

Object.assign(window, { CERTIFICATE_DEFAULTS, CertificateRender, printCertificate });
