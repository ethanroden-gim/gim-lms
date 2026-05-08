// =========================================================
// GIM LMS — Admin pages (lightweight)
// =========================================================

// ============================================================
// Admin overview
// ============================================================
const AdminOverviewPage = () => {
  const [assignOpen, setAssignOpen] = React.useState(false);

  const activeLearners = ALL_USERS.filter(u => u.status === "active").length;
  const totalAssigned   = ALL_USERS.reduce((s, u) => s + (u.assigned  || 0), 0);
  const totalCompleted  = ALL_USERS.reduce((s, u) => s + (u.completed || 0), 0);
  const totalOverdue    = ALL_USERS.reduce((s, u) => s + (u.due       || 0), 0);
  const learnersOverdue = ALL_USERS.filter(u => (u.due || 0) > 0).length;
  const complianceRate  = totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : null;

  const deptCompliance = DEPARTMENTS.map(dept => {
    const people = ALL_USERS.filter(u => u.dept === dept);
    const a = people.reduce((s, u) => s + (u.assigned  || 0), 0);
    const c = people.reduce((s, u) => s + (u.completed || 0), 0);
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
          <button className="btn btn-ghost btn-sm"><Icon name="download" size={14}/> Export report</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAssignOpen(true)}><Icon name="plus" size={14}/> Assign training</button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="stat">
          <div className="stat__label">Active learners</div>
          <div className="stat__value">{activeLearners}</div>
          <div className="stat__sub">across {DEPARTMENTS.length} departments</div>
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
          <div className="stat__value" style={{ color: totalOverdue ? "#a8232b" : "#5f635f" }}>{totalOverdue}</div>
          <div className="stat__sub">{learnersOverdue ? `across ${learnersOverdue} learner${learnersOverdue === 1 ? "" : "s"}` : "no overdue work"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Courses published</div>
          <div className="stat__value">{COURSES.length}</div>
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
            <h3>Top courses by enrolment</h3>
          </div>
          <div className="card card-pad">
            {(() => {
              const ranked = COURSES
                .filter(c => c.status !== "archived")
                .map(c => ({ c, n: ENROLLMENT_COUNTS[c.id] || 0 }))
                .filter(r => r.n > 0)
                .sort((a, b) => b.n - a.n)
                .slice(0, 4);
              if (ranked.length === 0) {
                return <div style={{ padding: "12px 4px", textAlign: "center", color: "#5f635f", fontSize: 13 }}>
                  {COURSES.length ? "No enrolments yet." : "Add courses to see enrolment activity."}
                </div>;
              }
              return ranked.map((r, i) => (
                <div key={r.c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < ranked.length - 1 ? "1px solid #f3f3f3" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.c.title}</div>
                  <div style={{ fontSize: 13, color: "#5f635f", fontVariantNumeric: "tabular-nums" }}>
                    {r.n} {r.n === 1 ? "enrolment" : "enrolments"}
                  </div>
                </div>
              ));
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
const AdminCoursesPage = ({ onNew, onEdit, onPreview }) => {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [assignFor, setAssignFor] = React.useState(null); // courseId or null
  const [enrollmentsFor, setEnrollmentsFor] = React.useState(null); // course or null
  const openAssign = (id) => setAssignFor(id);
  const cats = ["All", ...CATEGORIES];
  const filtered = COURSES.filter(c => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "All" && c.cat !== cat) return false;
    if (statusFilter !== "All" && (c.status || "published").toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Courses</div>
          <h1 className="page-head__title">Course management</h1>
          <div className="page-head__sub">Add courses, manage lessons, publish to catalog.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="download" size={14}/> Export</button>
          <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={14}/> New course</button>
        </div>
      </div>

      <div className="filterbar">
        <input type="search" placeholder="Search by title, instructor…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>All</option><option>Published</option><option>Draft</option><option>Archived</option>
        </select>
        <div className="fb-spacer" />
        <span className="text-xs text-muted">{filtered.length} courses</span>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: "30%" }}>Course</th>
            <th>Category</th>
            <th>Instructor</th>
            <th>Lessons</th>
            <th>Enrolled</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id}>
              <td>
                <div style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => onEdit(c.id)}>
                  <div className={classNames(c.cover)} style={{ width: 48, height: 32, borderRadius: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "#5f635f", display: "flex", gap: 8, alignItems: "center" }}>
                      <span>{c.duration} min</span>
                      {c.required && <span className="chip chip-required" style={{ fontSize: 10, padding: "1px 6px" }}>Required</span>}
                    </div>
                  </div>
                </div>
              </td>
              <td><span className="chip chip-grey">{c.cat}</span></td>
              <td>{c.instructor}</td>
              <td>{c.lessons}</td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>
                {ENROLLMENT_COUNTS[c.id] || 0}
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
  const [assignFor, setAssignFor] = React.useState(null); // userName, "all" for top-bar, or null
  const openAssign = (name) => setAssignFor(name);
  const filtered = ALL_USERS.filter(u => {
    if (q && !u.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (dept !== "All" && u.dept !== dept) return false;
    if (role !== "All" && u.role !== role) return false;
    return true;
  });

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · People</div>
          <h1 className="page-head__title">People & enrollments</h1>
          <div className="page-head__sub">Users sync from Google Workspace. Set roles & departments here.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="download" size={14}/> Export CSV</button>
          <button className="btn btn-primary" onClick={() => setAssignFor("all")}><Icon name="plus" size={14}/> Assign training</button>
        </div>
      </div>

      <div className="filterbar">
        <input type="search" placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={dept} onChange={e => setDept(e.target.value)}>
          <option>All</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option>All</option><option>Learner</option><option>Manager</option><option>Admin</option>
        </select>
        <select><option>All statuses</option><option>Active</option><option>Onboarding</option><option>On leave</option></select>
        <div className="fb-spacer" />
        <span className="text-xs text-muted">{filtered.length} of {ALL_USERS.length}</span>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: "28%" }}>Person</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Completed</th>
            <th>Due / Overdue</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => {
            const deptOptions = (DEPARTMENT_DOCS.length > 0 ? DEPARTMENT_DOCS.map(d => d.name) : DEPARTMENTS);
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
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar name={u.name} size={32} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{u.email || "—"}</div>
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
              <td style={{ fontVariantNumeric: "tabular-nums" }}>{u.assigned || 0}</td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>{u.completed || 0}</td>
              <td>
                {(u.due || 0) > 0 ? (
                  <span style={{ color: "#a8232b", fontWeight: 600, fontSize: 12 }}>{u.due} overdue</span>
                ) : (
                  <span style={{ color: "#5f635f", fontSize: 12 }}>None</span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button className="btn-icon" title="Assign training" onClick={() => openAssign(u.id)}><Icon name="plus" size={14}/></button>
                  <RowMenu items={[
                    { label: "Assign training", icon: "plus",     onClick: () => openAssign(u.id) },
                    { label: "Send reminder",   icon: "send",     onClick: () => showToast?.(`Reminder queued for ${u.name}`) },
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
          <div style={{ fontSize: 13, fontWeight: 600 }}>People sync from Google Workspace</div>
          <div style={{ fontSize: 12, color: "#5f635f" }}>Names, emails, and Google Group memberships sync hourly. Roles and departments are managed here.</div>
        </div>
        <button className="btn btn-ghost btn-sm">Sync now</button>
      </div>
      <AssignTrainingModal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        preset={assignFor && assignFor !== "all" ? { userId: assignFor } : null}
      />
    </div>
  );
};

// ============================================================
// Admin: Assessments
// ============================================================
const AdminAssessmentsPage = () => {
  const [newOpen, setNewOpen] = React.useState(false);
  const visible = ASSESSMENTS.filter(a => a.status !== "archived");
  const totalAssessments = visible.length;

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Admin · Assessments</div>
          <h1 className="page-head__title">Assessments & quizzes</h1>
          <div className="page-head__sub">Manage questions, pass thresholds, and review attempt analytics.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setNewOpen(true)}><Icon name="plus" size={14}/> New assessment</button>
        </div>
      </div>
      <NewAssessmentModal open={newOpen} onClose={() => setNewOpen(false)} />

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
              <th style={{ width: "32%" }}>Assessment</th>
              <th>Linked course</th>
              <th>Type</th>
              <th>Questions</th>
              <th>Pass mark</th>
              <th>Status</th>
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
                  <td><span className="chip chip-grey">{a.type === "quiz" ? "Quiz" : a.type === "cert" ? "Certification" : "Final exam"}</span></td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{a.questions?.length || 0}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{a.passMark || 80}%</td>
                  <td>
                    {a.status === "draft" ? <span className="chip chip-amber">Draft</span> :
                     a.status === "archived" ? <span className="chip chip-grey">Archived</span> :
                                               <span className="chip chip-green">Published</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <RowMenu items={[
                        { label: a.status === "draft" ? "Publish" : "Unpublish", icon: a.status === "draft" ? "check" : "eye-off",
                          onClick: async () => {
                            const next = a.status === "draft" ? "published" : "draft";
                            try { await saveAssessment({ id: a.id, status: next }); showToast?.(`${a.title} ${next === "published" ? "published" : "unpublished"}`); }
                            catch (err) { alert("Failed: " + err.message); }
                          } },
                        "divider",
                        { label: "Archive", icon: "trash", danger: true, onClick: async () => {
                            if (!confirm(`Archive "${a.title}"?`)) return;
                            try { await archiveAssessment(a.id); showToast?.(`${a.title} archived`); }
                            catch (err) { alert("Archive failed: " + err.message); }
                          } },
                        { label: "Delete permanently", icon: "trash", danger: true, onClick: async () => {
                            if (!confirm(`Permanently delete "${a.title}"? This cannot be undone.`)) return;
                            try { await deleteAssessment(a.id); showToast?.(`"${a.title}" deleted`); }
                            catch (err) { alert("Delete failed: " + err.message); }
                          } },
                      ]}/>
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
              {DEPARTMENT_DOCS.map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #ececec", borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0f9e6", color: "#2e5a12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="house" size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{ALL_USERS.filter(u => u.dept === d.name).length} people</div>
                  </div>
                  <button className="btn-icon" title="Edit department" onClick={() => setDeptModal({ open: true, initial: d })}><Icon name="edit" size={14}/></button>
                </div>
              ))}
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
            {ROLE_DOCS.map(r => {
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

Object.assign(window, { AdminOverviewPage, AdminCoursesPage, AdminUsersPage, AdminAssessmentsPage, AdminSettingsPage });
