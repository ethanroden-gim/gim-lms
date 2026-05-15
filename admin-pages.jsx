// =========================================================
// GIM LMS — Admin pages (lightweight)
// =========================================================

const _adminSortText = (v) => String(v ?? "").toLowerCase();
const _adminSortValue = (row, key) => {
  const v = typeof key === "function" ? key(row) : row?.[key];
  if (v?.seconds != null) return v.seconds;
  if (v instanceof Date) return v.getTime();
  return v;
};
const _adminCompare = (a, b, key, dir = "asc") => {
  const av = _adminSortValue(a, key);
  const bv = _adminSortValue(b, key);
  const result = typeof av === "number" || typeof bv === "number"
    ? (Number(av || 0) - Number(bv || 0))
    : _adminSortText(av).localeCompare(_adminSortText(bv));
  return dir === "desc" ? -result : result;
};
const _adminSortRows = (rows, sort) => {
  if (!sort?.key) return rows;
  return [...rows].sort((a, b) => _adminCompare(a, b, sort.key, sort.dir));
};
const _adminNextSort = (sort, key) => ({
  key,
  dir: sort.key === key && sort.dir === "asc" ? "desc" : "asc",
});
const AdminSortHeader = ({ label, sortKey, sort, onSort, style }) => (
  <th style={style}>
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => onSort(_adminNextSort(sort, sortKey))}
      style={{ height: "auto", padding: "6px 8px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", gap: 8, width: style?.textAlign === "center" ? "100%" : "auto", justifyContent: style?.textAlign === "center" ? "center" : "flex-start" }}
    >
      {label}<span aria-hidden="true" style={{ color: sort.key === sortKey ? "#111" : "#9a9d9a", fontSize: 10 }}>{sort.key === sortKey ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </button>
  </th>
);

const _adminParseCsv = (text) => {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (quoted && ch === '"' && next === '"') { cell += '"'; i++; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (!quoted && ch === ",") { row.push(cell); cell = ""; continue; }
    if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some(v => String(v).trim() !== "")) rows.push(row);
      row = []; cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some(v => String(v).trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map(h => String(h || "").replace(/^\ufeff/, "").trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, String(r[i] || "").trim()])));
};

const _adminReadCsvFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(_adminParseCsv(String(reader.result || "")));
  reader.onerror = () => reject(reader.error || new Error("Could not read CSV"));
  reader.readAsText(file);
});

const _adminBool = (v) => /^(true|yes|y|1|required)$/i.test(String(v || "").trim());

const _adminCourseImportTemplate = [
  { title: "Example Draft Course", category: "Compliance", description: "Short course overview", duration: "30", required: "yes", module: "Module 1", lesson_title: "Welcome", lesson_type: "article", lesson_duration: "5", lesson_url: "", lesson_source: "" },
  { title: "Example Draft Course", category: "Compliance", description: "Short course overview", duration: "30", required: "yes", module: "Module 1", lesson_title: "Policy video", lesson_type: "video", lesson_duration: "10", lesson_url: "https://example.com/video", lesson_source: "youtube" },
];

const _adminAssessmentImportTemplate = [
  { title: "Example Final Assessment", course_title: "Example Draft Course", course_id: "", type: "final", description: "Final assessment overview", pass_mark: "80", question: "What is the correct answer?", question_type: "single", options: "Answer A|Answer B|Answer C", correct: "Answer B", points: "1" },
  { title: "Example Final Assessment", course_title: "Example Draft Course", course_id: "", type: "final", description: "Final assessment overview", pass_mark: "80", question: "Select all correct answers", question_type: "multi", options: "One|Two|Three", correct: "One|Three", points: "1" },
  { title: "Example Knowledge Check", course_title: "Example Draft Course", course_id: "", type: "quiz", description: "Knowledge check overview", pass_mark: "100", lesson_module: "Module 1", lesson_title: "Policy video", question: "Ready to continue?", question_type: "tf", options: "", correct: "True", points: "1" },
  { title: "Example Final Assessment", course_title: "Example Draft Course", course_id: "", type: "final", description: "Final assessment overview", pass_mark: "80", question: "Rank these steps", question_type: "ranking", options: "First|Second|Third", correct: "", points: "1" },
  { title: "Example Final Assessment", course_title: "Example Draft Course", course_id: "", type: "final", description: "Final assessment overview", pass_mark: "80", question: "Match each term", question_type: "matching", options: "Term A|Term B", matches: "Definition A|Definition B", correct: "", points: "1" },
];

const _adminDownloadCsvTemplate = (name, rows) => {
  const cols = Array.from(new Set(rows.flatMap(r => Object.keys(r || {}))));
  downloadBlob(name, toCSV(rows, cols.map(key => ({ key, label: key }))), "text/csv;charset=utf-8");
};

const _adminSplitList = (v) => String(v || "").split("|").map(x => x.trim()).filter(Boolean);
const _adminCorrectIndicesFromCsv = (correct, options) => {
  const values = _adminSplitList(correct);
  return values.map(v => {
    const numeric = parseInt(v, 10);
    if (!Number.isNaN(numeric)) return Math.max(0, numeric - 1);
    const idx = options.findIndex(o => o.toLowerCase() === v.toLowerCase());
    return idx >= 0 ? idx : null;
  }).filter(v => v !== null);
};

const _adminLinkQuizToCourseLesson = async (course, assessment, link = {}) => {
  if (!course?.id || !assessment?.id) return false;
  const moduleNeedle = String(link.lesson_module || link.module || "").trim().toLowerCase();
  const lessonNeedle = String(link.lesson_title || link.lesson || "").trim().toLowerCase();
  const lessonId = String(link.lesson_id || "").trim();
  if (!moduleNeedle && !lessonNeedle && !lessonId) return false;

  const modules = (course.modules || course.sections || []).map(m => ({
    ...m,
    lessons: (m.lessons || []).map(l => ({ ...l })),
  }));
  let linked = false;
  modules.forEach(m => {
    const moduleMatches = !moduleNeedle || String(m.title || "").trim().toLowerCase() === moduleNeedle;
    if (!moduleMatches) return;
    m.lessons = (m.lessons || []).map(l => {
      const lessonMatches = lessonId
        ? l.id === lessonId
        : String(l.title || "").trim().toLowerCase() === lessonNeedle;
      if (!lessonMatches) return l;
      linked = true;
      return {
        ...l,
        type: "quiz",
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        title: l.title || assessment.title || "Knowledge check",
      };
    });
  });
  if (!linked) {
    const target = lessonId ? `lesson_id "${lessonId}"` : `lesson_title "${link.lesson_title || link.lesson}"`;
    throw new Error(`Imported "${assessment.title}" but could not find ${target} in "${course.title}".`);
  }
  await saveCourse({
    ...course,
    modules,
    sections: modules,
    lessons: modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0),
  });
  return true;
};

// ============================================================
// Admin overview
// ============================================================
const AdminOverviewPage = ({ goRoute }) => {
  const [assignOpen, setAssignOpen] = React.useState(false);

  // Aggregate per-user enrolment stats from the live ALL_ENROLLMENTS collection
  const enrollmentsByUser = React.useMemo(() => {
    const map = {};
    (window.ALL_ENROLLMENTS || []).forEach(e => {
      if (!e.userId) return;
      (map[e.userId] = map[e.userId] || []).push(e);
    });
    return map;
  }, [ALL_ENROLLMENTS.length]);

  const userStats = (uid) => {
    const list = enrollmentsByUser[uid] || [];
    const assigned = list.length;
    const completed = list.filter(e => e.status === "completed").length;
    const overdue = list.filter(e => e.status !== "completed" && e.dueDays != null && e.dueDays <= 0).length;
    return { assigned, completed, overdue };
  };

  const activeLearners = ALL_USERS.filter(u => u.status === "active").length;
  const totals = ALL_USERS.reduce((acc, u) => {
    const s = userStats(u.id);
    acc.assigned += s.assigned;
    acc.completed += s.completed;
    acc.overdue += s.overdue;
    if (s.overdue > 0) acc.learnersOverdue++;
    return acc;
  }, { assigned: 0, completed: 0, overdue: 0, learnersOverdue: 0 });

  const complianceRate = totals.assigned ? Math.round((totals.completed / totals.assigned) * 100) : null;

  // Department list — Firestore-backed only. No fallback to hardcoded names.
  const departmentNames = DEPARTMENT_DOCS.map(d => d.name).sort((a, b) => a.localeCompare(b));
  const deptCompliance = departmentNames.map(dept => {
    const people = ALL_USERS.filter(u => u.dept === dept);
    let a = 0, c = 0;
    people.forEach(u => { const s = userStats(u.id); a += s.assigned; c += s.completed; });
    const pct = a ? Math.round((c / a) * 100) : null;
    return { dept, headcount: people.length, assigned: a, complete: pct, on_track: pct === null ? true : pct >= 85 };
  });

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin</div>
          <h1 className="page-head__title">Training overview</h1>
          <div className="page-head__sub">Real-time view of compliance and training across GIM.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportButton page="admin-overview" label="Export report" />
          <button className="btn btn-primary btn-sm" onClick={() => setAssignOpen(true)}><Icon name="plus" size={14}/> Assign training</button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="stat">
          <div className="stat__label">Active learners</div>
          <div className="stat__value">{activeLearners}</div>
          <div className="stat__sub">across {departmentNames.length} {departmentNames.length === 1 ? "department" : "departments"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Compliance rate</div>
          <div className="stat__value" style={{ color: complianceRate === null ? "#5f635f" : "#2e5a12" }}>
            {complianceRate === null ? "—" : <>{complianceRate}<span style={{ fontSize: 18, color: "#5f635f" }}>%</span></>}
          </div>
          <div className="stat__sub">Required courses, last 90d</div>
        </div>
        <div className="stat">
          <div className="stat__label">Overdue assignments</div>
          <div className="stat__value" style={{ color: totals.overdue ? "#a8232b" : "#5f635f" }}>{totals.overdue}</div>
          <div className="stat__sub">{totals.learnersOverdue ? `across ${totals.learnersOverdue} learner${totals.learnersOverdue === 1 ? "" : "s"}` : "no overdue work"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Courses published</div>
          <div className="stat__value">{COURSES.filter(c => c.status !== "archived").length}</div>
          <div className="stat__sub">{COURSES.length ? "in catalog" : "no courses yet"}</div>
        </div>
      </div>

      <div className="dash-2col mt-8">
        <div>
          <div className="section-head">
            <h3>Compliance by department</h3>
          </div>
          <div className="card">
            <div style={{ padding: 8 }}>
              {deptCompliance.length === 0 && (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "#5f635f", fontSize: 13 }}>
                  No departments configured yet. Add some in <strong>Roles &amp; departments</strong>.
                </div>
              )}
              {deptCompliance.map(d => (
                <div key={d.dept} style={{ padding: "14px 16px", borderBottom: "1px solid #f3f3f3" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.dept}</div>
                      <div style={{ fontSize: 12, color: "#5f635f" }}>{d.assigned} assigned · {d.headcount} {d.headcount === 1 ? "person" : "people"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: d.complete === null ? "#5f635f" : (d.complete >= 85 ? "#2e5a12" : "#a8232b") }}>
                        {d.complete === null ? "—" : `${d.complete}%`}
                      </div>
                      {d.complete !== null && (
                        <div className="chip chip-grey" style={{ background: d.on_track ? "#f0f9e6" : "#fff5e0", color: d.on_track ? "#2e5a12" : "#8a5a00", borderColor: d.on_track ? "#cfeab0" : "#f3d999" }}>
                          {d.on_track ? "On track" : "Needs attention"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bar bar-thin">
                    <div style={{ width: `${d.complete || 0}%`, background: d.complete === null ? "#ececec" : (d.complete >= 85 ? "#7ac142" : "#f5a524") }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="section-head">
            <h3>Pending grading</h3>
            {goRoute && <a onClick={() => goRoute("admin-attempts")}>Open queue →</a>}
          </div>
          <div className="card card-pad">
            {(() => {
              const pending = (window.ATTEMPTS || [])
                .filter(a => a.status === "pending_review")
                .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))
                .slice(0, 5);
              if (pending.length === 0) {
                return <div style={{ padding: "12px 4px", textAlign: "center", color: "#5f635f", fontSize: 13 }}>
                  Nothing waiting for review. Manually-graded assessments appear here when learners submit them.
                </div>;
              }
              return pending.map((a, i) => {
                const course = COURSES.find(c => c.id === a.courseId);
                const submittedTs = a.submittedAt?.toDate ? a.submittedAt.toDate() : null;
                return (
                  <div
                    key={a.id}
                    onClick={() => goRoute && goRoute("admin-attempts")}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 4px", cursor: "pointer",
                      borderBottom: i < pending.length - 1 ? "1px solid #f3f3f3" : "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.userName || a.userId}
                      </div>
                      <div style={{ fontSize: 11, color: "#5f635f", marginTop: 2 }}>
                        {course?.title || "(course missing)"}
                        {submittedTs ? ` · ${submittedTs.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                      </div>
                    </div>
                    <span className="chip chip-amber" style={{ marginLeft: 12, flexShrink: 0 }}>
                      <Icon name="clock" size={11} /> Grade
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      <AssignTrainingModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        preset={null}
      />
    </div>
  );
};

// ============================================================
// Admin: Courses
// ============================================================
const adminLessonMinutes = (l) => {
  if (!l || !l.dur) return 0;
  const s = String(l.dur).trim();
  if (!s) return 0;
  if (l.type === "video") {
    const parts = s.split(":").map(p => parseInt(p, 10));
    if (parts.some(n => Number.isNaN(n))) return 0;
    if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
    if (parts.length === 2) return parts[0] + parts[1] / 60;
    return parts[0];
  }
  if (l.type === "quiz") return 0;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
};

const adminCourseMinutes = (course) => {
  const sections = course?.modules || course?.sections || [];
  const computed = sections.reduce((sum, sec) =>
    sum + (sec.lessons || []).reduce((lessonSum, l) => lessonSum + adminLessonMinutes(l), 0), 0);
  return Math.round(computed || course?.duration || 0);
};

const AdminCoursesPage = ({ onNew, onEdit, onPreview }) => {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [sort, setSort] = React.useState({ key: "title", dir: "asc" });
  const [importing, setImporting] = React.useState(false);
  const importInputRef = React.useRef(null);
  const [assignFor, setAssignFor] = React.useState(null); // courseId or null
  const [enrollmentsFor, setEnrollmentsFor] = React.useState(null); // course or null
  const openAssign = (id) => setAssignFor(id);
  const cats = ["All", ...CATEGORIES];
  const filtered = COURSES.filter(c => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "All" && c.cat !== cat) return false;
    const status = (c.status || "published").toLowerCase();
    if (statusFilter === "All" && status === "archived") return false;
    if (statusFilter !== "All" && status !== statusFilter.toLowerCase()) return false;
    return true;
  });
  const sortedCourses = _adminSortRows(filtered.map(c => ({
    ...c,
    _adminMinutes: adminCourseMinutes(c),
    _adminEnrolled: ENROLLMENT_COUNTS[c.id] || 0,
    _adminStatus: c.status || "published",
  })), sort);
  const importCourses = async (file) => {
    if (!file) return;
    if (!window.fbReady) { alert("Firebase isn't configured - can't import."); return; }
    setImporting(true);
    try {
      const rows = await _adminReadCsvFile(file);
      const grouped = new Map();
      rows.forEach((r, idx) => {
        const title = r.title || r.course_title || r.name;
        if (!title) return;
        if (!grouped.has(title)) grouped.set(title, { first: r, rows: [] });
        grouped.get(title).rows.push({ ...r, _row: idx + 2 });
      });
      if (!grouped.size) throw new Error("No rows with a title column were found.");
      let count = 0;
      for (const [title, group] of grouped) {
        const first = group.first;
        const modulesByName = new Map();
        group.rows.forEach(r => {
          const lessonTitle = r.lesson_title || r.lesson || "";
          if (!lessonTitle) return;
          const moduleName = r.module || r.module_title || "Module 1";
          if (!modulesByName.has(moduleName)) modulesByName.set(moduleName, { title: moduleName, lessons: [] });
          modulesByName.get(moduleName).lessons.push({
            id: "l-" + Math.random().toString(36).slice(2, 7),
            title: lessonTitle,
            type: r.lesson_type || r.type || "article",
            dur: r.lesson_duration || r.duration_minutes || r.duration || "",
            source: r.lesson_source || r.source || "drive",
            url: r.lesson_url || r.url || "",
            body: r.lesson_body || r.body || "",
          });
        });
        const modules = [...modulesByName.values()];
        const duration = parseInt(first.duration || first.duration_minutes || "", 10) || modules.reduce((sum, m) => (
          sum + m.lessons.reduce((s, l) => s + (parseInt(l.dur, 10) || 0), 0)
        ), 0);
        await saveCourse({
          title,
          description: first.description || "",
          cat: first.category || first.cat || CATEGORIES[0] || "",
          duration,
          required: _adminBool(first.required),
          status: "draft",
          cover: first.cover || "cv-1",
          coverUrl: first.cover_url || "",
          modules,
          sections: modules,
          lessons: modules.reduce((sum, m) => sum + m.lessons.length, 0),
          resources: [],
          passingScore: parseInt(first.passing_score || "", 10) || 80,
        });
        count++;
      }
      showToast?.(`Imported ${count} draft course${count === 1 ? "" : "s"}`);
    } catch (err) {
      alert("Course import failed: " + err.message);
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Courses</div>
          <h1 className="page-head__title">Course management</h1>
          <div className="page-head__sub">Add courses, manage lessons, publish to catalog.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportButton page="admin-courses" label="Export" />
          <button className="btn btn-ghost" onClick={() => _adminDownloadCsvTemplate(`course-import-template-${stamp()}.csv`, _adminCourseImportTemplate)}>
            <Icon name="download" size={14}/> CSV template
          </button>
          <button className="btn btn-ghost" disabled={importing} onClick={() => importInputRef.current?.click()}>
            <Icon name="upload" size={14}/> {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={importInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => importCourses(e.target.files?.[0])} />
          <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={14}/> New course</button>
        </div>
      </div>

      <div className="filterbar">
        <input type="search" placeholder="Search by title..." value={q} onChange={e => setQ(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c} value={c}>Category: {c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">Status: All</option><option value="Published">Status: Published</option><option value="Draft">Status: Draft</option><option value="Archived">Status: Archived</option>
        </select>
        <div className="fb-spacer" />
        <span className="text-xs text-muted">{sortedCourses.length} courses</span>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <AdminSortHeader label="Course" sortKey="title" sort={sort} onSort={setSort} style={{ width: "30%" }} />
            <AdminSortHeader label="Category" sortKey="cat" sort={sort} onSort={setSort} />
            <AdminSortHeader label="Lessons" sortKey="lessons" sort={sort} onSort={setSort} style={{ textAlign: "center" }} />
            <AdminSortHeader label="Enrolled" sortKey="_adminEnrolled" sort={sort} onSort={setSort} style={{ textAlign: "center" }} />
            <AdminSortHeader label="Status" sortKey="_adminStatus" sort={sort} onSort={setSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedCourses.map(c => (
            <tr key={c.id}>
              <td>
                <div style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => onEdit(c.id)}>
                  <div
                    className={classNames(!c.coverUrl && c.cover)}
                    style={{
                      width: 48, height: 32, borderRadius: 6, flexShrink: 0,
                      ...(c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "#5f635f", display: "flex", gap: 8, alignItems: "center" }}>
                      <span>{adminCourseMinutes(c)} min</span>
                      {c.required && <span className="chip chip-required" style={{ fontSize: 10, padding: "1px 6px" }}>Required</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#5f635f", display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace" }}>ID: {c.id}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(c.id);
                          showToast?.("Course ID copied");
                        }}
                        style={{ height: 20, padding: "0 6px", fontSize: 10 }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </td>
              <td><span className="chip chip-grey">{c.cat}</span></td>
              <td style={{ fontVariantNumeric: "tabular-nums", textAlign: "center" }}>{c.lessons}</td>
              <td style={{ fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEnrollmentsFor(c)}
                  title="View enrolled learners"
                  style={{ height: 28, minWidth: 36, padding: "0 8px", justifyContent: "center" }}
                >
                  {ENROLLMENT_COUNTS[c.id] || 0}
                </button>
              </td>
              <td>{
                c.status === "archived" ? <span className="chip chip-grey">Archived</span> :
                c.status === "draft"    ? <span className="chip chip-amber">Draft</span> :
                                          <span className="chip chip-green">Published</span>
              }</td>
              <td>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button className="btn-icon" title="Edit" onClick={() => onEdit(c.id)}><Icon name="edit" size={14}/></button>
                  <RowMenu items={(() => {
                    const isArchived = c.status === "archived";
                    const items = [
                      { label: "Assign to learners", icon: "plus", onClick: () => openAssign(c.id) },
                      { label: "Preview as learner", icon: "play-o", onClick: () => onPreview && onPreview(c.id) },
                      { label: "Duplicate", icon: "edit", onClick: async () => {
                          try { await duplicateCourse(c.id); showToast?.(`Duplicated "${c.title}"`); }
                          catch (err) { alert("Duplicate failed: " + err.message); }
                        } },
                      { label: "View enrollments", icon: "users", onClick: () => setEnrollmentsFor(c) },
                      "divider",
                    ];
                    if (isArchived) {
                      // Restore + permanent delete only available for archived courses
                      items.push(
                        { label: "Restore (unarchive)", icon: "refresh", onClick: async () => {
                            try { await saveCourse({ id: c.id, status: "draft" }); showToast?.(`${c.title} restored as draft`); }
                            catch (err) { alert("Restore failed: " + err.message); }
                          } },
                        { label: "Delete permanently", icon: "trash", danger: true, onClick: async () => {
                            const enrolledCount = (window.ENROLLMENT_COUNTS || {})[c.id] || 0;
                            const detail = enrolledCount > 0
                              ? `\n\nThis course has ${enrolledCount} enrolment record${enrolledCount === 1 ? "" : "s"} attached. Those records will remain but will reference a missing course.`
                              : "";
                            if (!confirm(`Permanently delete "${c.title}"?${detail}\n\nThis cannot be undone. Type-confirm in the next prompt.`)) return;
                            const typed = prompt(`Type the course title to confirm deletion:\n\n${c.title}`);
                            if (typed !== c.title) { showToast?.("Deletion cancelled — title didn't match"); return; }
                            try { await deleteCourse(c.id); showToast?.(`"${c.title}" deleted`); }
                            catch (err) { alert("Delete failed: " + err.message); }
                          } },
                      );
                    } else {
                      items.push(
                        { label: c.status === "draft" ? "Publish" : "Unpublish", icon: c.status === "draft" ? "check" : "eye-off",
                          onClick: async () => {
                            const next = c.status === "draft" ? "published" : "draft";
                            try { await saveCourse({ id: c.id, status: next }); showToast?.(`${c.title} ${next === "published" ? "published" : "unpublished"}`); }
                            catch (err) { alert("Failed: " + err.message); }
                          } },
                        { label: "Archive", icon: "trash", danger: true, onClick: async () => {
                            if (!confirm(`Archive "${c.title}"? It will disappear from the catalog. You can permanently delete it from the Archived view afterwards.`)) return;
                            try { await archiveCourse(c.id); showToast?.(`${c.title} archived`); }
                            catch (err) { alert("Archive failed: " + err.message); }
                          } },
                      );
                    }
                    return items;
                  })()}/>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AssignTrainingModal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        preset={assignFor ? { courseId: assignFor } : null}
      />
      <EnrollmentsModal
        open={!!enrollmentsFor}
        onClose={() => setEnrollmentsFor(null)}
        course={enrollmentsFor}
      />
    </div>
  );
};

// ============================================================
// Admin: People & enrollments
// ============================================================
const AdminUsersPage = () => {
  const [q, setQ] = React.useState("");
  const [dept, setDept] = React.useState("All");
  const [role, setRole] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [sort, setSort] = React.useState({ key: "name", dir: "asc" });
  const [assignFor, setAssignFor] = React.useState(null); // userId, "all" for top-bar, or null
  const [enrollmentsFor, setEnrollmentsFor] = React.useState(null); // user doc or null
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const openAssign = (name) => setAssignFor(name);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const clearSelection = () => setSelectedIds([]);
  const bulkMove = async (newDept) => {
    if (!selectedIds.length) return;
    if (!confirm(`Move ${selectedIds.length} ${selectedIds.length === 1 ? "person" : "people"} to "${newDept}"?`)) return;
    try {
      await Promise.all(selectedIds.map(id => updateUser(id, { dept: newDept })));
      showToast?.(`Moved ${selectedIds.length} ${selectedIds.length === 1 ? "person" : "people"} to ${newDept}`);
      clearSelection();
    } catch (err) { alert("Bulk move failed: " + err.message); }
  };

  // Real-time enrolment stats per user, keyed by user id
  const enrollmentsByUser = React.useMemo(() => {
    const map = {};
    (window.ALL_ENROLLMENTS || []).forEach(e => {
      if (!e.userId) return;
      (map[e.userId] = map[e.userId] || []).push(e);
    });
    return map;
  }, [ALL_ENROLLMENTS.length]);

  const userStats = (uid) => {
    const list = enrollmentsByUser[uid] || [];
    return {
      assigned:  list.length,
      completed: list.filter(e => e.status === "completed").length,
      overdue:   list.filter(e => e.status !== "completed" && e.dueDays != null && e.dueDays <= 0).length,
    };
  };

  const statusMap = { "Active": "active", "Onboarding": "onboarding", "On leave": "leave", "Inactive": "inactive" };
  const departmentOptions = [...DEPARTMENT_DOCS].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const filtered = ALL_USERS.filter(u => {
    if (q && !(u.name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()))) return false;
    if (dept !== "All" && u.dept !== dept) return false;
    if (role !== "All" && u.role !== role) return false;
    if (statusFilter !== "All" && (u.status || "active") !== statusMap[statusFilter]) return false;
    return true;
  });
  const sortedUsers = _adminSortRows(filtered.map(u => {
    const stats = userStats(u.id);
    return {
      ...u,
      _assigned: stats.assigned,
      _completed: stats.completed,
      _overdue: stats.overdue,
      _status: u.status || "active",
    };
  }), sort);

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · People</div>
          <h1 className="page-head__title">People & enrollments</h1>
          <div className="page-head__sub">Add new hires before first login, then set roles, departments, and assignments here.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportButton page="admin-users" label="Export CSV" />
          <button className="btn btn-ghost" onClick={() => setAddUserOpen(true)}><Icon name="user" size={14}/> Add person</button>
          <button className="btn btn-primary" onClick={() => setAssignFor("all")}><Icon name="plus" size={14}/> Assign training</button>
        </div>
      </div>

      <div className="filterbar">
        <input type="search" placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={dept} onChange={e => setDept(e.target.value)}>
          <option value="All">Department: All</option>
          {departmentOptions.map(d => <option key={d.id} value={d.name}>Department: {d.name}</option>)}
        </select>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="All">Role: All</option><option value="Learner">Role: Learner</option><option value="Manager">Role: Manager</option><option value="Admin">Role: Admin</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">Status: All</option>
          <option value="Active">Status: Active</option><option value="Onboarding">Status: Onboarding</option><option value="On leave">Status: On leave</option><option value="Inactive">Status: Inactive</option>
        </select>
        <div className="fb-spacer" />
        <span className="text-xs text-muted">{sortedUsers.length} of {ALL_USERS.length}</span>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#f0f9e6", border: "1px solid #cfeab0", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: 13 }}>{selectedIds.length} selected</strong>
          <span style={{ fontSize: 12, color: "#5f635f" }}>·</span>
          <span style={{ fontSize: 12, color: "#3a3a3a" }}>Bulk move to:</span>
          <select onChange={e => { if (e.target.value) { bulkMove(e.target.value); e.target.value = ""; } }}
            style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #cfeab0", background: "#fff" }}>
            <option value="">Pick department…</option>
            {DEPARTMENT_DOCS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={clearSelection}>Clear selection</button>
        </div>
      )}

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 32 }}>
              <input type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                onChange={e => setSelectedIds(e.target.checked ? sortedUsers.map(u => u.id) : [])}
                title="Select all visible" />
            </th>
            <AdminSortHeader label="Person" sortKey="name" sort={sort} onSort={setSort} style={{ width: "28%" }} />
            <AdminSortHeader label="Role" sortKey="role" sort={sort} onSort={setSort} />
            <AdminSortHeader label="Department" sortKey="dept" sort={sort} onSort={setSort} />
            <AdminSortHeader label="Status" sortKey="_status" sort={sort} onSort={setSort} />
            <AdminSortHeader label="Assigned" sortKey="_assigned" sort={sort} onSort={setSort} />
            <AdminSortHeader label="Completed" sortKey="_completed" sort={sort} onSort={setSort} />
            <AdminSortHeader label="Due / Overdue" sortKey="_overdue" sort={sort} onSort={setSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((u) => {
            const deptOptions = departmentOptions.map(d => d.name);
            const stats = userStats(u.id);
            const updateRole = async (e) => {
              const newRole = e.target.value;
              try {
                await updateUser(u.id, { role: newRole, isAdmin: newRole === "Admin", isManager: newRole !== "Learner" });
                showToast?.(`${u.name} → ${newRole}`);
              } catch (err) { alert("Update failed: " + err.message); }
            };
            const updateDept = async (e) => {
              try {
                await updateUser(u.id, { dept: e.target.value });
                showToast?.(`${u.name} moved to ${e.target.value}`);
              } catch (err) { alert("Update failed: " + err.message); }
            };
            return (
            <tr key={u.id}>
              <td>
                <input type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggleSelect(u.id)} />
              </td>
              <td>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar name={u.name} size={32} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>
                      {u.email || "—"}
                      {u.needsFirstLogin && <span className="chip chip-amber" style={{ marginLeft: 6, fontSize: 10 }}>Pending first login</span>}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <select value={u.role || "Learner"} onChange={updateRole} disabled={u.adminSource === "google" && u.id !== CURRENT_USER.uid} title={u.adminSource === "google" ? "Inherited from Google Workspace" : ""} style={{
                    border: "1px solid transparent", background: "transparent", borderRadius: 6, padding: "3px 22px 3px 8px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", appearance: "none",
                    color: "#111",
                    backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="%235f635f" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>\')',
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center",
                  }}>
                    <option>Learner</option><option>Manager</option><option>Admin</option>
                  </select>
                  {u.adminSource === "google" && <span title="Inherited from Google Workspace" style={{ color: "#2e5a12" }}><Icon name="lock" size={12} /></span>}
                </div>
              </td>
              <td>
                <select value={u.dept || ""} onChange={updateDept} style={{
                  border: "1px solid transparent", background: "transparent", borderRadius: 6, padding: "3px 22px 3px 8px",
                  fontSize: 12, cursor: "pointer", appearance: "none",
                  backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="%235f635f" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>\')',
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center",
                }}>
                  <option value="">Unassigned</option>
                  {deptOptions.map(d => <option key={d}>{d}</option>)}
                </select>
              </td>
              <td>
                {u.status === "active" && <span className="chip chip-green">Active</span>}
                {u.status === "onboarding" && <span className="chip chip-amber">Onboarding</span>}
                {u.status === "leave" && <span className="chip chip-grey">On leave</span>}
                {u.status === "inactive" && <span className="chip chip-grey">Inactive</span>}
              </td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEnrollmentsFor(u)}
                  style={{ height: 28, padding: "0 8px" }}
                  title="View assigned courses"
                >
                  {stats.assigned}
                </button>
              </td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>{stats.completed}</td>
              <td>
                {stats.overdue > 0 ? (
                  <span style={{ color: "#a8232b", fontWeight: 600, fontSize: 12 }}>{stats.overdue} overdue</span>
                ) : (
                  <span style={{ color: "#5f635f", fontSize: 12 }}>None</span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button className="btn-icon" title="Assign training" onClick={() => openAssign(u.id)}><Icon name="plus" size={14}/></button>
                  <RowMenu items={[
                    { label: "View assigned courses", icon: "book", onClick: () => setEnrollmentsFor(u) },
                    { label: "Assign training", icon: "plus",     onClick: () => openAssign(u.id) },
                    { label: "Send reminder",   icon: "send",     onClick: async () => {
                        if (!u.email) { alert(`No email on file for ${u.name}`); return; }
                        try {
                          const res = await sendEmailReminder({
                            recipients: [{ email: u.email, name: u.name }],
                            message: `This is a reminder from GIM Learning to complete your outstanding training.`,
                          });
                          showToast?.(res.sent ? `Reminder sent to ${u.name}` : `Failed: ${res.errors?.[0]?.error || "unknown error"}`);
                        } catch (err) { alert("Reminder failed: " + err.message); }
                      } },
                    { label: "Reset progress",  icon: "refresh",  onClick: async () => {
                        if (!confirm(`Reset all training progress for ${u.name}?\n\nThis deletes their enrolments and completion history. This cannot be undone.`)) return;
                        try {
                          const n = await resetUserProgress(u.id);
                          showToast?.(`Cleared ${n} enrolment${n === 1 ? "" : "s"} for ${u.name}`);
                        } catch (err) { alert("Reset failed: " + err.message); }
                      } },
                    "divider",
                    { label: u.status === "inactive" ? "Reactivate" : "Deactivate",
                      icon: "lock", danger: u.status !== "inactive",
                      onClick: async () => {
                        try {
                          await updateUser(u.id, { status: u.status === "inactive" ? "active" : "inactive" });
                          showToast?.(u.status === "inactive" ? `${u.name} reactivated` : `${u.name} deactivated`);
                        } catch (err) { alert("Update failed: " + err.message); }
                      } },
                  ]}/>
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>

      <div style={{ marginTop: 24, padding: 18, background: "#fff", border: "1px dashed #d8d9d8", borderRadius: 14, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: "#f0f9e6", color: "#2e5a12", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="users" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Add people before they sign in</div>
          <div style={{ fontSize: 12, color: "#5f635f" }}>
            Create a profile with their work email, then assign courses or set department and role before their first day.
            When they sign in, their prepared profile and assignments will attach to their Google account.
          </div>
        </div>
      </div>
      <AddDirectoryUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onCreated={(id) => {
          setAddUserOpen(false);
          setAssignFor(id);
        }}
      />
      <AssignTrainingModal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        preset={assignFor && assignFor !== "all" ? { userId: assignFor } : null}
      />
      <UserEnrollmentsModal
        open={!!enrollmentsFor}
        onClose={() => setEnrollmentsFor(null)}
        user={enrollmentsFor}
      />
    </div>
  );
};

const AddDirectoryUserModal = ({ open, onClose, onCreated }) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [dept, setDept] = React.useState("");
  const [role, setRole] = React.useState("Learner");
  const [status, setStatus] = React.useState("onboarding");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setDept("");
    setRole("Learner");
    setStatus("onboarding");
    setSaving(false);
  }, [open]);

  if (!open) return null;
  const departmentOptions = [...DEPARTMENT_DOCS].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const submit = async () => {
    if (saving) return;
    if (!email.trim()) { alert("Email is required."); return; }
    setSaving(true);
    try {
      const id = await createDirectoryUser({ name, email, dept, role, status });
      showToast?.("Person added. Choose courses to assign now.");
      onCreated?.(id);
    } catch (err) {
      alert("Add person failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow-sm">Directory</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>Add person</div>
          <div className="text-xs text-muted" style={{ marginTop: 4 }}>Create a learner profile before their first Google sign-in.</div>
        </div>
        <button className="btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
      </div>
      <div style={{ padding: 24, display: "grid", gap: 14 }}>
        <div>
          <FieldLabel>Name</FieldLabel>
          <input className="cd-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div>
          <FieldLabel required>Email</FieldLabel>
          <input className="cd-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@getgim.com" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <FieldLabel>Role</FieldLabel>
            <select className="cd-input" value={role} onChange={e => setRole(e.target.value)}>
              <option>Learner</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select className="cd-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="leave">On leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <FieldLabel>Department</FieldLabel>
          <select className="cd-input" value={dept} onChange={e => setDept(e.target.value)}>
            <option value="">Unassigned</option>
            {departmentOptions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ padding: 12, border: "1px solid #dfead4", background: "#f6fbf0", borderRadius: 10, fontSize: 12, color: "#3a3a3a", lineHeight: 1.5 }}>
          After saving, you can assign courses immediately. On first login, this profile and its assignments will be linked to the employee's Google account.
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "flex-end", gap: 8, background: "#fafafa" }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
          <Icon name="check" size={14}/> {saving ? "Saving..." : "Add person"}
        </button>
      </div>
    </Modal>
  );
};

const _adminDate = (v) => {
  if (!v) return "";
  if (v.toDate) return v.toDate().toLocaleDateString();
  if (v instanceof Date) return v.toLocaleDateString();
  if (typeof v === "string") return v;
  return "";
};

const UserEnrollmentsModal = ({ open, onClose, user }) => {
  const [sort, setSort] = React.useState({ key: "course", dir: "asc" });
  if (!open || !user) return null;

  const rows = _adminSortRows((window.ALL_ENROLLMENTS || [])
    .filter(e => e.userId === user.id)
    .map(e => ({
      e,
      c: COURSES.find(c => c.id === e.courseId) || { id: e.courseId, title: "(missing course)", cat: "" },
    }))
    .map(row => ({
      ...row,
      course: row.c.title || "",
      category: row.c.cat || "",
      status: row.e.status !== "completed" && row.e.dueDays != null && row.e.dueDays <= 0 ? "overdue" : (row.e.status || "assigned"),
      progress: row.e.progress || 0,
      lessons: (row.e.completedLessons || []).length,
      score: row.e.score ?? -1,
      completedOn: row.e.completedOn,
    })), sort);

  const exportCsv = () => {
    const csvRows = rows.map(({ e, c }) => ({
      course: c.title || "",
      category: c.cat || "",
      status: e.status || "assigned",
      progress: e.progress || 0,
      completedLessons: (e.completedLessons || []).length,
      score: e.score ?? "",
      assignedAt: _adminDate(e.assignedAt),
      startedAt: _adminDate(e.startedAt),
      completedOn: _adminDate(e.completedOn),
      dueDays: e.dueDays ?? "",
    }));
    const cols = [
      { key: "course", label: "Course" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "progress", label: "Progress %" },
      { key: "completedLessons", label: "Completed lessons" },
      { key: "score", label: "Score %" },
      { key: "assignedAt", label: "Assigned" },
      { key: "startedAt", label: "Started" },
      { key: "completedOn", label: "Completed" },
      { key: "dueDays", label: "Days until due" },
    ];
    downloadBlob(`${user.id}-assigned-courses-${stamp()}.csv`, toCSV(csvRows, cols), "text/csv;charset=utf-8");
  };

  const completed = rows.filter(({ e }) => e.status === "completed").length;
  const inProgress = rows.filter(({ e }) => e.status === "in_progress").length;
  const overdue = rows.filter(({ e }) => e.status !== "completed" && e.dueDays != null && e.dueDays <= 0).length;

  return (
    <Modal open={open} onClose={onClose} width={900}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow-sm">Assigned courses</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <Avatar name={user.name || user.id} size={34} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{user.name || user.id}</div>
              <div style={{ fontSize: 12, color: "#5f635f", marginTop: 2 }}>{user.email || ""}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <span className="chip chip-grey">{rows.length} assigned</span>
            <span className="chip chip-amber">{inProgress} in progress</span>
            <span className="chip chip-green">{completed} completed</span>
            {overdue > 0 && <span className="chip" style={{ background: "#fdecec", color: "#a8232b" }}>{overdue} overdue</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {rows.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Icon name="download" size={13}/> Export</button>
          )}
          <button className="btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
        {rows.length === 0 ? (
          <div className="empty" style={{ padding: 32 }}>No assigned courses for this person yet.</div>
        ) : (
          <table className="tbl" style={{ margin: 0 }}>
            <thead>
              <tr>
                <AdminSortHeader label="Course" sortKey="course" sort={sort} onSort={setSort} style={{ width: "34%" }} />
                <AdminSortHeader label="Status" sortKey="status" sort={sort} onSort={setSort} />
                <AdminSortHeader label="Progress" sortKey="progress" sort={sort} onSort={setSort} />
                <AdminSortHeader label="Lessons" sortKey="lessons" sort={sort} onSort={setSort} />
                <AdminSortHeader label="Score" sortKey="score" sort={sort} onSort={setSort} />
                <AdminSortHeader label="Dates" sortKey="completedOn" sort={sort} onSort={setSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, c }) => {
                const progress = e.progress || 0;
                const completedLessons = (e.completedLessons || []).length;
                const totalLessons = (c.sections || c.modules || []).reduce((sum, sec) => sum + (sec.lessons?.length || 0), 0) || c.lessons || 0;
                const isOverdue = e.status !== "completed" && e.dueDays != null && e.dueDays <= 0;
                return (
                  <tr key={e.id || `${e.userId}_${e.courseId}`}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: "#5f635f", marginTop: 2 }}>{c.cat || ""}</div>
                    </td>
                    <td>
                      {isOverdue ? <span className="chip" style={{ background: "#fdecec", color: "#a8232b" }}>Overdue</span> :
                       e.status === "completed" ? <span className="chip chip-green">Completed</span> :
                       e.status === "in_progress" ? <span className="chip chip-amber">In progress</span> :
                       <span className="chip chip-grey">Assigned</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="bar bar-thin" style={{ width: 110 }}>
                          <div style={{ width: `${progress}%`, background: progress >= 100 ? "#7ac142" : "#f5a524" }}/>
                        </div>
                        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{progress}%</span>
                      </div>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                      {totalLessons ? `${completedLessons} / ${totalLessons}` : completedLessons}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                      {e.score != null ? `${e.score}%` : "—"}
                    </td>
                    <td style={{ fontSize: 11, color: "#5f635f", lineHeight: 1.5 }}>
                      {_adminDate(e.assignedAt) && <div>Assigned: {_adminDate(e.assignedAt)}</div>}
                      {_adminDate(e.startedAt) && <div>Started: {_adminDate(e.startedAt)}</div>}
                      {_adminDate(e.completedOn) && <div>Completed: {_adminDate(e.completedOn)}</div>}
                      {e.status !== "completed" && e.dueDays != null && (
                        <div style={isOverdue ? { color: "#a8232b", fontWeight: 700 } : {}}>
                          {isOverdue ? `${Math.abs(e.dueDays)} day${Math.abs(e.dueDays) === 1 ? "" : "s"} overdue` : `${e.dueDays} day${e.dueDays === 1 ? "" : "s"} due`}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                        <button className="btn btn-ghost btn-sm" onClick={async () => {
                          if (!confirm(`Reset progress for "${c.title}" for ${user.name || user.id}?\n\nThis keeps the course assigned, clears lesson progress and score, and moves it back to Assigned.`)) return;
                          try {
                            const changed = await resetCourseProgress(user.id, e.courseId);
                            showToast?.(changed ? `Reset "${c.title}" progress` : "Enrollment was already removed");
                          } catch (err) {
                            alert("Reset failed: " + err.message);
                          }
                        }}>
                          Reset
                        </button>
                        {e.status === "completed" ? (
                          <span className="text-xs text-muted">Locked</span>
                        ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: "#a8232b" }} onClick={async () => {
                          if (!confirm(`Unassign "${c.title}" from ${user.name || user.id}?\n\nTheir progress for this course will be removed. Completed courses cannot be unassigned.`)) return;
                          try {
                            const changed = await unassignCourse(user.id, e.courseId);
                            showToast?.(changed ? `Unassigned "${c.title}"` : "Enrollment was already removed");
                          } catch (err) {
                            alert("Unassign failed: " + err.message);
                          }
                        }}>
                          Unassign
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
};

// ============================================================
// Admin: Assessments
// ============================================================
const AdminAssessmentsPage = () => {
  const [editing, setEditing] = React.useState(null); // null = closed, {} = new, doc = edit
  const [sort, setSort] = React.useState({ key: "title", dir: "asc" });
  const [importing, setImporting] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("All");
  const importInputRef = React.useRef(null);
  const visible = _adminSortRows(ASSESSMENTS
    .filter(a => {
      const status = (a.status || "published").toLowerCase();
      if (statusFilter === "All" && status === "archived") return false;
      if (statusFilter !== "All" && status !== statusFilter.toLowerCase()) return false;
      return true;
    })
    .map(a => {
      const linked = COURSES.find(c => c.id === a.courseId);
      return {
        ...a,
        _courseTitle: linked?.title || "",
        _typeLabel: a.type === "quiz" ? "Quiz" : "Final certification",
        _questionCount: a.questions?.length || 0,
        _passMark: a.passMark || 80,
        _status: a.status || "published",
      };
    }), sort);
  const totalAssessments = visible.length;
  const importAssessments = async (file) => {
    if (!file) return;
    if (!window.fbReady) { alert("Firebase isn't configured - can't import."); return; }
    setImporting(true);
    try {
      const rows = await _adminReadCsvFile(file);
      const grouped = new Map();
      rows.forEach((r, idx) => {
        const title = r.title || r.assessment_title || r.name;
        if (!title) return;
        if (!grouped.has(title)) grouped.set(title, { first: r, rows: [] });
        grouped.get(title).rows.push({ ...r, _row: idx + 2 });
      });
      if (!grouped.size) throw new Error("No rows with a title column were found.");
      const coursesByTitle = Object.fromEntries(COURSES.map(c => [(c.title || "").toLowerCase(), c]));
      let count = 0;
      for (const [title, group] of grouped) {
        const first = group.first;
        const linkedCourse = first.course_id
          ? COURSES.find(c => c.id === first.course_id)
          : coursesByTitle[String(first.course_title || first.course || "").toLowerCase()];
        if (!linkedCourse) throw new Error(`Could not match course for "${title}". Use course_id or an exact course_title.`);
        const rawType = (first.type || "final").toLowerCase();
        const type = rawType === "quiz" ? "quiz" : "final";
        const questions = group.rows.map(r => {
          const text = r.question || r.question_text || "";
          if (!text) return null;
          const qType = (r.question_type || r.type || "single").toLowerCase();
          const type = ["single", "multi", "tf", "short", "essay", "ranking", "matching"].includes(qType) ? qType : "single";
          const options = type === "tf" ? ["True", "False"] : (type === "short" || type === "essay" ? [] : _adminSplitList(r.options));
          const q = {
            type,
            text,
            options,
            correct: type === "short" || type === "essay" ? [] : (type === "ranking" || type === "matching" ? options.map((_, i) => i) : _adminCorrectIndicesFromCsv(r.correct || r.correct_answer, options)),
            points: parseInt(r.points || "", 10) || 1,
            explanation: r.explanation || "",
          };
          if (type === "matching") q.matchOptions = _adminSplitList(r.matches || r.match_options || r.matching_values);
          return q;
        }).filter(Boolean);
        const saved = {
          title,
          description: first.description || "",
          courseId: linkedCourse.id,
          type,
          passMark: type === "quiz" ? 100 : (parseInt(first.pass_mark || first.passmark || "", 10) || 80),
          attemptsAllowed: first.attempts_allowed ? parseInt(first.attempts_allowed, 10) : (type === "quiz" ? null : 3),
          timeLimit: first.time_limit ? parseInt(first.time_limit, 10) : null,
          shuffleQuestions: !_adminBool(first.no_shuffle),
          showAnswers: first.show_answers || "after-pass",
          certOnPass: type !== "quiz",
          questions,
          status: "draft",
        };
        const assessmentId = await saveAssessment(saved);
        if (type === "quiz") {
          await _adminLinkQuizToCourseLesson(linkedCourse, { ...saved, id: assessmentId }, first);
        }
        count++;
      }
      showToast?.(`Imported ${count} draft assessment${count === 1 ? "" : "s"}`);
    } catch (err) {
      alert("Assessment import failed: " + err.message);
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Assessments</div>
          <h1 className="page-head__title">Assessments & quizzes</h1>
          <div className="page-head__sub">Manage questions, pass thresholds, and review attempt analytics.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => _adminDownloadCsvTemplate(`assessment-import-template-${stamp()}.csv`, _adminAssessmentImportTemplate)}>
            <Icon name="download" size={14}/> CSV template
          </button>
          <button className="btn btn-ghost" disabled={importing} onClick={() => importInputRef.current?.click()}>
            <Icon name="upload" size={14}/> {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={importInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => importAssessments(e.target.files?.[0])} />
          <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={14}/> New assessment</button>
        </div>
      </div>
      <NewAssessmentModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={editing && editing.id ? editing : null}
      />

      <div className="filterbar">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">Status: All</option><option value="Published">Status: Published</option><option value="Draft">Status: Draft</option><option value="Archived">Status: Archived</option>
        </select>
        <div className="fb-spacer" />
        <span className="text-xs text-muted">{visible.length} assessments</span>
      </div>

      <div className="dash-grid mb-6">
        <div className="stat">
          <div className="stat__label">Total assessments</div>
          <div className="stat__value">{totalAssessments}</div>
          <div className="stat__sub">{totalAssessments ? `${ASSESSMENTS.filter(a => a.status === "archived").length} archived` : "none yet"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Avg. pass rate</div>
          <div className="stat__value">—</div>
          <div className="stat__sub">Attempt tracking coming soon</div>
        </div>
        <div className="stat">
          <div className="stat__label">Attempts last 30d</div>
          <div className="stat__value">0</div>
          <div className="stat__sub">No activity</div>
        </div>
        <div className="stat">
          <div className="stat__label">Lowest scoring</div>
          <div className="stat__value" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>—</div>
          <div className="stat__sub">No data</div>
        </div>
      </div>

      {totalAssessments === 0 ? (
        <div className="empty">No assessments yet. Create one with the button above.</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <AdminSortHeader label="Assessment" sortKey="title" sort={sort} onSort={setSort} style={{ width: "32%" }} />
              <AdminSortHeader label="Linked course" sortKey="_courseTitle" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Type" sortKey="_typeLabel" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Questions" sortKey="_questionCount" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Pass mark" sortKey="_passMark" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Status" sortKey="_status" sort={sort} onSort={setSort} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(a => {
              const linked = COURSES.find(c => c.id === a.courseId);
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                    {a.description && <div style={{ fontSize: 11, color: "#5f635f" }}>{a.description}</div>}
                  </td>
                  <td>
                    {linked ? <span className="chip chip-grey">{linked.title}</span>
                            : <span className="text-xs text-muted">— missing —</span>}
                  </td>
                  <td><span className="chip chip-grey">{a.type === "quiz" ? "Quiz" : "Final certification"}</span></td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{a.questions?.length || 0}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{a.passMark || 80}%</td>
                  <td>
                    {a.status === "draft" ? <span className="chip chip-amber">Draft</span> :
                     a.status === "archived" ? <span className="chip chip-grey">Archived</span> :
                                               <span className="chip chip-green">Published</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button className="btn-icon" title="Edit" onClick={() => setEditing(a)}><Icon name="edit" size={14}/></button>
                      <RowMenu items={(() => {
                        const isArchived = a.status === "archived";
                        const items = [
                          { label: "Edit questions & settings", icon: "edit", onClick: () => setEditing(a) },
                          "divider",
                        ];
                        if (isArchived) {
                          items.push(
                            { label: "Restore (unarchive)", icon: "refresh", onClick: async () => {
                                try { await saveAssessment({ id: a.id, status: "draft" }); showToast?.(`${a.title} restored as draft`); }
                                catch (err) { alert("Restore failed: " + err.message); }
                              } },
                            { label: "Delete permanently", icon: "trash", danger: true, onClick: async () => {
                                if (!confirm(`Permanently delete "${a.title}"?\n\nThis cannot be undone. Type-confirm in the next prompt.`)) return;
                                const typed = prompt(`Type the assessment title to confirm deletion:\n\n${a.title}`);
                                if (typed !== a.title) { showToast?.("Deletion cancelled - title didn't match"); return; }
                                try { await deleteAssessment(a.id); showToast?.(`"${a.title}" deleted`); }
                                catch (err) { alert("Delete failed: " + err.message); }
                              } },
                          );
                        } else {
                          items.push(
                            { label: a.status === "draft" ? "Publish" : "Unpublish", icon: a.status === "draft" ? "check" : "eye-off",
                              onClick: async () => {
                                const next = a.status === "draft" ? "published" : "draft";
                                try { await saveAssessment({ id: a.id, status: next }); showToast?.(`${a.title} ${next === "published" ? "published" : "unpublished"}`); }
                                catch (err) { alert("Failed: " + err.message); }
                              } },
                            { label: "Archive", icon: "trash", danger: true, onClick: async () => {
                                if (!confirm(`Archive "${a.title}"? It will be hidden from the default assessment list. You can permanently delete it from the Archived view afterwards.`)) return;
                                try { await archiveAssessment(a.id); showToast?.(`${a.title} archived`); }
                                catch (err) { alert("Archive failed: " + err.message); }
                              } },
                          );
                        }
                        return items;
                      })()}/>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ============================================================
// Admin: Activity feed + admin audit log
// ============================================================
const _activityTime = (row) => row?.createdAt?.toDate ? row.createdAt.toDate()
  : row?.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000)
  : null;

const _activityIso = (row) => {
  const d = _activityTime(row);
  return d ? d.toISOString() : "";
};

const _activityLocal = (row) => {
  const d = _activityTime(row);
  return d ? d.toLocaleString() : "—";
};

const _activityNextSort = (current, key) => {
  if (key === "time") return current === "newest" ? "oldest" : "newest";
  if (key === "person") return current === "person" ? "person_desc" : "person";
  if (key === "activity") return current === "activity" ? "activity_desc" : "activity";
  if (key === "course") return current === "course" ? "course_desc" : "course";
  return key;
};
const ActivitySortHeader = ({ label, sortKey, sort, onSort, style }) => {
  const active = sortKey === "time"
    ? (sort === "newest" || sort === "oldest")
    : (sort === sortKey || sort === `${sortKey}_desc`);
  const desc = sortKey === "time" ? sort === "newest" : sort === `${sortKey}_desc`;
  return (
    <th style={style}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => onSort(_activityNextSort(sort, sortKey))}
        style={{ height: "auto", padding: "6px 8px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", gap: 8 }}
      >
        {label}<span aria-hidden="true" style={{ color: active ? "#111" : "#9a9d9a", fontSize: 10 }}>{active ? (desc ? "▼" : "▲") : "↕"}</span>
      </button>
    </th>
  );
};

const AdminActivityPage = () => {
  const [view, setView] = React.useState("learner");
  const [q, setQ] = React.useState("");
  const [courseId, setCourseId] = React.useState("All");
  const [personId, setPersonId] = React.useState("All");
  const [sort, setSort] = React.useState("newest");

  const usersById = Object.fromEntries((window.ALL_USERS || []).map(u => [u.id, u]));
  const coursesById = Object.fromEntries((window.COURSES || []).map(c => [c.id, c]));
  const sourceRows = view === "admin" ? (window.ADMIN_ACTIVITY || []) : (window.ALL_ACTIVITY || []);

  const people = Array.from(new Set(sourceRows.map(r => view === "admin" ? r.actorId : r.userId).filter(Boolean)))
    .map(id => {
      const u = usersById[id];
      const sample = sourceRows.find(r => (view === "admin" ? r.actorId : r.userId) === id) || {};
      return { id, name: u?.name || sample.actorName || sample.userName || id, email: u?.email || sample.actorEmail || sample.userEmail || "" };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const needle = q.trim().toLowerCase();
  const visible = sourceRows.filter(r => {
    const id = view === "admin" ? r.actorId : r.userId;
    const u = usersById[id] || {};
    const c = coursesById[r.courseId] || {};
    const hay = [
      view === "admin" ? r.action : r.text,
      r.actorName, r.actorEmail, r.userName, r.userEmail,
      u.name, u.email, c.title, r.courseId, r.targetUserId, r.fields, r.status, r.type,
    ].filter(Boolean).join(" ").toLowerCase();
    if (needle && !hay.includes(needle)) return false;
    if (courseId !== "All" && r.courseId !== courseId) return false;
    if (personId !== "All" && id !== personId) return false;
    return true;
  }).sort((a, b) => {
    const ta = _activityTime(a)?.getTime() || 0;
    const tb = _activityTime(b)?.getTime() || 0;
    if (sort === "oldest") return ta - tb;
    if (sort === "person" || sort === "person_desc") {
      const ap = view === "admin" ? (a.actorName || usersById[a.actorId]?.name || a.actorId || "") : (usersById[a.userId]?.name || a.userName || a.userId || "");
      const bp = view === "admin" ? (b.actorName || usersById[b.actorId]?.name || b.actorId || "") : (usersById[b.userId]?.name || b.userName || b.userId || "");
      const result = ap.localeCompare(bp) || tb - ta;
      return sort === "person_desc" ? -result : result;
    }
    if (sort === "activity" || sort === "activity_desc") {
      const aa = view === "admin" ? (a.action || "") : (a.text || "");
      const ba = view === "admin" ? (b.action || "") : (b.text || "");
      const result = aa.localeCompare(ba) || tb - ta;
      return sort === "activity_desc" ? -result : result;
    }
    if (sort === "course" || sort === "course_desc") {
      const ac = coursesById[a.courseId]?.title || a.courseId || "";
      const bc = coursesById[b.courseId]?.title || b.courseId || "";
      const result = ac.localeCompare(bc) || tb - ta;
      return sort === "course_desc" ? -result : result;
    }
    return tb - ta;
  });

  const exportVisible = () => {
    const rows = visible.map(r => {
      const id = view === "admin" ? r.actorId : r.userId;
      const u = usersById[id] || {};
      const c = coursesById[r.courseId] || {};
      if (view === "admin") {
        return {
          time: _activityIso(r),
          actor: r.actorName || u.name || id || "",
          actorEmail: r.actorEmail || u.email || "",
          action: r.action || "",
          course: c.title || r.courseId || "",
          targetUserId: r.targetUserId || "",
          details: [r.fields, r.status, r.type, r.count, r.userCount, r.courseCount].filter(v => v !== undefined && v !== "").join(" | "),
        };
      }
      return {
        time: _activityIso(r),
        learner: u.name || r.userName || id || "",
        learnerEmail: u.email || r.userEmail || "",
        course: c.title || r.courseId || "",
        activity: r.text || "",
      };
    });
    const columns = view === "admin"
      ? [
          { key: "time", label: "Time" },
          { key: "actor", label: "Admin" },
          { key: "actorEmail", label: "Admin email" },
          { key: "action", label: "Action" },
          { key: "course", label: "Course" },
          { key: "targetUserId", label: "Target user ID" },
          { key: "details", label: "Details" },
        ]
      : [
          { key: "time", label: "Time" },
          { key: "learner", label: "Learner" },
          { key: "learnerEmail", label: "Learner email" },
          { key: "course", label: "Course" },
          { key: "activity", label: "Activity" },
        ];
    downloadBlob(`gim-${view}-activity-${stamp()}.csv`, toCSV(rows, columns), "text/csv;charset=utf-8");
  };

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Activity</div>
          <h1 className="page-head__title">Activity feed</h1>
          <div className="page-head__sub">Review learner activity and admin-side audit events.</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={exportVisible}>
          <Icon name="download" size={14}/> Export CSV
        </button>
      </div>

      <div className="tabs">
        <button className={classNames("tab", view === "learner" && "active")} onClick={() => { setView("learner"); setPersonId("All"); }}>
          Learner activity · {(window.ALL_ACTIVITY || []).length}
        </button>
        <button className={classNames("tab", view === "admin" && "active")} onClick={() => { setView("admin"); setCourseId("All"); setPersonId("All"); }}>
          Admin audit · {(window.ADMIN_ACTIVITY || []).length}
        </button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.4fr) 1fr 1fr 180px", gap: 10 }}>
          <input className="cd-input" type="search" placeholder="Search activity..." value={q} onChange={e => setQ(e.target.value)} />
          <select className="cd-input" value={personId} onChange={e => setPersonId(e.target.value)}>
            <option value="All">{view === "admin" ? "All admins" : "All learners"}</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}{p.email ? ` - ${p.email}` : ""}</option>)}
          </select>
          <select className="cd-input" value={courseId} onChange={e => setCourseId(e.target.value)} disabled={view === "admin"}>
            <option value="All">All courses</option>
            {[...COURSES].sort((a, b) => (a.title || "").localeCompare(b.title || "")).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select className="cd-input" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="person">{view === "admin" ? "Admin A-Z" : "Learner A-Z"}</option>
            <option value="person_desc">{view === "admin" ? "Admin Z-A" : "Learner Z-A"}</option>
            <option value="activity">Activity A-Z</option>
            <option value="activity_desc">Activity Z-A</option>
            <option value="course">Course A-Z</option>
            <option value="course_desc">Course Z-A</option>
          </select>
        </div>
        <div className="text-xs text-muted" style={{ marginTop: 8 }}>
          Showing {visible.length} of {sourceRows.length} {view === "admin" ? "audit events" : "activity events"}.
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">{sourceRows.length ? "No activity matches these filters." : "No activity logged yet."}</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <ActivitySortHeader label="Time" sortKey="time" sort={sort} onSort={setSort} style={{ width: 170 }} />
              <ActivitySortHeader label={view === "admin" ? "Admin" : "Learner"} sortKey="person" sort={sort} onSort={setSort} />
              <ActivitySortHeader label="Activity" sortKey="activity" sort={sort} onSort={setSort} />
              <ActivitySortHeader label="Course / target" sortKey="course" sort={sort} onSort={setSort} />
            </tr>
          </thead>
          <tbody>
            {visible.map(r => {
              const id = view === "admin" ? r.actorId : r.userId;
              const u = usersById[id] || {};
              const c = coursesById[r.courseId];
              const name = view === "admin" ? (r.actorName || u.name || id || "Admin") : (u.name || r.userName || id || "Learner");
              const email = view === "admin" ? (r.actorEmail || u.email || "") : (u.email || r.userEmail || "");
              return (
                <tr key={r.id || `${id}-${_activityIso(r)}-${r.text || r.action}`}>
                  <td style={{ fontSize: 12, color: "#5f635f" }}>{_activityLocal(r)}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{view === "admin" ? r.action : r.text}</div>
                    {view === "admin" && (
                      <div style={{ fontSize: 11, color: "#5f635f", marginTop: 2 }}>
                        {[r.fields && `Fields: ${r.fields}`, r.status && `Status: ${r.status}`, r.count != null && `Count: ${r.count}`, r.userCount != null && `${r.userCount} users`, r.courseCount != null && `${r.courseCount} courses`].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td>
                    {c ? <span className="chip chip-grey">{c.title}</span> :
                     r.targetUserId ? <span className="chip chip-grey">{usersById[r.targetUserId]?.name || r.targetUserId}</span> :
                     <span className="text-xs text-muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ============================================================
// Admin: Roles & departments
// ============================================================
const DEFAULT_ROLES = [
  { name: "Learner", desc: "Can view assigned & published courses, take assessments, earn certificates.", perms: ["browse", "take", "viewOwn"], chips: ["Browse catalog", "Take courses", "View own progress"] },
  { name: "Manager", desc: "Sees their direct reports' progress and can nudge or reassign training.",       perms: ["browse", "take", "viewOwn", "viewTeam", "remind", "reassign", "exportReport"], chips: ["All Learner perms", "View reports for direct reports", "Send reminders"] },
  { name: "Admin",   desc: "Full access — manage courses, assessments, people, and reports.",              perms: ["all"], chips: ["Everything"] },
];

const AdminSettingsPage = () => {
  const [deptModal, setDeptModal] = React.useState({ open: false, initial: null });
  const [roleModal, setRoleModal] = React.useState({ open: false, initial: null });
  const sortedDepartments = [...DEPARTMENT_DOCS].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const sortedRoles = [...ROLE_DOCS].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Settings</div>
          <h1 className="page-head__title">Roles & departments</h1>
          <div className="page-head__sub">Custom user attributes that don't sync from Google. Used to assign training automatically.</div>
        </div>
      </div>

      <div className="dash-2col">
        <div>
          <div className="card card-pad-lg">
            <div className="eyebrow-sm" style={{ marginBottom: 6 }}>Departments</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Organizational departments</h3>
            <p className="text-muted text-sm" style={{ marginBottom: 18 }}>
              Used in reporting, filtering, and auto-assignment rules.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEPARTMENT_DOCS.length === 0 && (
                <div className="text-xs text-muted" style={{ padding: "10px 4px" }}>
                  No departments yet. Click "Add department" to create your first one.
                </div>
              )}
              {sortedDepartments.map(d => {
                const preset = (window.DEPT_PRESETS || [])[d.iconIdx ?? 0] || { icon: "house", bg: "#f0f9e6", color: "#2e5a12" };
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #ececec", borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: preset.bg, color: preset.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={preset.icon} size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "#5f635f" }}>{ALL_USERS.filter(u => u.dept === d.name).length} people</div>
                    </div>
                    <button className="btn-icon" title="Edit department" onClick={() => setDeptModal({ open: true, initial: d })}><Icon name="edit" size={14}/></button>
                  </div>
                );
              })}
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={() => setDeptModal({ open: true, initial: null })}>
                <Icon name="plus" size={14}/> Add department
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card card-pad-lg">
            <div className="eyebrow-sm" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Roles</span>
              <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setRoleModal({ open: true, initial: null })}>
                <Icon name="plus" size={12}/> New role
              </button>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>LMS roles</h3>
            <p className="text-muted text-sm" style={{ marginBottom: 18 }}>What someone can do inside the LMS.</p>
            {DEFAULT_ROLES.map(r => {
              const count = ALL_USERS.filter(u => u.role === r.name).length;
              return (
                <div key={r.name} style={{ padding: "14px 0", borderBottom: "1px solid #ececec" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                        <span className="chip chip-grey">{count} {count === 1 ? "person" : "people"}</span>
                        <span className="chip chip-grey" style={{ background: "#f0f9e6", color: "#2e5a12", borderColor: "#cfeab0" }}>Built-in</span>
                      </div>
                      <div className="text-muted text-sm">{r.desc}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {r.chips.map(p => <span key={p} className="chip chip-green">{p}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedRoles.map(r => {
              const count = ALL_USERS.filter(u => u.role === r.name).length;
              return (
                <div key={r.id} style={{ padding: "14px 0", borderBottom: "1px solid #ececec" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                        <span className="chip chip-grey">{count} {count === 1 ? "person" : "people"}</span>
                      </div>
                      {r.desc && <div className="text-muted text-sm">{r.desc}</div>}
                      <div className="text-xs text-muted" style={{ marginTop: 6 }}>
                        {r.perms?.length || 0} permission{r.perms?.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-icon" title="Edit role" onClick={() => setRoleModal({ open: true, initial: r })}><Icon name="edit" size={14}/></button>
                      <button className="btn-icon" title="Delete role" style={{ color: "#a8232b" }} onClick={async () => {
                        if (count > 0) { alert(`Cannot delete: ${count} ${count === 1 ? "person has" : "people have"} this role. Reassign them first.`); return; }
                        if (!confirm(`Delete role "${r.name}"?`)) return;
                        try { await deleteRole(r.id); showToast?.(`Role "${r.name}" deleted`); }
                        catch (err) { alert("Delete failed: " + err.message); }
                      }}><Icon name="trash" size={14}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card card-pad mt-4">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#111", color: "#7ac142", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="shield" size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Admin access &amp; Google Workspace</div>
                <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                  Anyone with the <strong>Super Admin</strong> role in Google Workspace is automatically granted LMS Admin on first sign-in. From there, those admins can promote any other user to LMS Admin or Manager from the People page — those roles persist in the LMS regardless of Google group changes.
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="chip chip-green">{ALL_USERS.filter(u => u.adminSource === "google").length} inherited from Google</span>
                  <span className="chip chip-grey">{ALL_USERS.filter(u => u.adminSource === "granted").length} manually granted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DepartmentEditModal
        open={deptModal.open}
        onClose={() => setDeptModal({ open: false, initial: null })}
        initial={deptModal.initial}
      />
      <RoleEditModal
        open={roleModal.open}
        onClose={() => setRoleModal({ open: false, initial: null })}
        initial={roleModal.initial}
      />
    </div>
  );
};

// ============================================================
// Admin: Attempts (manual grading queue + history)
// ============================================================
const AdminAttemptsPage = () => {
  const [tab, setTab] = React.useState("pending");
  const [grading, setGrading] = React.useState(null); // attempt being graded
  const [sort, setSort] = React.useState({ key: "_learner", dir: "asc" });

  const sorted = _adminSortRows([...ATTEMPTS].map(a => {
    const c = COURSES.find(x => x.id === a.courseId);
    return {
      ...a,
      _learner: a.userName || a.userEmail || a.userId || "",
      _courseTitle: c?.title || "",
      _submitted: a.submittedAt?.seconds || 0,
      _autoScore: a.autoScore ?? -1,
      _finalScore: a.finalScore ?? -1,
    };
  }), sort);

  const pending = sorted.filter(a => a.status === "pending_review");
  const graded = sorted.filter(a => a.status === "graded");

  const list = tab === "pending" ? pending : graded;

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Attempts</div>
          <h1 className="page-head__title">Assessment attempts</h1>
          <div className="page-head__sub">Audit log of every submission. Pending-review items need your grading.</div>
        </div>
      </div>

      <div className="tabs">
        <button className={classNames("tab", tab === "pending" && "active")} onClick={() => setTab("pending")}>
          Pending review · {pending.length}
        </button>
        <button className={classNames("tab", tab === "graded" && "active")} onClick={() => setTab("graded")}>
          Graded · {graded.length}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty">{tab === "pending" ? "Nothing waiting for review." : "No graded attempts yet."}</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <AdminSortHeader label="Learner" sortKey="_learner" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Course" sortKey="_courseTitle" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Submitted" sortKey="_submitted" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Auto score" sortKey="_autoScore" sort={sort} onSort={setSort} />
              <AdminSortHeader label="Final" sortKey="_finalScore" sort={sort} onSort={setSort} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(a => {
              const c = COURSES.find(x => x.id === a.courseId);
              const submittedTs = a.submittedAt?.toDate ? a.submittedAt.toDate() : null;
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.userName || a.userId}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{a.userEmail || ""}</div>
                  </td>
                  <td>{c?.title || "(missing)"}</td>
                  <td style={{ fontSize: 12, color: "#5f635f" }}>{submittedTs ? submittedTs.toLocaleString() : "—"}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{a.autoScore != null ? `${a.autoScore}%` : "—"}</td>
                  <td>
                    {a.status === "pending_review" ? <span className="chip chip-amber">Pending</span> :
                     a.passed ? <span className="chip chip-green">{a.finalScore}% · Pass</span> :
                                <span className="chip chip-grey">{a.finalScore != null ? `${a.finalScore}% · Fail` : "—"}</span>}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setGrading(a)}>
                      {a.status === "pending_review" ? "Grade" : "Edit"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {grading && <GradeAttemptModal attempt={grading} onClose={() => setGrading(null)} />}
    </div>
  );
};

const _adminAnswerCorrectIndices = (q) => Array.isArray(q.correct) ? q.correct : (q.correct != null ? [q.correct] : []);
const _adminAnswerText = (q, ans) => {
  if (q.type === "ranking") return Array.isArray(ans) ? ans.map(idx => q.options?.[idx]).filter(Boolean).join(" -> ") : "(none)";
  if (q.type === "matching") return ans && typeof ans === "object" ? (q.options || []).map((left, i) => `${left}: ${q.matchOptions?.[ans[i]] || "(none)"}`).join("; ") : "(none)";
  if (Array.isArray(ans)) return ans.map(idx => q.options?.[idx]).filter(Boolean).join(", ") || "(none)";
  if (typeof ans === "number") return q.options?.[ans] || "(none)";
  if (typeof ans === "string") return ans.trim() || "(blank)";
  return "(none)";
};
const _adminCorrectAnswerText = (q) => {
  if (q.type === "ranking") return (q.options || []).join(" -> ") || "No answer key";
  if (q.type === "matching") return (q.options || []).map((left, i) => `${left}: ${q.matchOptions?.[i] || ""}`).join("; ") || "No answer key";
  const idxs = _adminAnswerCorrectIndices(q);
  return idxs.map(idx => q.options?.[idx]).filter(Boolean).join(", ") || "No answer key";
};
const _adminAnswerIsCorrect = (q, ans) => {
  if (q.type === "short" || q.type === "essay") return null;
  if (q.type === "ranking") {
    const expected = (q.options || []).map((_, i) => i);
    return Array.isArray(ans) && expected.length === ans.length && expected.every((idx, i) => ans[i] === idx);
  }
  if (q.type === "matching") {
    const expected = (q.matchOptions || []).map((_, i) => i);
    return ans && typeof ans === "object" && expected.every((idx, i) => Number(ans[i]) === idx);
  }
  const idxs = _adminAnswerCorrectIndices(q);
  if (q.type === "multi") {
    const correctSet = new Set(idxs);
    const givenSet = new Set(ans || []);
    return correctSet.size === givenSet.size && [...correctSet].every(x => givenSet.has(x));
  }
  return ans === idxs[0];
};

// ---------- Grade Attempt modal ----------
const GradeAttemptModal = ({ attempt, onClose }) => {
  const a = attempt;
  const linkedAssessment = ASSESSMENTS.find(x => x.id === a.assessmentId);
  const questions = linkedAssessment?.questions || [];
  const isRegrade = a.status === "graded";

  const [manualScores, setManualScores] = React.useState(() => a.manualScores || {});
  const [notes, setNotes] = React.useState(a.gradedNotes || "");
  const [busy, setBusy] = React.useState(false);

  // Recompute final score per-question so we account for each question's
  // own `points` value (essay worth 18 pts, MCQ worth 1 pt, etc.).
  const finalScore = React.useMemo(() => {
    if (questions.length === 0) return 0;
    let totalPossible = 0;
    let totalEarned = 0;
    questions.forEach((q, i) => {
      const pts = q.points || 1;
      totalPossible += pts;
      if (q.type === "short" || q.type === "essay") {
        const v = manualScores[i];
        if (typeof v === "number") totalEarned += Math.min(pts, Math.max(0, v));
      } else {
        const learnerAns = a.answers?.[i];
        if (_adminAnswerIsCorrect(q, learnerAns)) totalEarned += pts;
      }
    });
    return totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 0;
  }, [manualScores, a, questions]);

  const passed = a.passMark != null ? finalScore >= a.passMark : null;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gradeAttempt(a.id, {
        manualScores,
        finalScore,
        passed,
        gradedNotes: notes,
      });
      // If passed, also record completion on the enrollment
      const course = COURSES.find(c => c.id === a.courseId);
      if (passed && course) {
        if ((linkedAssessment?.type === "quiz" || a.lessonId) && a.lessonId) {
          try { await markLessonComplete(course, a.lessonId, a.userId); } catch {}
        } else {
          try { await recordCompletion(course, finalScore, a.userId); } catch {}
        }
      }
      // Email the learner
      if (!isRegrade && a.userEmail && (window.GIM_CONFIG || {}).appsScriptReminderUrl) {
        try {
          await sendEmailReminder({
            recipients: [{ email: a.userEmail, name: a.userName }],
            subject: passed ? `You passed: ${course?.title || "your assessment"}` : `Assessment graded: ${course?.title || ""}`,
            message: passed
              ? `Great news — you scored ${finalScore}% and passed. Your certificate is now available in GIM Learning.`
              : `Your assessment was graded. Final score: ${finalScore}%. ${a.passMark != null ? `Passing requires ${a.passMark}%. ` : ""}Please retake when you're ready.`,
          });
        } catch {}
      }
      showToast?.(isRegrade ? "Grade updated" : "Attempt graded");
      onClose();
    } catch (err) {
      alert("Grading failed: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} width={760}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow-sm">{isRegrade ? "Edit graded attempt" : "Grade attempt"}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{a.userName || a.userId}</div>
          <div style={{ fontSize: 12, color: "#5f635f", marginTop: 2 }}>
            {COURSES.find(c => c.id === a.courseId)?.title || ""} · auto-score {a.autoScore != null ? `${a.autoScore}%` : "—"}
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {questions.length === 0 ? (
          <div className="text-muted text-sm">The linked assessment doc was deleted; raw answers shown below.</div>
        ) : null}

        {questions.map((q, i) => {
          const ans = a.answers?.[i];
          const isManual = q.type === "short" || q.type === "essay";
          if (!isManual) {
            // Show auto-graded summary
            const display = _adminAnswerText(q, ans);
            const correct = _adminAnswerIsCorrect(q, ans);
            const showReview = a.status === "graded";
            return (
              <div key={i} style={{ padding: 14, marginBottom: 10, border: `1px solid ${showReview && correct === false ? "#f3c4c7" : "#ececec"}`, borderRadius: 10, background: showReview && correct === false ? "#fffafa" : "#fafafa" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#5f635f" }}>Q{i + 1}</span>
                  <span className="chip chip-grey" style={{ fontSize: 10 }}>{qTypeLabel ? qTypeLabel(q.type) : q.type}</span>
                  <span style={{ fontSize: 11, color: "#5f635f" }}>auto-graded</span>
                  {showReview && correct === true && <span className="chip chip-green" style={{ fontSize: 10 }}>Correct</span>}
                  {showReview && correct === false && <span className="chip" style={{ fontSize: 10, background: "#fdecec", color: "#a8232b" }}>Incorrect</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{q.text || q.q}</div>
                <div style={{ fontSize: 12, color: "#5f635f", marginTop: 6 }}>Their answer: <strong>{display}</strong></div>
                {showReview && correct === false && (
                  <div style={{ fontSize: 12, color: "#2e5a12", marginTop: 4 }}>Correct answer: <strong>{_adminCorrectAnswerText(q)}</strong></div>
                )}
              </div>
            );
          }
          return (
            <div key={i} style={{ padding: 14, marginBottom: 10, border: "1px solid #f3d999", borderRadius: 10, background: "#fff5e0" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#5f635f" }}>Q{i + 1}</span>
                <span className="chip chip-amber" style={{ fontSize: 10 }}>{q.type === "essay" ? "Essay" : "Short answer"}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{q.text || q.q}</div>
              <div style={{ marginTop: 10, padding: 10, background: "#fff", border: "1px solid #ececec", borderRadius: 6, whiteSpace: "pre-wrap", fontSize: 13 }}>
                {ans || <em style={{ color: "#a8232b" }}>(blank)</em>}
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, color: "#5f635f" }}>Your score (0–{q.points || 1}):</label>
                <input
                  type="number"
                  min="0"
                  max={q.points || 1}
                  step="0.5"
                  value={manualScores[i] ?? ""}
                  onChange={e => {
                    const v = e.target.value === "" ? undefined : Math.max(0, Math.min(q.points || 1, parseFloat(e.target.value) || 0));
                    setManualScores(prev => ({ ...prev, [i]: v }));
                  }}
                  style={{ width: 80, padding: "6px 10px", border: "1px solid #d8d9d8", borderRadius: 6, fontSize: 13 }}
                />
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 16 }}>
          <FieldLabel hint="Optional. Shown to the learner in their notification email.">Feedback notes</FieldLabel>
          <TextArea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything you'd like to share with the learner about their submission…"
          />
        </div>

        <div style={{ marginTop: 16, padding: 14, background: "#f8f7f2", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13 }}>
            <div className="text-xs text-muted">Final score</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{finalScore}%</div>
          </div>
          {a.passMark != null && (
            <div style={{ fontSize: 13, fontWeight: 700, color: passed ? "#2e5a12" : "#a8232b" }}>
              {passed ? `✓ Pass (≥${a.passMark}%)` : `✗ Fail (need ${a.passMark}%)`}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "flex-end", gap: 8, background: "#fafafa" }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
          <Icon name="check" size={14}/> {busy ? "Saving..." : (isRegrade ? "Update grade" : "Finalise grade & email learner")}
        </button>
      </div>
    </Modal>
  );
};

Object.assign(window, { AdminOverviewPage, AdminCoursesPage, AdminUsersPage, AdminAssessmentsPage, AdminActivityPage, AdminAttemptsPage, AdminSettingsPage });
