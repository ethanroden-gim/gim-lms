// =========================================================
// GIM LMS — My Team page (manager view)
// =========================================================

const MyTeamPage = () => {
  const [tab, setTab] = React.useState("overview");
  const [assignFor, setAssignFor] = React.useState(null); // userName | "all" | null
  const [toast, setToast] = React.useState("");
  const [reminderOpen, setReminderOpen] = React.useState(false);
  const team = TEAM_MEMBERS;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const sendReminderTeamWide = (overdueOnly) => {
    const recipients = overdueOnly ? team.filter(m => (m.overdue || 0) > 0) : team;
    setReminderOpen(false);
    showToast(`Email reminder sent to ${recipients.length} ${recipients.length === 1 ? "report" : "reports"}.`);
  };

  const totalAssigned = team.reduce((s, m) => s + m.assigned, 0);
  const totalCompleted = team.reduce((s, m) => s + m.completed, 0);
  const totalOverdue = team.reduce((s, m) => s + (m.overdue || 0), 0);
  const avgScore = Math.round(team.reduce((s, m) => s + m.avgScore, 0) / team.length);

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Manager view</div>
          <h1 className="page-head__title">My team</h1>
          <div className="page-head__sub">{team.length} direct reports · {CURRENT_USER.department}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setReminderOpen(true)}><Icon name="send" size={14}/> Send reminder</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAssignFor("all")}><Icon name="plus" size={14}/> Assign training</button>
        </div>
      </div>

      <div className="dash-grid mb-6">
        <div className="stat">
          <div className="stat__label">Direct reports</div>
          <div className="stat__value">{team.length}</div>
          <div className="stat__sub">{team.filter(m => m.lastActive !== "On leave").length} active</div>
        </div>
        <div className="stat">
          <div className="stat__label">Compliance rate</div>
          <div className="stat__value" style={{ color: totalOverdue === 0 ? "#2e5a12" : "#a8232b" }}>
            {Math.round(((totalAssigned - totalOverdue) / Math.max(1, totalAssigned)) * 100)}%
          </div>
          <div className="stat__sub">{totalOverdue} overdue across team</div>
        </div>
        <div className="stat">
          <div className="stat__label">Completed YTD</div>
          <div className="stat__value">{totalCompleted}</div>
          <div className="stat__sub">across all reports</div>
        </div>
        <div className="stat">
          <div className="stat__label">Team avg. score</div>
          <div className="stat__value">{avgScore}<span style={{ fontSize: 18, color: "#5f635f" }}>%</span></div>
          <div className="stat__sub">on graded assessments</div>
        </div>
      </div>

      <div className="tabs">
        <button className={classNames("tab", tab === "overview" && "active")} onClick={() => setTab("overview")}>Team overview</button>
        <button className={classNames("tab", tab === "courses" && "active")} onClick={() => setTab("courses")}>By course</button>
      </div>

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {team.map(m => {
            const overall = Math.round((m.completed / Math.max(1, m.completed + m.assigned)) * 100);
            return (
              <div key={m.name} className="card card-pad">
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <Avatar name={m.name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "#5f635f" }}>{m.role} · {m.dept}</div>
                      </div>
                      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                        <div style={{ textAlign: "right", minWidth: 70 }}>
                          <div className="text-xs text-muted">Assigned</div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{m.assigned}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 70 }}>
                          <div className="text-xs text-muted">Completed</div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{m.completed}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 80 }}>
                          <div className="text-xs text-muted">Overdue</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: m.overdue ? "#a8232b" : "#5f635f" }}>{m.overdue || 0}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 70 }}>
                          <div className="text-xs text-muted">Avg score</div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{m.avgScore}%</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => { showToast(`Nudge sent to ${m.name} via email.`); }}>Nudge</button>
                        <button className="btn-icon" title="Assign training" onClick={() => setAssignFor(m.name)}><Icon name="plus" size={14}/></button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span className="text-xs text-muted">Overall progress · last active {m.lastActive}</span>
                          <span className="text-xs fw-600">{overall}%</span>
                        </div>
                        <div className="bar bar-thin"><div style={{ width: `${overall}%` }} /></div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 12 }}>
                      {m.courses.map((c, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", background: "#fafafa", border: "1px solid #ececec", borderRadius: 8,
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                            background: c.status === "completed" ? "#f0f9e6" : c.overdue ? "#fdecec" : "#f5f5f5",
                            color: c.status === "completed" ? "#2e5a12" : c.overdue ? "#a8232b" : "#5f635f",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon name={c.status === "completed" ? "checkb" : c.overdue ? "flag" : "book"} size={13} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                            <div style={{ fontSize: 11, color: c.overdue ? "#a8232b" : "#5f635f" }}>
                              {c.status === "completed" ? "Completed" : `${c.progress}% · ${c.due || "no due date"}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "courses" && (
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: "32%" }}>Required course</th>
              <th>Assigned</th>
              <th>In progress</th>
              <th>Completed</th>
              <th>Overdue</th>
              <th>Team progress</th>
            </tr>
          </thead>
          <tbody>
            {[
              { title: "MA Fair Housing Law",        cat: "Compliance" },
              { title: "Emergency Response Playbook",cat: "Maintenance" },
              { title: "Resident Communication",    cat: "Customer Service" },
              { title: "GIM New Hire Orientation",  cat: "New Hire" },
              { title: "Working With Condo & HOA Boards", cat: "Property Management" },
            ].map((row, i) => {
              const assigned = team.length;
              const completed = 1 + (i % 3);
              const inProg = 1 + ((i + 1) % 3);
              const overdue = i === 1 ? 1 : 0;
              const pct = Math.round((completed / assigned) * 100);
              return (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{row.title}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{row.cat}</div>
                  </td>
                  <td>{assigned}</td>
                  <td>{inProg}</td>
                  <td>{completed}</td>
                  <td><span style={{ color: overdue ? "#a8232b" : "#5f635f", fontWeight: overdue ? 600 : 400 }}>{overdue}</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="bar bar-thin" style={{ width: 80 }}>
                        <div style={{ width: `${pct}%`, background: pct >= 75 ? "#7ac142" : "#f5a524" }}/>
                      </div>
                      <span className="text-xs fw-600" style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <AssignTrainingModal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        preset={assignFor && assignFor !== "all" ? { userName: assignFor } : null}
      />

      {reminderOpen && (
        <div onClick={() => setReminderOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,16,17,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Send reminder</div>
            <div style={{ fontSize: 13, color: "#5f635f", marginBottom: 18 }}>
              Email a reminder of incomplete training to your team.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              <button onClick={() => sendReminderTeamWide(true)} style={{ textAlign: "left", padding: "12px 14px", border: "1px solid #ececec", borderRadius: 10, background: "#fff", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Overdue only</div>
                <div style={{ fontSize: 12, color: "#5f635f" }}>{team.filter(m => (m.overdue || 0) > 0).length} {team.filter(m => (m.overdue || 0) > 0).length === 1 ? "report has" : "reports have"} overdue training.</div>
              </button>
              <button onClick={() => sendReminderTeamWide(false)} style={{ textAlign: "left", padding: "12px 14px", border: "1px solid #ececec", borderRadius: 10, background: "#fff", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Everyone with incomplete training</div>
                <div style={{ fontSize: 12, color: "#5f635f" }}>{team.length} reports.</div>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setReminderOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="checkb" size={14} color="#7ac142"/>
          {toast}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { MyTeamPage });
