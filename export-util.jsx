// =========================================================
// GIM LMS — Export utility (CSV + Excel) + ExportButton
// =========================================================

const csvEscape = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const toCSV = (rows, columns) => {
  const header = columns.map(c => csvEscape(c.label)).join(",");
  const body = rows.map(r => columns.map(c => csvEscape(typeof c.get === "function" ? c.get(r) : r[c.key])).join(",")).join("\n");
  return header + "\n" + body;
};

// Build a minimal SpreadsheetML 2003 XML — Excel-openable, no library needed.
const toExcelXML = (rows, columns, sheetName = "Export") => {
  const xmlEscape = (v) => String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const cell = (v) => {
    if (typeof v === "number" && Number.isFinite(v))
      return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
    return `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`;
  };
  const headerRow = `<Row>${columns.map(c => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEscape(c.label)}</Data></Cell>`).join("")}</Row>`;
  const bodyRows = rows.map(r => `<Row>${columns.map(c => cell(typeof c.get === "function" ? c.get(r) : r[c.key])).join("")}</Row>`).join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles><Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#EFEFEF" ss:Pattern="Solid"/></Style></Styles>
 <Worksheet ss:Name="${xmlEscape(sheetName)}">
  <Table>${headerRow}${bodyRows}</Table>
 </Worksheet>
</Workbook>`;
};

const downloadBlob = (filename, content, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 250);
};

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

// Helper: per-user enrolment roll-up for export consistency
const _userEnrollmentStats = () => {
  const map = {};
  (window.ALL_ENROLLMENTS || []).forEach(e => {
    if (!e.userId) return;
    const s = map[e.userId] = map[e.userId] || { assigned: 0, completed: 0, overdue: 0 };
    s.assigned++;
    if (e.status === "completed") s.completed++;
    if (e.status !== "completed" && e.dueDays != null && e.dueDays <= 0) s.overdue++;
  });
  return map;
};

// ---------- Dataset definitions per page ----------
const EXPORT_DATASETS = {
  "admin-overview": () => {
    const stats = _userEnrollmentStats();
    const depts = (window.DEPARTMENT_DOCS && window.DEPARTMENT_DOCS.length > 0)
      ? window.DEPARTMENT_DOCS.map(d => d.name)
      : DEPARTMENTS;
    return {
      sheet: "Compliance by department",
      rows: depts.map(dept => {
        const people = ALL_USERS.filter(u => u.dept === dept);
        let assigned = 0, completed = 0, overdue = 0;
        people.forEach(u => {
          const s = stats[u.id] || {};
          assigned  += s.assigned  || 0;
          completed += s.completed || 0;
          overdue   += s.overdue   || 0;
        });
        const pct = assigned ? Math.round((completed / assigned) * 100) : 0;
        return { dept, headcount: people.length, assigned, completed, overdue, complianceRate: pct };
      }),
      columns: [
        { key: "dept",            label: "Department" },
        { key: "headcount",       label: "Headcount" },
        { key: "assigned",        label: "Assigned courses" },
        { key: "completed",       label: "Completed" },
        { key: "overdue",         label: "Overdue" },
        { key: "complianceRate",  label: "Compliance %" },
      ],
    };
  },

  "admin-courses": () => ({
    sheet: "Courses",
    rows: COURSES,
    columns: [
      { key: "id",         label: "Course ID" },
      { key: "title",      label: "Title" },
      { key: "cat",        label: "Category" },
      { key: "instructor", label: "Instructor" },
      { key: "lessons",    label: "Lessons" },
      { key: "duration",   label: "Duration (min)" },
      { label: "Required",   get: r => r.required ? "Yes" : "No" },
      { label: "Status",     get: r => r.status || "Published" },
      { label: "Enrolled",   get: r => (window.ENROLLMENT_COUNTS && window.ENROLLMENT_COUNTS[r.id]) || 0 },
    ],
  }),

  "admin-users": () => {
    const stats = _userEnrollmentStats();
    return {
      sheet: "People",
      rows: ALL_USERS.map(u => ({
        ...u,
        assigned:  stats[u.id]?.assigned  || 0,
        completed: stats[u.id]?.completed || 0,
        overdue:   stats[u.id]?.overdue   || 0,
      })),
      columns: [
        { key: "name",      label: "Name" },
        { key: "email",     label: "Email" },
        { key: "role",      label: "Role" },
        { key: "dept",      label: "Department" },
        { key: "status",    label: "Status" },
        { key: "assigned",  label: "Assigned" },
        { key: "completed", label: "Completed" },
        { key: "overdue",   label: "Overdue" },
      ],
    };
  },

  "admin-assess": () => {
    const courseTitle = (id) => COURSES.find(c => c.id === id)?.title || "—";
    return {
      sheet: "Assessments",
      rows: (window.ASSESSMENTS || []).filter(a => a.status !== "archived").map(a => ({
        title: a.title,
        type: a.type === "quiz" ? "Quiz" : a.type === "cert" ? "Certification" : "Final exam",
        course: courseTitle(a.courseId),
        questions: a.questions?.length || 0,
        passMark: a.passMark || 80,
        status: a.status || "published",
      })),
      columns: [
        { key: "title",     label: "Assessment" },
        { key: "course",    label: "Linked course" },
        { key: "type",      label: "Type" },
        { key: "questions", label: "Questions" },
        { key: "passMark",  label: "Pass mark %" },
        { key: "status",    label: "Status" },
      ],
    };
  },

  "team": () => ({
    sheet: "My team",
    rows: TEAM_MEMBERS,
    columns: [
      { key: "name",      label: "Name" },
      { key: "role",      label: "Role" },
      { key: "dept",      label: "Department" },
      { key: "assigned",  label: "Assigned" },
      { key: "completed", label: "Completed" },
      { label: "Overdue",     get: r => r.overdue || 0 },
      { key: "avgScore",  label: "Avg score %" },
      { key: "lastActive",label: "Last active" },
    ],
  }),

  "learning": () => ({
    sheet: "My learning",
    rows: COURSES.slice(0, 8),
    columns: [
      { key: "title",      label: "Course" },
      { key: "cat",        label: "Category" },
      { label: "Status",       get: r => r.required ? "Required" : "Optional" },
      { key: "duration",   label: "Duration (min)" },
      { key: "instructor", label: "Instructor" },
    ],
  }),

  "certs": () => ({
    sheet: "My certificates",
    rows: COURSES.filter(c => c.required).slice(0, 5).map((c, i) => ({
      course: c.title,
      issued: `2025-${String(6 + i).padStart(2, "0")}-15`,
      expires: `2026-${String(6 + i).padStart(2, "0")}-15`,
      verificationId: `GIM-${c.id.slice(0, 4).toUpperCase()}-${1000 + i}`,
      score: 85 + (i * 3) % 12,
    })),
    columns: [
      { key: "course",         label: "Course" },
      { key: "issued",         label: "Issued" },
      { key: "expires",        label: "Expires" },
      { key: "score",          label: "Score %" },
      { key: "verificationId", label: "Verification ID" },
    ],
  }),
};

// ---------- ExportButton ----------
const ExportButton = ({ page, label = "Export", filename, variant = "ghost", size = "sm" }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const doExport = (format) => {
    setOpen(false);
    const ds = (EXPORT_DATASETS[page] || (() => null))();
    if (!ds) { alert(`No data to export from this page.`); return; }
    const base = filename || `gim-${page}-${stamp()}`;
    if (format === "csv") {
      downloadBlob(`${base}.csv`, toCSV(ds.rows, ds.columns), "text/csv;charset=utf-8");
    } else {
      downloadBlob(`${base}.xls`, toExcelXML(ds.rows, ds.columns, ds.sheet), "application/vnd.ms-excel;charset=utf-8");
    }
  };

  const cls = `btn btn-${variant} btn-${size}`;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className={cls} onClick={() => setOpen(o => !o)}>
        <Icon name="download" size={14}/> {label}
        <Icon name="chevron-down" size={12} style={{ marginLeft: 4 }}/>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 60,
          background: "#fff", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,.18)",
          border: "1px solid #ececec", overflow: "hidden", minWidth: 220,
        }}>
          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#5f635f", textTransform: "uppercase", letterSpacing: ".05em", background: "#fafafa", borderBottom: "1px solid #ececec" }}>
            Download as
          </div>
          {[
            { id: "xlsx", label: "Excel (.xls)", desc: "Spreadsheet — opens in Excel/Sheets" },
            { id: "csv",  label: "CSV (.csv)",   desc: "Plain text, comma-separated" },
          ].map(o => (
            <button key={o.id} onClick={() => doExport(o.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer",
              borderBottom: "1px solid #f5f5f5",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{o.label}</div>
              <div style={{ fontSize: 11, color: "#5f635f" }}>{o.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Toast (fire-and-forget, top-level container) ----------
let _toastSetter = null;
const showToast = (msg) => { if (_toastSetter) _toastSetter(msg); };

const ToastHost = () => {
  const [msg, setMsg] = React.useState("");
  React.useEffect(() => { _toastSetter = setMsg; return () => { _toastSetter = null; }; }, []);
  React.useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(""), 2800); return () => clearTimeout(t); }, [msg]);
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 8 }}>
      <Icon name="checkb" size={14} color="#7ac142"/>
      {msg}
    </div>
  );
};

// ---------- Course Enrollments modal ----------
const EnrollmentsModal = ({ open, onClose, course }) => {
  if (!open || !course) return null;

  const courseEnrollments = (window.ALL_ENROLLMENTS || []).filter(e => e.courseId === course.id);
  const usersById = Object.fromEntries((window.ALL_USERS || []).map(u => [u.id, u]));
  const rows = courseEnrollments.map(e => ({
    e,
    u: usersById[e.userId] || { id: e.userId, name: e.userId, email: "", dept: "" },
  }));

  const exportCsv = () => {
    const csvRows = rows.map(({ u, e }) => ({
      name: u.name,
      email: u.email || "",
      dept: u.dept || "",
      status: e.status || "",
      progress: e.progress || 0,
    }));
    const cols = [
      { key: "name",     label: "Name" },
      { key: "email",    label: "Email" },
      { key: "dept",     label: "Department" },
      { key: "status",   label: "Status" },
      { key: "progress", label: "Progress %" },
    ];
    downloadBlob(`${course.id}-enrollments-${stamp()}.csv`, toCSV(csvRows, cols), "text/csv;charset=utf-8");
  };

  return (
    <Modal open={open} onClose={onClose} width={720}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow-sm">Course enrollments</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{course.title}</div>
          <div style={{ fontSize: 12, color: "#5f635f", marginTop: 2 }}>
            {rows.length} {rows.length === 1 ? "learner" : "learners"} enrolled
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
          <div className="empty" style={{ padding: 32 }}>
            No one is enrolled in this course yet. Use "Assign to learners" from the row menu to add some.
          </div>
        ) : (
          <table className="tbl" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Department</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ u, e }) => {
                const progress = e.progress || 0;
                const status = e.status || "assigned";
                return (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Avatar name={u.name} size={28}/>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "#5f635f" }}>{u.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.dept ? <span className="chip chip-grey">{u.dept}</span> : <span className="text-muted text-xs">—</span>}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="bar bar-thin" style={{ width: 80 }}>
                          <div style={{ width: `${progress}%`, background: progress >= 95 ? "#7ac142" : "#f5a524" }}/>
                        </div>
                        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{progress}%</span>
                      </div>
                    </td>
                    <td>
                      {status === "completed" && <span className="chip chip-green">Completed</span>}
                      {status === "in_progress" && <span className="chip chip-amber">In progress</span>}
                      {status === "assigned" && <span className="chip chip-grey">Assigned</span>}
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

Object.assign(window, { ExportButton, ToastHost, showToast, EnrollmentsModal, downloadBlob, toCSV, toExcelXML });
