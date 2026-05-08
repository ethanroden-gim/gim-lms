// =========================================================================
// GIM LMS — Tweaks panel
// Three expressive controls that reshape the feel:
//   1. Aesthetic mood   — display font + corner radius + card style + page bg
//   2. Accent palette   — primary action color across buttons, chips, bars
//   3. Density          — page/card padding, gaps, row heights
// =========================================================================

const GIM_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "operator",
  "accent": "green",
  "density": "comfortable"
}/*EDITMODE-END*/;

// Apply tweaks to .app element via data-attrs
const applyGimTweaks = (t) => {
  const el = document.querySelector(".app");
  if (!el) return;
  el.dataset.mood = t.mood;
  el.dataset.accent = t.accent;
  el.dataset.density = t.density;
};

// Custom palette swatch row — 4 stacked colors per option
const PaletteSwatch = ({ colors, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "stretch",
    padding: 8, border: active ? "2px solid #111" : "2px solid transparent",
    borderRadius: 12, background: active ? "#fff" : "transparent",
    cursor: "pointer", gap: 6, flex: 1, minWidth: 0,
  }}>
    <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 32 }}>
      {colors.map((c, i) => (
        <div key={i} style={{ flex: i === 0 ? 2 : 1, background: c }}/>
      ))}
    </div>
    <div style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "#3a3a3a" }}>{label}</div>
  </button>
);

// Mood preview tile — shows a tiny mock card in that mood
const MoodTile = ({ mood, label, active, onClick }) => {
  const styles = {
    operator: { font: "'Switzer', sans-serif", weight: 800, transform: "none", radius: 8, border: "1px solid rgba(0,0,0,0.08)", bg: "#fff", title: "Onboarding" },
    editorial: { font: "'AlfaSlabOne', serif", weight: 400, transform: "none", radius: 14, border: "1px solid transparent", bg: "#f5f0e6", shadow: "0 4px 12px rgba(0,0,0,0.05)", title: "Onboarding" },
    field: { font: "'CopperplateGothic-32AB', serif", weight: 400, transform: "uppercase", radius: 2, border: "1.5px solid #1a1a1a", bg: "#ededea", shadow: "2px 2px 0 #1a1a1a", title: "Onboarding" },
  };
  const s = styles[mood];
  return (
    <button onClick={onClick} style={{
      padding: 10, border: active ? "2px solid #111" : "2px solid transparent",
      borderRadius: 12, background: active ? "#f7f8f7" : "transparent",
      cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0,
    }}>
      <div style={{
        background: s.bg, borderRadius: s.radius, border: s.border,
        padding: "10px 12px", boxShadow: s.shadow || "none", textAlign: "left",
      }}>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5f635f", fontWeight: 700 }}>Course</div>
        <div style={{
          fontFamily: s.font, fontWeight: s.weight, textTransform: s.transform,
          fontSize: 14, marginTop: 2, color: "#111", letterSpacing: mood === "field" ? "0.06em" : "-0.01em",
        }}>{s.title}</div>
        <div style={{ marginTop: 6, height: 3, background: "#ececec", borderRadius: s.radius > 4 ? 999 : 0, overflow: "hidden" }}>
          <div style={{ width: "60%", height: "100%", background: "#7ac142" }}/>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{label}</div>
    </button>
  );
};

// Density tile — three little rows showing spacing
const DensityTile = ({ value, label, active, onClick }) => {
  const gap = value === "cozy" ? 8 : value === "compact" ? 2 : 5;
  const h = value === "cozy" ? 8 : value === "compact" ? 4 : 6;
  return (
    <button onClick={onClick} style={{
      padding: 10, border: active ? "2px solid #111" : "2px solid transparent",
      borderRadius: 10, background: active ? "#f7f8f7" : "transparent",
      cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, flex: 1, alignItems: "center",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap, padding: "6px 0" }}>
        {[60, 40, 50].map((w, i) => (
          <div key={i} style={{ width: w, height: h, background: "#9ca39c", borderRadius: 2 }}/>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{label}</div>
    </button>
  );
};

const TweakHelp = ({ children }) => (
  <div style={{ fontSize: 10.5, color: "#6b6357", marginTop: -2, marginBottom: 8, lineHeight: 1.45 }}>{children}</div>
);

const GimTweaks = () => {
  const [t, setTweak] = useTweaks(GIM_TWEAK_DEFAULTS);

  // Apply on mount + every change
  React.useEffect(() => { applyGimTweaks(t); }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Aesthetic mood"/>
      <TweakHelp>Reshapes typography, corners & surfaces across the whole app.</TweakHelp>
      <div style={{ display: "flex", gap: 6, padding: "0 4px 8px" }}>
        <MoodTile mood="operator"  label="Operator"  active={t.mood === "operator"}  onClick={() => setTweak("mood", "operator")}/>
        <MoodTile mood="editorial" label="Editorial" active={t.mood === "editorial"} onClick={() => setTweak("mood", "editorial")}/>
        <MoodTile mood="field"     label="Field"     active={t.mood === "field"}     onClick={() => setTweak("mood", "field")}/>
      </div>
      <div style={{ fontSize: 10.5, color: "#6b6357", padding: "0 4px 12px", lineHeight: 1.45, fontStyle: "italic" }}>
        {t.mood === "operator"  && "Switzer 800. Pill buttons, subtle cards. Confident & utilitarian."}
        {t.mood === "editorial" && "Alfa Slab on titles. Soft radii, cream surface. Magazine feel."}
        {t.mood === "field"     && "Copperplate caps, 4px corners, hairline borders. Industrial."}
      </div>

      <TweakSection label="Accent palette"/>
      <TweakHelp>Recolors buttons, progress, active states & seals.</TweakHelp>
      <div style={{ display: "flex", gap: 4, padding: "0 4px 12px", justifyContent: "space-between" }}>
        <PaletteSwatch label="GIM" active={t.accent === "green"}  onClick={() => setTweak("accent", "green")}
          colors={["#7ac142", "#cfeab0", "#2e5a12", "#111"]}/>
        <PaletteSwatch label="Forest" active={t.accent === "forest"} onClick={() => setTweak("accent", "forest")}
          colors={["#2e5a12", "#9ed458", "#1a3608", "#111"]}/>
        <PaletteSwatch label="Clay" active={t.accent === "clay"}   onClick={() => setTweak("accent", "clay")}
          colors={["#d97757", "#f4cdb8", "#7a3a24", "#111"]}/>
        <PaletteSwatch label="Ink" active={t.accent === "ink"}    onClick={() => setTweak("accent", "ink")}
          colors={["#1f2937", "#b7c4d4", "#0b1220", "#111"]}/>
      </div>

      <TweakSection label="Density"/>
      <TweakHelp>How tightly the UI breathes — padding, gaps, row heights.</TweakHelp>
      <div style={{ display: "flex", gap: 6, padding: "0 4px 8px" }}>
        <DensityTile value="cozy"        label="Cozy"      active={t.density === "cozy"}        onClick={() => setTweak("density", "cozy")}/>
        <DensityTile value="comfortable" label="Default"   active={t.density === "comfortable"} onClick={() => setTweak("density", "comfortable")}/>
        <DensityTile value="compact"     label="Compact"   active={t.density === "compact"}     onClick={() => setTweak("density", "compact")}/>
      </div>
    </TweaksPanel>
  );
};

window.GimTweaks = GimTweaks;
window.applyGimTweaks = applyGimTweaks;
window.GIM_TWEAK_DEFAULTS = GIM_TWEAK_DEFAULTS;
