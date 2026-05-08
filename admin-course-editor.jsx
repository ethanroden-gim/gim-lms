// =========================================================
// GIM LMS — Admin: Course editor (new + edit)
// =========================================================

const blankCourse = () => ({
  id: "new",
  title: "",
  cat: "Property Management",
  dept: "Property Management",
  required: false,
  duration: 30,
  instructor: "",
  description: "",
  cover: "ph-bg-1",
  status: "draft",
  modules: [
    { title: "Module 1", lessons: [
      { id: "l-" + Math.random().toString(36).slice(2, 7), title: "", type: "video", dur: "", source: "drive", url: "" },
    ]},
  ],
  resources: [],
  passingScore: 80,
  questionsCount: 5,
});

const sampleEditCourse = (id) => {
  const c = COURSES.find(x => x.id === id) || COURSES[0];
  return {
    id: c.id,
    title: c.title,
    cat: c.cat,
    dept: c.dept || c.cat,
    required: !!c.required,
    duration: c.duration || 30,
    instructor: c.instructor || "",
    description: c.description || "Brings together everything a GIM team member needs to know to be effective in this area of work.",
    cover: c.cover || "ph-bg-1",
    status: "published",
    modules: c.modules || [
      { title: "Foundations", lessons: [
        { id: "l1", title: "Introduction", type: "video", dur: "5:00", source: "drive", url: "" },
        { id: "l2", title: "Core concepts", type: "article", dur: "8 min read" },
      ]},
    ],
    resources: c.resources || [
      { name: "Reference handout", type: "pdf", size: "1.2 MB" },
    ],
    passingScore: 80,
    questionsCount: c.questionsCount || 5,
  };
};

const COVERS = ["ph-bg-1", "ph-bg-2", "ph-bg-3", "ph-bg-4", "ph-bg-5"];
const LESSON_TYPES = [
  { id: "video",   label: "Video",       icon: "play-o" },
  { id: "article", label: "Article",     icon: "doc" },
  { id: "pdf",     label: "PDF",         icon: "doc" },
  { id: "quiz",    label: "Knowledge check", icon: "quiz" },
  { id: "link",    label: "External link",   icon: "link" },
];

const AdminCourseEditorPage = ({ mode, courseId, goBack }) => {
  const isNew = mode === "new";
  const [c, setC] = React.useState(() => isNew ? blankCourse() : sampleEditCourse(courseId));
  const [tab, setTab] = React.useState("details");
  const set = (patch) => setC(prev => ({ ...prev, ...patch }));

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

  // ---------- resources ----------
  const addResource = () => set({ resources: [...c.resources, { name: "", type: "pdf", size: "" }] });
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={goBack}>Cancel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => alert("Saved as draft.")}>
            <Icon name="check" size={14}/> Save draft
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { alert(isNew ? "Course created and published." : "Course updated."); goBack(); }}>
            <Icon name="check" size={14}/> {isNew ? "Publish course" : "Save changes"}
          </button>
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
                                addLesson={addLesson} updateLesson={updateLesson} removeLesson={removeLesson} moveLesson={moveLesson} />}
      {tab === "assess"    && <AssessmentTab c={c} set={set} />}
      {tab === "resources" && <ResourcesTab c={c} addResource={addResource} updateResource={updateResource} removeResource={removeResource} />}
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
            {CATEGORIES.map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="cd-field">
          <label>Department</label>
          <select className="cd-input" value={c.dept} onChange={e => set({ dept: e.target.value })}>
            {DEPARTMENTS.map(x => <option key={x}>{x}</option>)}
            <option>All departments</option>
          </select>
        </div>
        <div className="cd-field">
          <label>Instructor</label>
          <input className="cd-input" value={c.instructor} onChange={e => set({ instructor: e.target.value })} placeholder="Name" />
        </div>
        <div className="cd-field">
          <label>Duration (minutes)</label>
          <input className="cd-input" type="number" min="0" value={c.duration} onChange={e => set({ duration: +e.target.value })} />
        </div>
      </div>

      <div className="cd-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
        <div>
          <label style={{ marginBottom: 2 }}>Required course</label>
          <div className="text-xs text-muted">Auto-assigns to everyone in the selected department.</div>
        </div>
        <CourseToggle checked={c.required} onChange={v => set({ required: v })} />
      </div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card card-pad">
        <div className="cd-section-title">Cover</div>
        <div className={classNames("ce-cover", c.cover)} style={{ marginTop: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 10 }}>
          {COVERS.map(cov => (
            <button key={cov} onClick={() => set({ cover: cov })} className={classNames("ce-cover-thumb", cov, c.cover === cov && "active")} title={cov} />
          ))}
        </div>
      </div>

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

const ContentTab = ({ c, addModule, removeModule, updateModule, moveModule, addLesson, updateLesson, removeLesson, moveLesson }) => (
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
            <div className="text-xs text-muted" style={{ padding: "12px 4px" }}>No lessons yet.</div>
          )}
          {m.lessons.map((l, li) => (
            <LessonRow key={l.id} l={l}
              onChange={(p) => updateLesson(mi, li, p)}
              onRemove={() => removeLesson(mi, li)}
              onUp={() => moveLesson(mi, li, -1)}
              onDown={() => moveLesson(mi, li, 1)}
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

const LessonRow = ({ l, onChange, onRemove, onUp, onDown }) => {
  const needsUrl = l.type === "video" || l.type === "link";
  return (
    <div className="ce-lesson">
      <Icon name="grip" size={14} />
      <select className="cd-input ce-lesson-type" value={l.type} onChange={e => onChange({ type: e.target.value })}>
        {LESSON_TYPES.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
      </select>
      <input className="cd-input ce-lesson-title" value={l.title} onChange={e => onChange({ title: e.target.value })} placeholder="Lesson title" />
      <input className="cd-input ce-lesson-dur" value={l.dur} onChange={e => onChange({ dur: e.target.value })} placeholder="5:00 / 8 min read" />

      {needsUrl ? (
        <>
          {l.type === "video" && (
            <select className="cd-input ce-lesson-source" value={l.source || "drive"} onChange={e => onChange({ source: e.target.value })}>
              <option value="drive">Google Drive</option>
              <option value="youtube">YouTube</option>
            </select>
          )}
          <input className="cd-input ce-lesson-url" value={l.url || ""} onChange={e => onChange({ url: e.target.value })}
            placeholder={l.type === "video" ? "Paste Drive or YouTube embed URL" : "https://..."} />
        </>
      ) : (
        <div className="ce-lesson-spacer" />
      )}

      <button className="btn-icon" title="Up"   onClick={onUp}><Icon name="chevron-up" size={14}/></button>
      <button className="btn-icon" title="Down" onClick={onDown}><Icon name="chevron-down" size={14}/></button>
      <button className="btn-icon" title="Remove" style={{ color: "#a8232b" }} onClick={onRemove}><Icon name="trash" size={14}/></button>
    </div>
  );
};

const AssessmentTab = ({ c, set }) => (
  <div className="card card-pad" style={{ maxWidth: 720 }}>
    <div className="cd-section-title">Final assessment</div>
    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
      Learners must pass to receive a certificate.
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
      <div className="cd-field">
        <label>Number of questions</label>
        <input className="cd-input" type="number" min="0" value={c.questionsCount} onChange={e => set({ questionsCount: +e.target.value })} />
      </div>
      <div className="cd-field">
        <label>Passing score (%)</label>
        <input className="cd-input" type="number" min="0" max="100" value={c.passingScore} onChange={e => set({ passingScore: +e.target.value })} />
      </div>
    </div>

    <div className="cd-field" style={{ marginTop: 12 }}>
      <button className="btn btn-ghost btn-sm">
        <Icon name="plus" size={12}/> Open question editor
      </button>
      <div className="text-xs text-muted" style={{ marginTop: 6 }}>
        {c.questionsCount} questions configured · randomized per learner.
      </div>
    </div>
  </div>
);

const ResourcesTab = ({ c, addResource, updateResource, removeResource }) => (
  <div className="card card-pad" style={{ maxWidth: 820 }}>
    <div className="cd-section-title">Downloadable resources</div>
    <div className="text-xs text-muted" style={{ marginTop: 4 }}>Handouts, PDFs, and reference materials available alongside the course.</div>

    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      {c.resources.map((r, i) => (
        <div key={i} className="ce-resource">
          <Icon name={r.type === "pdf" ? "doc" : "link"} size={14} />
          <input className="cd-input" value={r.name} onChange={e => updateResource(i, { name: e.target.value })} placeholder="Resource name" />
          <select className="cd-input" style={{ width: 120 }} value={r.type} onChange={e => updateResource(i, { type: e.target.value })}>
            <option value="pdf">PDF</option>
            <option value="doc">Doc</option>
            <option value="link">Link</option>
          </select>
          <input className="cd-input" style={{ width: 100 }} value={r.size} onChange={e => updateResource(i, { size: e.target.value })} placeholder="1.2 MB" />
          <button className="btn-icon" title="Remove" style={{ color: "#a8232b" }} onClick={() => removeResource(i)}><Icon name="trash" size={14}/></button>
        </div>
      ))}
      {c.resources.length === 0 && (
        <div className="text-xs text-muted" style={{ padding: "8px 0" }}>No resources attached.</div>
      )}
    </div>

    <button className="btn btn-ghost btn-sm" onClick={addResource} style={{ marginTop: 10 }}>
      <Icon name="upload" size={12}/> Upload / add resource
    </button>
  </div>
);

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
