// =========================================================
// GIM LMS — Admin: Certificate Designer
// =========================================================

const AdminCertificateDesignerPage = () => {
  // Live, mutable template state. Persists in window so other pages reflect edits.
  const [t, setT] = React.useState(() => window.CERTIFICATE_TEMPLATE || { ...CERTIFICATE_DEFAULTS });
  const [saving, setSaving] = React.useState(false);
  const update = (patch) => {
    const next = { ...t, ...patch };
    setT(next);
    window.CERTIFICATE_TEMPLATE = next;
  };

  // Refresh local state when the Firestore listener pushes new template data
  React.useEffect(() => {
    if (window.CERTIFICATE_TEMPLATE) setT({ ...window.CERTIFICATE_TEMPLATE });
  }, [window.CERTIFICATE_TEMPLATE]);

  const onSave = async () => {
    if (saving) return;
    if (!window.fbReady) { alert("Firebase isn't configured — can't save."); return; }
    setSaving(true);
    try {
      await saveCertificateTemplate(t);
      window.CERTIFICATE_TEMPLATE = t;
      showToast?.("Certificate template saved");
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally { setSaving(false); }
  };

  const onResetDefaults = () => {
    if (!confirm("Reset the certificate template to defaults? Unsaved changes will be lost.")) return;
    setT({ ...CERTIFICATE_DEFAULTS });
    window.CERTIFICATE_TEMPLATE = { ...CERTIFICATE_DEFAULTS };
  };

  // Sample data for the preview
  const sampleCourse  = COURSES[0] || { id: "demo", title: "Sample course title" };
  const sampleLearner = CURRENT_USER.name || "Sample Learner";
  const sampleDate    = "Mar 14, 2025";
  const sampleScore   = 95;
  const sampleCertNo  = "GIM-SAMPLE-0001";

  // Logo upload
  const fileRef = React.useRef(null);
  const onPickLogo = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update({ logoUrl: reader.result });
    reader.readAsDataURL(f);
  };

  // Preview scale: fit 1056 wide into ~640px column
  const PREVIEW_W = 640;
  const scale = PREVIEW_W / 1056;

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Settings</div>
          <h1 className="page-head__title">Certificate designer</h1>
          <div className="page-head__sub">Brand the certificate every learner receives. Updates apply to all courses.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onResetDefaults}>
            <Icon name="refresh" size={14}/> Reset to default
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => printCertificate(t, sampleCourse, sampleLearner, sampleDate, sampleScore, sampleCertNo)}>
            <Icon name="download" size={14}/> Download sample PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
            <Icon name="check" size={14}/> {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 380px) 1fr", gap: 24, alignItems: "flex-start" }}>
        {/* ---------------- CONTROLS ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Branding */}
          <div className="card card-pad">
            <div className="cd-section-title">Branding</div>

            <div className="cd-field">
              <label>Logo</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <div style={{
                  width: 84, height: 44, borderRadius: 6, background: "#fafafa", border: "1px solid #ececec",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {t.logoUrl
                    ? <img src={t.logoUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    : <span className="text-xs text-muted">No logo</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                    <Icon name="upload" size={12}/> Upload
                  </button>
                  {t.logoUrl && (
                    <button className="btn btn-ghost btn-sm" style={{ color: "#a8232b" }} onClick={() => update({ logoUrl: "" })}>Remove</button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickLogo} />
                </div>
              </div>
            </div>

            <div className="cd-field">
              <label>Brand tag</label>
              <input className="cd-input" value={t.brandTag} onChange={(e) => update({ brandTag: e.target.value })} placeholder="Learning" />
            </div>

            <div className="cd-field">
              <label>Accent color</label>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                {["#7ac142", "#2e5a12", "#111111", "#a8232b", "#1a4f8b", "#b07b1f"].map(c => (
                  <button key={c} onClick={() => update({ accent: c })} title={c} style={{
                    width: 26, height: 26, borderRadius: "50%", border: t.accent === c ? "2px solid #111" : "2px solid transparent",
                    background: c, cursor: "pointer", padding: 0,
                  }}/>
                ))}
                <input type="color" value={t.accent} onChange={(e) => update({ accent: e.target.value })}
                  style={{ width: 32, height: 32, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }} />
              </div>
            </div>

            <div className="cd-field">
              <label>Paper color</label>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {["#fdfbf6", "#ffffff", "#f7f3ea", "#0f1011"].map(c => (
                  <button key={c} onClick={() => update({ paper: c, ink: c === "#0f1011" ? "#f6f4ef" : "#111111" })} style={{
                    width: 26, height: 26, borderRadius: "50%", border: t.paper === c ? "2px solid #111" : "1px solid #ddd",
                    background: c, cursor: "pointer", padding: 0,
                  }}/>
                ))}
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="card card-pad">
            <div className="cd-section-title">Copy</div>
            <div className="cd-field">
              <label>Eyebrow</label>
              <input className="cd-input" value={t.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} />
            </div>
            <div className="cd-field">
              <label>Headline</label>
              <input className="cd-input" value={t.headline} onChange={(e) => update({ headline: e.target.value })} />
            </div>
            <div className="cd-field">
              <label>Body line</label>
              <textarea className="cd-input" rows={3} value={t.body} onChange={(e) => update({ body: e.target.value })} />
            </div>
          </div>

          {/* Signatures */}
          <div className="card card-pad">
            <div className="cd-section-title">Signatures</div>
            <div className="cd-field">
              <label>Signer 1 — name</label>
              <input className="cd-input" value={t.signer1Name} onChange={(e) => update({ signer1Name: e.target.value })} />
            </div>
            <div className="cd-field">
              <label>Signer 1 — title</label>
              <input className="cd-input" value={t.signer1Title} onChange={(e) => update({ signer1Title: e.target.value })} />
            </div>

            <div className="cd-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
              <label style={{ margin: 0 }}>Show second signer</label>
              <Toggle checked={t.showSecondSigner} onChange={(v) => update({ showSecondSigner: v })} />
            </div>
            {t.showSecondSigner && (
              <>
                <div className="cd-field">
                  <label>Signer 2 — name</label>
                  <input className="cd-input" value={t.signer2Name} onChange={(e) => update({ signer2Name: e.target.value })} />
                </div>
                <div className="cd-field">
                  <label>Signer 2 — title</label>
                  <input className="cd-input" value={t.signer2Title} onChange={(e) => update({ signer2Title: e.target.value })} />
                </div>
              </>
            )}
          </div>

          {/* Display */}
          <div className="card card-pad">
            <div className="cd-section-title">Display</div>
            <div className="cd-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ margin: 0 }}>Show seal</label>
              <Toggle checked={t.showSeal} onChange={(v) => update({ showSeal: v })} />
            </div>
            <div className="cd-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ margin: 0 }}>Show assessment score</label>
              <Toggle checked={t.showScore} onChange={(v) => update({ showScore: v })} />
            </div>
          </div>
        </div>

        {/* ---------------- PREVIEW ---------------- */}
        <div>
          <div style={{
            position: "sticky", top: 12,
            background: "#ececec", border: "1px solid #ddd", borderRadius: 12, padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div className="cd-section-title" style={{ marginBottom: 2 }}>Live preview</div>
                <div className="text-xs text-muted">11 × 8.5 in landscape · what learners receive</div>
              </div>
              <div className="text-xs text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(scale * 100)}%</div>
            </div>
            <div style={{
              width: PREVIEW_W, height: 816 * scale, margin: "0 auto",
              boxShadow: "0 16px 48px rgba(0,0,0,.18)", background: "#fff", overflow: "hidden",
            }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <CertificateRender
                  template={t}
                  course={sampleCourse}
                  learnerName={sampleLearner}
                  completedOn={sampleDate}
                  score={sampleScore}
                  certNo={sampleCertNo}
                />
              </div>
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 10, textAlign: "center" }}>
              Sample data: <strong>{sampleLearner}</strong> · <strong>{sampleCourse.title}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)} style={{
    width: 38, height: 22, borderRadius: 999, border: 0, padding: 2,
    background: checked ? "#7ac142" : "#ccc", cursor: "pointer", transition: "background 120ms",
  }}>
    <div style={{
      width: 18, height: 18, borderRadius: "50%", background: "#fff",
      transform: checked ? "translateX(16px)" : "translateX(0)",
      transition: "transform 120ms", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
    }}/>
  </button>
);

const LayoutThumb = ({ kind, accent }) => {
  const base = { width: 64, height: 44, margin: "0 auto", background: "#fff", border: "1px solid #e3e3e3", position: "relative", overflow: "hidden" };
  if (kind === "modern") {
    return (
      <div style={base}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: accent }}/>
        <div style={{ position: "absolute", top: 12, left: 8, right: 8, height: 2, background: "#222" }}/>
        <div style={{ position: "absolute", top: 18, left: 14, right: 14, height: 6, background: "#222" }}/>
        <div style={{ position: "absolute", bottom: 6, left: 8, width: 18, height: 1, background: "#222" }}/>
        <div style={{ position: "absolute", bottom: 6, right: 8, width: 6, height: 6, borderRadius: "50%", border: `1px solid ${accent}` }}/>
      </div>
    );
  }
  if (kind === "minimal") {
    return (
      <div style={base}>
        <div style={{ position: "absolute", top: 8, left: 8, width: 14, height: 2, background: "#222" }}/>
        <div style={{ position: "absolute", top: 18, left: 8, right: 8, height: 6, background: "#222" }}/>
        <div style={{ position: "absolute", bottom: 8, left: 8, width: 18, height: 1, background: "#222" }}/>
      </div>
    );
  }
  // classic
  return (
    <div style={base}>
      <div style={{ position: "absolute", inset: 4, border: `1px solid ${accent}` }}/>
      <div style={{ position: "absolute", top: 14, left: 12, right: 12, height: 6, background: "#222" }}/>
      <div style={{ position: "absolute", bottom: 6, right: 8, width: 8, height: 8, borderRadius: "50%", border: `1px solid ${accent}` }}/>
    </div>
  );
};

Object.assign(window, { AdminCertificateDesignerPage });
