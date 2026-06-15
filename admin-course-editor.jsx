// =========================================================
// OneSource LMS — Admin: Course editor (new + edit)
// =========================================================

const courseEditorCategoryNames = () => window.getCategoryNames?.() || window.CATEGORIES || [];

const blankCourse = () => ({
  id: "new",
  title: "",
  cat: courseEditorCategoryNames()[0] || "",
  dept: "",
  required: false,
  duration: 30,
  description: "",
  cover: "cv-1",
  status: "draft",
  companyVisibility: "all",
  allowedCompanyIds: [],
  modules: [
    { title: "Module 1", lessons: [
      { id: "l-" + Math.random().toString(36).slice(2, 7), title: "", type: "video", dur: "", source: "drive", url: "" },
    ]},
  ],
  resources: [],
  passingScore: 80,
  questionsCount: 5,
});

const loadEditCourse = (id) => {
  const c = COURSES.find(x => x.id === id);
  if (!c) return null;
  return {
    id: c.id,
    title: c.title || "",
    cat: c.cat || "",
    dept: c.dept || "",
    required: !!c.required,
    duration: c.duration || 30,
    description: c.description || "",
    cover: c.cover || "cv-1",
    coverUrl: c.coverUrl || "",
    status: c.status || "published",
    companyVisibility: c.companyVisibility || "all",
    allowedCompanyIds: c.allowedCompanyIds || [],
    modules: c.modules || c.sections || [],
    resources: c.resources || [],
    passingScore: c.passingScore || 80,
    questionsCount: c.questionsCount || 0,
  };
};

const COVERS = ["cv-1", "cv-2", "cv-3", "cv-4", "cv-5", "cv-6", "cv-7", "cv-8", "cv-9"];
const LESSON_TYPES = [
  { id: "video",   label: "Video",       icon: "play-o" },
  { id: "article", label: "Article",     icon: "doc" },
  { id: "pdf",     label: "PDF",         icon: "doc" },
  { id: "html",    label: "HTML content", icon: "code" },
  { id: "quiz",    label: "Knowledge check", icon: "quiz" },
  { id: "link",    label: "External link",   icon: "link" },
  { id: "gform",   label: "Google Form", icon: "doc" },
];

const isKnowledgeCheckAssessment = (assessment) => assessment?.type === "quiz";
const isFinalCourseAssessment = (assessment) => assessment && assessment.status !== "archived" && !isKnowledgeCheckAssessment(assessment);
const courseEditorAssessments = (courseId) =>
  (window.ASSESSMENTS || []).filter(a => a.courseId === courseId && a.status !== "archived");
const courseEditorFinalAssessment = (courseId) =>
  courseEditorAssessments(courseId).find(isFinalCourseAssessment) || null;
const courseEditorKnowledgeChecks = (courseId) =>
  courseEditorAssessments(courseId).filter(isKnowledgeCheckAssessment);

// Parse a lesson's `dur` value into minutes for the course-duration rollup.
// Video format: "M:SS" or "H:MM:SS" (e.g. "5:23", "1:23:45").
// Article / PDF / external link / Google Form: a whole number of minutes.
// Quiz (knowledge check) doesn't carry a duration.
const lessonMinutes = (l) => {
  if (!l || !l.dur) return 0;
  const s = String(l.dur).trim();
  if (!s) return 0;
  if (l.type === "video") {
    const parts = s.split(":").map(p => parseInt(p, 10));
    if (parts.some(n => Number.isNaN(n))) return 0;
    let mins = 0;
    if (parts.length === 3)      mins = parts[0] * 60 + parts[1] + parts[2] / 60;
    else if (parts.length === 2) mins = parts[0] + parts[1] / 60;
    else                         mins = parts[0];
    return mins;
  }
  if (l.type === "quiz") return 0;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
};

const courseRollupMinutes = (modules) =>
  (modules || []).reduce((s, m) =>
    s + (m.lessons || []).reduce((ss, l) => ss + lessonMinutes(l), 0), 0);

// Convert a YouTube/Drive/Google Form URL to its iframe-embed form
const toGFormEmbed = (url) => {
  if (!url) return url;
  // Already an embedded viewform link
  if (/\/forms\/.*viewform/.test(url) && /embedded=true/.test(url)) return url;
  // /forms/d/e/ID/viewform → add embedded=true
  let m = url.match(/\/forms\/d\/e\/([\w-]+)/);
  if (m) return `https://docs.google.com/forms/d/e/${m[1]}/viewform?embedded=true`;
  // /forms/d/ID/edit → public viewform with embedded
  m = url.match(/\/forms\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/forms/d/${m[1]}/viewform?embedded=true`;
  return url;
};

const AdminCourseEditorPage = ({ mode, courseId, goBack }) => {
  const isNew = mode === "new";
  const [c, setC] = React.useState(() => isNew ? blankCourse() : (loadEditCourse(courseId) || blankCourse()));
  const [tab, setTab] = React.useState("details");
  const [saving, setSaving] = React.useState(false);
  const [assessmentEditorState, setAssessmentEditorState] = React.useState(null); // null = closed; doc | { courseId } = open
  const set = (patch) => setC(prev => ({ ...prev, ...patch }));
  const linkAssessmentToLesson = (mi, li, assessment) => {
    const lesson = c.modules?.[mi]?.lessons?.[li];
    if (!lesson || !assessment?.id) return;
    updateLesson(mi, li, {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      title: lesson.title || assessment.title || "Knowledge check",
    });
  };

  // If COURSES loads after the editor mounts (e.g. deep-link refresh), hydrate once
  React.useEffect(() => {
    if (isNew || !courseId) return;
    if (c.id === courseId) return;
    const loaded = loadEditCourse(courseId);
    if (loaded) setC(loaded);
  }, [COURSES.length, courseId]);

  const onSave = async (publish) => {
    if (saving) return;
    if (!c.title?.trim()) { alert("Please give the course a title."); return; }
    if (!window.fbReady) { alert("Firebase isn't configured — can't save."); return; }

    setSaving(true);
    // Persist as both `modules` (editor) and `sections` (player) for compatibility
    const payload = {
      ...c,
      duration: Math.round(courseRollupMinutes(c.modules) || c.duration || 0),
      status: publish ? "published" : "draft",
      modules: c.modules,
      sections: c.modules,
      lessons: c.modules.reduce((s, m) => s + m.lessons.length, 0),
    };
    try {
      const newId = await saveCourse(payload);
      if (typeof showToast === "function") {
        showToast(publish ? (isNew ? "Course published" : "Course updated") : "Saved as draft");
      }
      if (publish) goBack();
      else if (isNew) setC(prev => ({ ...prev, id: newId, status: "draft" }));
    } catch (err) {
      console.error("saveCourse:", err);
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------- module helpers ----------
  const addModule = () => set({ modules: [...c.modules, { title: `Module ${c.modules.length + 1}`, lessons: [] }] });
  const removeModule = (mi) => set({ modules: c.modules.filter((_, i) => i !== mi) });
  const updateModule = (mi, patch) => set({
    modules: c.modules.map((m, i) => i === mi ? { ...m, ...patch } : m)
  });
  const moveModule = (mi, dir) => {
    const ni = mi + dir;
    if (ni < 0 || ni >= c.modules.length) return;
    const next = [...c.modules];
    [next[mi], next[ni]] = [next[ni], next[mi]];
    set({ modules: next });
  };

  // ---------- lesson helpers ----------
  const addLesson = (mi) => {
    const next = [...c.modules];
    next[mi] = { ...next[mi], lessons: [...next[mi].lessons, {
      id: "l-" + Math.random().toString(36).slice(2, 7),
      title: "", type: "video", dur: "", source: "drive", url: "",
    }]};
    set({ modules: next });
  };
  const updateLesson = (mi, li, patch) => {
    const next = [...c.modules];
    next[mi] = { ...next[mi], lessons: next[mi].lessons.map((l, i) => i === li ? { ...l, ...patch } : l) };
    set({ modules: next });
  };
  const removeLesson = (mi, li) => {
    const next = [...c.modules];
    next[mi] = { ...next[mi], lessons: next[mi].lessons.filter((_, i) => i !== li) };
    set({ modules: next });
  };
  const moveLesson = (mi, li, dir) => {
    const ni = li + dir;
    const lessons = c.modules[mi].lessons;
    if (ni < 0 || ni >= lessons.length) return;
    const reordered = [...lessons];
    [reordered[li], reordered[ni]] = [reordered[ni], reordered[li]];
    updateModule(mi, { lessons: reordered });
  };
  // Drag-and-drop reorder: move lesson at fromIdx to toIdx within the same module
  const reorderLessons = (mi, fromIdx, toIdx) => {
    const lessons = [...c.modules[mi].lessons];
    const [moved] = lessons.splice(fromIdx, 1);
    lessons.splice(toIdx, 0, moved);
    updateModule(mi, { lessons });
  };

  // ---------- resources ----------
  const addResource = () => set({ resources: [...c.resources, { name: "", type: "pdf", url: "", size: "" }] });
  const updateResource = (i, patch) => set({ resources: c.resources.map((r, idx) => idx === i ? { ...r, ...patch } : r) });
  const removeResource = (i) => set({ resources: c.resources.filter((_, idx) => idx !== i) });

  const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginBottom: 6 }}>
            <Icon name="arrow-left" size={12}/> Back to courses
          </button>
          <div className="page-head__eyebrow">Admin · Courses</div>
          <h1 className="page-head__title">{isNew ? "New course" : "Edit course"}</h1>
          <div className="page-head__sub">{isNew ? "Build a new training module from scratch." : c.title || "Untitled course"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {!isNew && c.id && c.id !== "new" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5f635f" }}>
              <span style={{ fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#334155" }}>Course ID</span>
              <code style={{ padding: "4px 8px", border: "1px solid #d8d9d8", borderRadius: 999, background: "#fff", color: "#111", fontSize: 12 }}>{c.id}</code>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={goBack} disabled={saving}>Cancel</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onSave(false)} disabled={saving}>
              <Icon name="check" size={14}/> {saving ? "Saving…" : "Save draft"}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onSave(true)} disabled={saving}>
              <Icon name="check" size={14}/> {saving ? "Saving…" : (isNew ? "Publish course" : "Save changes")}
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={classNames("tab", tab === "details" && "active")}    onClick={() => setTab("details")}>Details</button>
        <button className={classNames("tab", tab === "content" && "active")}    onClick={() => setTab("content")}>Lessons <span className="tab-count">{totalLessons}</span></button>
        <button className={classNames("tab", tab === "assess" && "active")}     onClick={() => setTab("assess")}>Assessment</button>
        <button className={classNames("tab", tab === "resources" && "active")}  onClick={() => setTab("resources")}>Resources <span className="tab-count">{c.resources.length}</span></button>
      </div>

      {tab === "details"   && <DetailsTab c={c} set={set} />}
      {tab === "content"   && <ContentTab c={c} addModule={addModule} removeModule={removeModule} updateModule={updateModule} moveModule={moveModule}
                                addLesson={addLesson} updateLesson={updateLesson} removeLesson={removeLesson} moveLesson={moveLesson} reorderLessons={reorderLessons}
                                onOpenAssessment={setAssessmentEditorState} />}
      {tab === "assess"    && <AssessmentTab c={c} set={set} isNew={isNew} onOpenAssessment={setAssessmentEditorState} />}
      {tab === "resources" && <ResourcesTab c={c} addResource={addResource} updateResource={updateResource} removeResource={removeResource} />}

      {/* Linked-assessment editor opens via "Open question editor" on the Assessment tab */}
      <NewAssessmentModal
        open={assessmentEditorState !== null}
        onClose={() => setAssessmentEditorState(null)}
        initial={assessmentEditorState}
        onSaved={(assessment) => {
          const link = assessmentEditorState?.lessonLink;
          if (link) linkAssessmentToLesson(link.mi, link.li, assessment);
        }}
      />
    </div>
  );
};

// =========================================================
// Tabs
// =========================================================

const DetailsTab = ({ c, set }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
    <div className="card card-pad">
      <div className="cd-section-title">Basic info</div>

      <div className="cd-field">
        <label>Course title</label>
        <input className="cd-input" value={c.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. MA Fair Housing Law" />
      </div>

      <div className="cd-field">
        <label>Description</label>
        <textarea className="cd-input" rows={3} value={c.description} onChange={e => set({ description: e.target.value })}
          placeholder="What learners will get out of this course." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="cd-field">
          <label>Category</label>
          <select className="cd-input" value={c.cat} onChange={e => set({ cat: e.target.value })}>
            {Array.from(new Set([c.cat, ...courseEditorCategoryNames()].filter(Boolean))).map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="cd-field">
          <label>Department</label>
          <select className="cd-input" value={c.dept || ""} onChange={e => set({ dept: e.target.value })}>
            <option value="">— Pick a department —</option>
            {DEPARTMENT_DOCS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            <option value="all">All departments</option>
          </select>
        </div>
        <div className="cd-field" style={{ gridColumn: "1 / -1" }}>
          <label>Company visibility</label>
          <select className="cd-input" value={c.companyVisibility || "all"} onChange={e => set({
            companyVisibility: e.target.value,
            allowedCompanyIds: e.target.value === "all" ? [] : (c.allowedCompanyIds || []),
          })}>
            <option value="all">All companies</option>
            <option value="selected">Selected companies only</option>
          </select>
          {(c.companyVisibility || "all") === "selected" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {getCompanyDocs().map(co => (
                <label key={co.id} className="chip chip-grey" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={(c.allowedCompanyIds || []).includes(co.id)}
                    onChange={e => {
                      const current = c.allowedCompanyIds || [];
                      set({ allowedCompanyIds: e.target.checked ? [...current, co.id] : current.filter(id => id !== co.id) });
                    }}
                  /> {co.name}
                </label>
              ))}
            </div>
          )}
          <div className="text-xs text-muted" style={{ marginTop: 4 }}>
            Learners only see courses available to their email-domain company.
          </div>
        </div>
        <div className="cd-field">
          <label>Duration (minutes)</label>
          <input className="cd-input" type="number" min="0"
            value={Math.round(courseRollupMinutes(c.modules) || c.duration || 0)}
            readOnly
            title="Computed automatically from each lesson's duration"
            style={{ background: "#fafafa", color: "#5f635f", cursor: "not-allowed" }} />
          <div className="text-xs text-muted" style={{ marginTop: 4 }}>
            Auto-totalled from the Lessons tab.
          </div>
        </div>
      </div>

      <div className="cd-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
        <div>
          <label style={{ marginBottom: 2 }}>Required course</label>
          <div className="text-xs text-muted">Marks this course as required when assigned to learners.</div>
        </div>
        <CourseToggle checked={c.required} onChange={v => set({ required: v })} />
      </div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CoverPicker c={c} set={set} />

      <div className="card card-pad">
        <div className="cd-section-title">Status</div>
        <select className="cd-input" style={{ marginTop: 10 }} value={c.status} onChange={e => set({ status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <div className="text-xs text-muted" style={{ marginTop: 8 }}>
          Drafts aren't visible in the learner catalog.
        </div>
      </div>
    </div>
  </div>
);

// Convert common Drive / hosted image URLs into a direct-loadable image URL
const normaliseImageUrl = (url) => {
  if (!url) return url;
  // Drive: /file/d/ID/view → image-loadable direct URL (works for "Anyone with the link")
  let m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
  m = url.match(/drive\.google\.com\/open\?id=([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
  return url;
};

const CoverPicker = ({ c, set }) => {
  const [uploading, setUploading] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");
  const fileRef = React.useRef(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!window.uploadImage) { alert("Image upload requires Firebase Storage on the Blaze plan."); return; }
    if (f.size > 5 * 1024 * 1024) { alert("Image must be under 5 MB."); return; }
    setUploading(true);
    try {
      const url = await uploadImage(f, "courses");
      set({ coverUrl: url });
    } catch (err) {
      // Fall through to a less alarming hint when the project isn't on Blaze
      const blazeHint = /storage\/unauthorized|blaze|billing|requires the Blaze plan|object-not-found/i.test(String(err.message))
        ? "\n\nIf your Firebase project is on the free Spark plan, Storage isn't available — paste an image URL instead."
        : "";
      alert("Upload failed: " + err.message + blazeHint);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const useUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    set({ coverUrl: normaliseImageUrl(trimmed) });
    setUrlInput("");
  };

  const previewStyle = c.coverUrl
    ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  return (
    <div className="card card-pad">
      <div className="cd-section-title">Cover</div>
      <div
        className={classNames("ce-cover", !c.coverUrl && c.cover)}
        style={{ marginTop: 10, ...previewStyle }}
      />

      {/* URL paste — works on the free Spark plan */}
      <div style={{ marginTop: 10 }}>
        <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Paste an image URL (Drive / hosted image)</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="url"
            className="cd-input"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://… or Drive sharing link"
            style={{ flex: 1, fontSize: 12 }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); useUrl(); } }}
          />
          <button className="btn btn-ghost btn-sm" onClick={useUrl} disabled={!urlInput.trim()}>Use</button>
        </div>
      </div>

      {/* File upload — requires Firebase Storage / Blaze plan */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ flex: 1 }}
          title="Requires Firebase Storage (Blaze plan)"
        >
          <Icon name="upload" size={12}/> {uploading ? "Uploading…" : "Upload from computer"}
        </button>
        {c.coverUrl && (
          <button className="btn btn-ghost btn-sm" onClick={() => set({ coverUrl: "" })}>
            Clear
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>

      {!c.coverUrl && (
        <>
          <div className="text-xs text-muted" style={{ marginTop: 12, marginBottom: 6 }}>Or pick a preset:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {COVERS.map(cov => (
              <button key={cov} onClick={() => set({ cover: cov })} className={classNames("ce-cover-thumb", cov, c.cover === cov && "active")} title={cov} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ContentTab = ({ c, addModule, removeModule, updateModule, moveModule, addLesson, updateLesson, removeLesson, moveLesson, reorderLessons, onOpenAssessment }) => {
  // Drag state — { mi, li } of the lesson being dragged
  const [dragSrc, setDragSrc] = React.useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {c.modules.map((m, mi) => (
        <div key={mi} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #ececec", background: "#fafafa" }}>
            <Icon name="grip" size={16} />
            <input className="ce-module-title" value={m.title} onChange={e => updateModule(mi, { title: e.target.value })} placeholder="Module title" />
            <span className="text-xs text-muted">{m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}</span>
            <div style={{ flex: 1 }} />
            <button className="btn-icon" title="Move up" onClick={() => moveModule(mi, -1)}><Icon name="chevron-up" size={14}/></button>
            <button className="btn-icon" title="Move down" onClick={() => moveModule(mi, 1)}><Icon name="chevron-down" size={14}/></button>
            <button className="btn-icon" title="Remove module" onClick={() => removeModule(mi)} style={{ color: "#a8232b" }}><Icon name="trash" size={14}/></button>
          </div>

          <div style={{ padding: "8px 12px 12px" }}>
            {m.lessons.length === 0 && (
              <div className="text-xs text-muted" style={{ padding: "12px 4px" }}>No lessons yet. Drag-and-drop is supported once you have two or more.</div>
            )}
            {m.lessons.map((l, li) => (
              <LessonRow key={l.id} l={l}
                course={c}
                moduleIndex={mi}
                lessonIndex={li}
                onChange={(p) => updateLesson(mi, li, p)}
                onRemove={() => removeLesson(mi, li)}
                onUp={() => moveLesson(mi, li, -1)}
                onDown={() => moveLesson(mi, li, 1)}
                dragging={dragSrc?.mi === mi && dragSrc?.li === li}
                onDragStart={(e) => { setDragSrc({ mi, li }); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragSrc && dragSrc.mi === mi && dragSrc.li !== li) {
                    reorderLessons(mi, dragSrc.li, li);
                  }
                  setDragSrc(null);
                }}
                onOpenAssessment={onOpenAssessment}
              />
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => addLesson(mi)} style={{ marginTop: 8 }}>
              <Icon name="plus" size={12}/> Add lesson
            </button>
          </div>
        </div>
      ))}

      <button className="btn btn-ghost" onClick={addModule} style={{ alignSelf: "flex-start" }}>
        <Icon name="plus" size={14}/> Add module
      </button>
    </div>
  );
};

const ArticleRichTextEditor = ({ value, onChange }) => {
  const ref = React.useRef(null);
  const safeValue = sanitizeArticleHtml(value || "<p></p>");

  React.useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return;
    if (ref.current.innerHTML !== safeValue) ref.current.innerHTML = safeValue;
  }, [safeValue]);

  const emit = () => {
    const html = sanitizeArticleHtml(ref.current?.innerHTML || "");
    onChange(html);
  };

  const run = (command, arg = null) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = prompt("Paste the link URL");
    if (!url) return;
    run("createLink", url);
  };

  return (
    <div className="article-editor">
      <div className="article-editor__toolbar">
        <button type="button" className="btn-icon" title="Bold" onClick={() => run("bold")}><strong>B</strong></button>
        <button type="button" className="btn-icon" title="Italic" onClick={() => run("italic")}><em>I</em></button>
        <button type="button" className="btn-icon" title="Underline" onClick={() => run("underline")}><span style={{ textDecoration: "underline" }}>U</span></button>
        <button type="button" className="btn-icon" title="Bulleted list" onClick={() => run("insertUnorderedList")}><Icon name="list" size={14}/></button>
        <button type="button" className="btn-icon" title="Numbered list" onClick={() => run("insertOrderedList")}><span style={{ fontSize: 11, fontWeight: 800 }}>1.</span></button>
        <button type="button" className="btn-icon" title="Link" onClick={addLink}><Icon name="link" size={14}/></button>
        <select className="cd-input article-editor__format" defaultValue="" onChange={e => {
          if (!e.target.value) return;
          run("formatBlock", e.target.value);
          e.target.value = "";
        }}>
          <option value="">Format</option>
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="blockquote">Quote</option>
        </select>
      </div>
      <div
        ref={ref}
        className="article-editor__surface"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={e => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
      />
    </div>
  );
};

const LessonRow = ({ l, course, moduleIndex, lessonIndex, onChange, onRemove, onUp, onDown, onDragStart, onDragOver, onDrop, dragging, onOpenAssessment }) => {
  const [bodyOpen, setBodyOpen] = React.useState(false);

  const placeholder = (() => {
    switch (l.type) {
      case "video":   return "Paste Drive or YouTube link";
      case "link":    return "https://...";
      case "pdf":     return "Paste Google Drive PDF link";
      case "gform":   return "Paste Google Forms link";
      case "html":    return "Paste hosted HTML URL";
      case "quiz":    return "(configured under the Assessment tab)";
      default:        return "";
    }
  })();

  const showUrlField = l.type === "video" || l.type === "link" || l.type === "pdf" || l.type === "gform";
  const showBodyButton = l.type === "article";
  const showHtmlButton = l.type === "html";
  const courseAssessments = courseEditorKnowledgeChecks(course?.id);
  const selectedAssessment = courseAssessments.find(a => a.id === l.assessmentId);
  const canLinkQuiz = course?.id && course.id !== "new";
  const openNewKnowledgeCheck = () => {
    if (!canLinkQuiz) return;
    onOpenAssessment?.({
      courseId: course.id,
      title: l.title ? `${l.title} - Knowledge Check` : `${course.title || "Course"} - Knowledge Check`,
      type: "quiz",
      passMark: 100,
      certOnPass: false,
      lessonLink: { mi: moduleIndex, li: lessonIndex },
    });
  };

  // Lesson-duration input: video accepts "M:SS"/"H:MM:SS"; article/pdf/link/gform accept whole minutes;
  // quiz hides the field entirely.
  const isVideo = l.type === "video";
  const isQuiz = l.type === "quiz";
  const durPlaceholder = isVideo ? "5:23 or 1:23:45" : "5 (minutes)";
  const onDurChange = (raw) => {
    if (isVideo) {
      // Allow only digits and colons
      const cleaned = raw.replace(/[^\d:]/g, "");
      onChange({ dur: cleaned });
    } else {
      // Whole minutes only
      const cleaned = raw.replace(/\D/g, "");
      onChange({ dur: cleaned });
    }
  };
  const importHtmlFile = async (file) => {
    if (!file) return;
    if (!/\.html?$/i.test(file.name || "") && !/html/i.test(file.type || "")) {
      alert("Choose a .html file.");
      return;
    }
    if (file.size > 700 * 1024) {
      alert("This HTML file is large enough that it may exceed Firestore's course document limit. Use a hosted HTML URL or ZIP package instead.");
      return;
    }
    const text = await file.text();
    onChange({
      htmlMode: "inline",
      htmlContent: text,
      htmlFileName: file.name || "lesson.html",
      url: "",
      packageUrl: "",
    });
  };
  const uploadZipPackage = async (file) => {
    if (!file) return;
    if (!/\.zip$/i.test(file.name || "") && !/zip/i.test(file.type || "")) {
      alert("Choose a .zip package.");
      return;
    }
    if (!window.fbReady || typeof uploadImage !== "function") {
      alert("Firebase Storage is not configured. Paste a hosted ZIP URL instead.");
      return;
    }
    try {
      const url = await uploadImage(file, "html-packages");
      onChange({
        htmlMode: "zip",
        packageUrl: url,
        packageFileName: file.name || "package.zip",
        entryFile: l.entryFile || "index.html",
        url: "",
        htmlContent: "",
      });
      showToast?.("HTML package uploaded.");
    } catch (err) {
      alert("ZIP upload failed: " + err.message + "\n\nYou can paste a hosted ZIP URL instead.");
    }
  };

  return (
    <>
      <div
        className="ce-lesson"
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ opacity: dragging ? 0.4 : 1, cursor: "grab" }}
      >
        <Icon name="grip" size={14} />
        <select className="cd-input ce-lesson-type" value={l.type} onChange={e => onChange({
          type: e.target.value,
          ...(e.target.value === "quiz" ? { dur: "", url: "" } : {}),
          ...(e.target.value === "html" ? { htmlMode: l.htmlMode || "url", source: "" } : {}),
        })}>
          {LESSON_TYPES.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
        <input className="cd-input ce-lesson-title" value={l.title} onChange={e => onChange({ title: e.target.value })} placeholder="Lesson title" />
        {isQuiz ? (
          <div className="ce-lesson-dur" style={{ fontSize: 11, color: "#5f635f", padding: "8px 4px" }}>—</div>
        ) : (
          <input
            className="cd-input ce-lesson-dur"
            value={l.dur || ""}
            onChange={e => onDurChange(e.target.value)}
            placeholder={durPlaceholder}
            inputMode={isVideo ? "numeric" : "numeric"}
            title={isVideo ? "Video runtime as M:SS or H:MM:SS" : "Whole minutes"}
          />
        )}

        {l.type === "video" && (
          <select className="cd-input ce-lesson-source" value={l.source || "drive"} onChange={e => onChange({ source: e.target.value })}>
            <option value="drive">Google Drive</option>
            <option value="youtube">YouTube</option>
          </select>
        )}

        {showUrlField ? (
          <input
            className="cd-input ce-lesson-url"
            value={l.url || ""}
            onChange={e => onChange({ url: e.target.value })}
            placeholder={placeholder}
            disabled={l.type === "quiz"}
          />
        ) : showBodyButton ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setBodyOpen(o => !o)}
            style={{ height: 32, padding: "0 12px", whiteSpace: "nowrap" }}>
            <Icon name="edit" size={12}/> {l.body ? `Edit (${l.body.length} chars)` : "Add content"}
          </button>
        ) : showHtmlButton ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setBodyOpen(o => !o)}
            style={{ height: 32, padding: "0 12px", whiteSpace: "nowrap" }}>
            <Icon name="code" size={12}/> {l.htmlMode === "zip" ? "Configure package" : l.htmlMode === "inline" ? "Edit HTML" : "Configure HTML"}
          </button>
        ) : (
          <div className="ce-lesson-spacer" />
        )}

        <button className="btn-icon" title="Up"   onClick={onUp}><Icon name="chevron-up" size={14}/></button>
        <button className="btn-icon" title="Down" onClick={onDown}><Icon name="chevron-down" size={14}/></button>
        <button className="btn-icon" title="Remove" style={{ color: "#a8232b" }} onClick={onRemove}><Icon name="trash" size={14}/></button>
      </div>

      {showBodyButton && bodyOpen && (
        <div style={{ padding: "8px 12px 12px 36px" }}>
          <ArticleRichTextEditor
            value={l.bodyHtml || plainTextToArticleHtml(l.body || "")}
            onChange={html => onChange({ bodyHtml: html, body: articleHtmlToText(html) })}
          />
        </div>
      )}
      {showHtmlButton && bodyOpen && (
        <div style={{ padding: "8px 12px 12px 36px" }}>
          <div className="html-lesson-editor">
            <div className="cd-field" style={{ margin: 0 }}>
              <label>HTML source</label>
              <select className="cd-input" value={l.htmlMode || "url"} onChange={e => onChange({ htmlMode: e.target.value })}>
                <option value="url">Hosted HTML URL</option>
                <option value="inline">Self-contained HTML file</option>
                <option value="zip">ZIP package with assets</option>
              </select>
            </div>

            {(l.htmlMode || "url") === "url" && (
              <div className="cd-field" style={{ margin: 0 }}>
                <label>Hosted HTML URL</label>
                <input className="cd-input" value={l.url || ""} onChange={e => onChange({ url: e.target.value })} placeholder="https://example.com/course/index.html" />
              </div>
            )}

            {l.htmlMode === "inline" && (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: 0 }}>
                    <Icon name="upload" size={14}/> Import .html
                    <input type="file" accept=".html,.htm,text/html" style={{ display: "none" }} onChange={e => importHtmlFile(e.target.files?.[0])} />
                  </label>
                  {l.htmlFileName && <span className="chip chip-grey">{l.htmlFileName}</span>}
                  <span className="text-xs text-muted">Best for self-contained HTML with inline CSS/scripts or remote assets.</span>
                </div>
                <textarea
                  className="cd-input html-lesson-editor__code"
                  value={l.htmlContent || ""}
                  onChange={e => onChange({ htmlContent: e.target.value })}
                  placeholder="Paste the full self-contained HTML document here..."
                  rows={10}
                />
              </>
            )}

            {l.htmlMode === "zip" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 8 }}>
                  <div className="cd-field" style={{ margin: 0 }}>
                    <label>ZIP package URL</label>
                    <input className="cd-input" value={l.packageUrl || ""} onChange={e => onChange({ packageUrl: e.target.value })} placeholder="Paste hosted .zip URL or upload below" />
                  </div>
                  <div className="cd-field" style={{ margin: 0 }}>
                    <label>Entry file</label>
                    <input className="cd-input" value={l.entryFile || "index.html"} onChange={e => onChange({ entryFile: e.target.value })} placeholder="index.html" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: 0 }}>
                    <Icon name="upload" size={14}/> Upload ZIP
                    <input type="file" accept=".zip,application/zip,application/x-zip-compressed" style={{ display: "none" }} onChange={e => uploadZipPackage(e.target.files?.[0])} />
                  </label>
                  {l.packageFileName && <span className="chip chip-grey">{l.packageFileName}</span>}
                  <span className="text-xs text-muted">Package should include an HTML entry file plus relative assets.</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isQuiz && (
        <div style={{ padding: "8px 12px 12px 36px", display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 8, alignItems: "center" }}>
          {canLinkQuiz ? (
            <>
              <select
                className="cd-input"
                value={l.assessmentId || ""}
                onChange={e => {
                  const assessment = courseAssessments.find(a => a.id === e.target.value);
                  onChange({
                    assessmentId: e.target.value,
                    assessmentTitle: assessment?.title || "",
                    ...(assessment?.title && !l.title ? { title: assessment.title } : {}),
                  });
                }}
              >
                <option value="">Choose a knowledge-check quiz...</option>
                {courseAssessments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title} (quiz, {a.questions?.length || 0} q, {a.passMark || 100}%)
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={openNewKnowledgeCheck}>
                <Icon name="plus" size={12}/> Create quiz
              </button>
              {selectedAssessment && selectedAssessment.passMark !== 100 && (
                <div className="text-xs text-muted" style={{ gridColumn: "1 / -1" }}>
                  Knowledge checks require 100%; this quiz will require 100% when learners take it from this lesson.
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-muted" style={{ gridColumn: "1 / -1", padding: "7px 0" }}>
              Save the course as a draft before linking or creating a knowledge-check quiz.
            </div>
          )}
        </div>
      )}
    </>
  );
};

const AssessmentTab = ({ c, set, isNew, onOpenAssessment }) => {
  const linked = !isNew && c.id ? courseEditorFinalAssessment(c.id) : null;
  const cantEditYet = isNew || c.id === "new" || !c.id;

  return (
    <div className="card card-pad" style={{ maxWidth: 720 }}>
      <div className="cd-section-title">Final assessment</div>
      <div className="text-xs text-muted" style={{ marginTop: 4 }}>
        Learners must pass to receive a certificate. Assessments are stored separately and can be reused across courses.
      </div>

      {cantEditYet ? (
        <div className="card card-pad" style={{ marginTop: 14, background: "#f8f7f2", border: "1px dashed #d8d9d8", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#5f635f", marginBottom: 8 }}>
            Save the course first, then come back here to add an assessment.
          </div>
        </div>
      ) : linked ? (
        <>
          <div style={{ marginTop: 14, padding: 14, background: "#f0f9e6", border: "1px solid #cfeab0", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{linked.title}</div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                  {linked.questions?.length || 0} question{linked.questions?.length === 1 ? "" : "s"} · pass mark {linked.passMark || 80}% · {linked.status === "draft" ? "Draft" : "Published"}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenAssessment(linked)}>
                <Icon name="edit" size={12}/> Open question editor
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 14, padding: 18, background: "#fafafa", border: "1px dashed #d8d9d8", borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#3a3a3a", marginBottom: 12, lineHeight: 1.5 }}>
            No assessment yet for this course.<br/>
            Create one to add questions and define the pass mark.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenAssessment({ courseId: c.id, title: `${c.title || "Course"} — Final`, type: "final", passMark: c.passingScore || 80 })}>
            <Icon name="plus" size={12}/> Create assessment
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        <div className="cd-field">
          <label>Default questions to show</label>
          <input className="cd-input" type="number" min="0" value={c.questionsCount} onChange={e => set({ questionsCount: +e.target.value })} />
          <div className="text-xs text-muted" style={{ marginTop: 4 }}>0 = show all available questions.</div>
        </div>
        <div className="cd-field">
          <label>Default passing score (%)</label>
          <input className="cd-input" type="number" min="0" max="100" value={c.passingScore} onChange={e => set({ passingScore: +e.target.value })} />
          <div className="text-xs text-muted" style={{ marginTop: 4 }}>Used for new assessments unless overridden.</div>
        </div>
      </div>
    </div>
  );
};

const ResourcesTab = ({ c, addResource, updateResource, removeResource }) => {
  return (
    <div className="card card-pad" style={{ maxWidth: 920 }}>
      <div className="cd-section-title">Downloadable resources</div>
      <div className="text-xs text-muted" style={{ marginTop: 4 }}>Attach URLs for PDFs, docs, or links learners can open while taking the course.</div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {c.resources.map((r, i) => (
          <div key={i} className="ce-resource" style={{ alignItems: "flex-start" }}>
            <div style={{ marginTop: 9 }}>
              <Icon name={r.type === "link" ? "link" : r.type === "pdf" ? "pdf" : "doc"} size={14} />
            </div>
            <div style={{ display: "grid", gap: 8, flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) 120px", gap: 8 }}>
                <input className="cd-input" value={r.name || ""} onChange={e => updateResource(i, { name: e.target.value })} placeholder="Resource name" />
                <select className="cd-input" value={r.type || "pdf"} onChange={e => updateResource(i, { type: e.target.value, size: "" })}>
                  <option value="pdf">PDF</option>
                  <option value="doc">Doc</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <input className="cd-input" value={r.url || ""} onChange={e => updateResource(i, { url: e.target.value })} placeholder={r.type === "link" ? "https://..." : "Paste the PDF/doc URL"} />
            </div>
            <button className="btn-icon" title="Remove" style={{ color: "#a8232b", marginTop: 4 }} onClick={() => removeResource(i)}><Icon name="trash" size={14}/></button>
          </div>
        ))}
        {c.resources.length === 0 && (
          <div className="text-xs text-muted" style={{ padding: "8px 0" }}>No resources attached.</div>
        )}
      </div>

      <button className="btn btn-ghost btn-sm" onClick={addResource} style={{ marginTop: 10 }}>
        <Icon name="plus" size={12}/> Add resource
      </button>
    </div>
  );
};

const CourseToggle = ({ checked, onChange }) => (
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

Object.assign(window, { AdminCourseEditorPage });
