// =========================================================
// GIM LMS — My Team page (manager view)
// =========================================================

const MyTeamPage = () => {
  const [tab, setTab] = React.useState("overview");
  const [assignFor, setAssignFor] = React.useState(null); // userId | "all" | null
  const [reminderOpen, setReminderOpen] = React.useState(false);

  // "Direct reports" = anyone in the same dept as the current user (and not the user themselves).
  // For a real org this would use a managerId field; for testing this is a sensible default.
  const myDept = CURRENT_USER.dept || "";
  const team = ALL_USERS.filter(u => u.id !== CURRENT_USER.uid && (myDept ? u.dept === myDept : true) && u.status !== "inactive");

  // Per-user roll-ups computed from live enrollments
  const enrollmentsByUser = React.useMemo(() => {
    const map = {};
    (window.ALL_ENROLLMENTS || []).forEach(e => {
      if (!e.userId) return;
      (map[e.userId] = map[e.userId] || []).push(e);
    });
    return map;
  }, [ALL_ENROLLMENTS.length, ALL_ENROLLMENTS]);

  const memberStats = (uid) => {
    const list = enrollmentsByUser[uid] || [];
    const completed = list.filter(e => e.status === "completed").length;
    const inProgress = list.filter(e => e.status === "in_progress").length;
    const assigned = list.filter(e => e.status === "assigned").length;
    const overdue = list.filter(e => e.required && e.status !== "completed" && (e.dueDays != null) && e.dueDays <= 0).length;
    const scored = list.filter(e => typeof e.score === "number");
    const avgScore = scored.length ? Math.round(scored.reduce((s, e) => s + e.score, 0) / scored.length) : null;
    return { completed, inProgress, assigned: assigned + inProgress, overdue, avgScore, all: list };
  };

  const sendReminderTeamWide = async ({ overdueOnly, subject, message }) => {
    const targets = overdueOnly
      ? team.filter(m => memberStats(m.id).overdue > 0)
      : team;
    setReminderOpen(false);
    if (targets.length === 0) { showToast?.("No matching recipients."); return; }
    const recipients = targets.filter(m => m.email).map(m => ({ email: m.email, name: m.name }));
    if (recipients.length === 0) { showToast?.("No email addresses on file."); return; }
    try {
      const res = await sendEmailReminder({
        recipients,
        subject: subject || "Training reminder",
        message: message || (overdueOnly
          ? "This is a reminder that you have overdue training in GIM Learning. Please complete it as soon as possible."
          : "This is a reminder to complete your outstanding training in GIM Learning."),
      });
      showToast?.(`Reminder sent to ${res.sent} ${res.sent === 1 ? "report" : "reports"}.`);
    } catch (err) {
      alert("Reminder failed: " + err.message);
    }
  };

  const nudgeMember = async (m) => {
    if (!m.email) { showToast?.(`No email on file for ${m.name}`); return; }
    try {
      const res = await sendEmailReminder({
        recipients: [{ email: m.email, name: m.name }],
        message: "Just a friendly nudge to keep your training moving along in GIM Learning.",
      });
      showToast?.(res.sent ? `Nudge sent to ${m.name}` : `Failed: ${res.errors?.[0]?.error || "unknown error"}`);
    } catch (err) { alert("Nudge failed: " + err.message); }
  };

  const totalAssigned = team.reduce((s, m) => s + memberStats(m.id).assigned, 0);
  const totalCompleted = team.reduce((s, m) => s + memberStats(m.id).completed, 0);
  const totalOverdue = team.reduce((s, m) => s + memberStats(m.id).overdue, 0);
  const scoredMembers = team.map(m => memberStats(m.id).avgScore).filter(s => s !== null);
  const avgScore = scoredMembers.length ? Math.round(scoredMembers.reduce((s, n) => s + n, 0) / scoredMembers.length) : null;

  return (
    <div className="page page--wide">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Manager view</div>
          <h1 className="page-head__title">My team</h1>
          <div className="page-head__sub">{team.length} {team.length === 1 ? "report" : "reports"}{myDept ? ` · ${myDept}` : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setReminderOpen(true)} disabled={team.length === 0}><Icon name="send" size={14}/> Send reminder</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAssignFor("all")} disabled={team.length === 0}><Icon name="plus" size={14}/> Assign training</button>
        </div>
      </div>

      <div className="dash-grid mb-6">
        <div className="stat">
          <div className="stat__label">Direct reports</div>
          <div className="stat__value">{team.length}</div>
          <div className="stat__sub">{team.filter(m => m.status === "active").length} active</div>
        </div>
        <div className="stat">
          <div className="stat__label">Compliance rate</div>
          <div className="stat__value" style={{ color: totalAssigned === 0 ? "#5f635f" : (totalOverdue === 0 ? "#2e5a12" : "#a8232b") }}>
            {totalAssigned === 0 ? "—" : `${Math.round(((totalAssigned - totalOverdue) / Math.max(1, totalAssigned)) * 100)}%`}
          </div>
          <div className="stat__sub">{totalOverdue ? `${totalOverdue} overdue across team` : "no overdue work"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Completed YTD</div>
          <div className="stat__value">{totalCompleted}</div>
          <div className="stat__sub">across all reports</div>
        </div>
        <div className="stat">
          <div className="stat__label">Team avg. score</div>
          <div className="stat__value">{avgScore !== null ? <>{avgScore}<span style={{ fontSize: 18, color: "#5f635f" }}>%</span></> : "—"}</div>
          <div className="stat__sub">{scoredMembers.length ? "on graded assessments" : "no graded data"}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={classNames("tab", tab === "overview" && "active")} onClick={() => setTab("overview")}>Team overview</button>
        <button className={classNames("tab", tab === "courses" && "active")} onClick={() => setTab("courses")}>By course</button>
      </div>

      {tab === "overview" && (
        team.length === 0 ? (
          <div className="empty">
            {myDept
              ? `No one else is in the ${myDept} department yet.`
              : "Set your department in Admin → People to see direct reports here."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {team.map(m => {
              const s = memberStats(m.id);
              const total = s.completed + s.assigned;
              const overall = total ? Math.round((s.completed / total) * 100) : 0;
              return (
                <div key={m.id} className="card card-pad">
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <Avatar name={m.name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: "#5f635f" }}>{m.role || "Learner"} · {m.dept || "Unassigned"}</div>
                        </div>
                        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                          <div style={{ textAlign: "right", minWidth: 70 }}>
                            <div className="text-xs text-muted">Assigned</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.assigned}</div>
                          </div>
                          <div style={{ textAlign: "right", minWidth: 70 }}>
                            <div className="text-xs text-muted">Completed</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.completed}</div>
                          </div>
                          <div style={{ textAlign: "right", minWidth: 80 }}>
                            <div className="text-xs text-muted">Overdue</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: s.overdue ? "#a8232b" : "#5f635f" }}>{s.overdue}</div>
                          </div>
                          <div style={{ textAlign: "right", minWidth: 70 }}>
                            <div className="text-xs text-muted">Avg score</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.avgScore !== null ? `${s.avgScore}%` : "—"}</div>
                          </div>
                          <button className="btn btn-ghost btn-sm" onClick={() => nudgeMember(m)}>Nudge</button>
                          <button className="btn-icon" title="Assign training" onClick={() => setAssignFor(m.id)}><Icon name="plus" size={14}/></button>
                        </div>
                      </div>

                      {total > 0 && (
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span className="text-xs text-muted">Overall progress</span>
                              <span className="text-xs fw-600">{overall}%</span>
                            </div>
                            <div className="bar bar-thin"><div style={{ width: `${overall}%` }} /></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "courses" && (() => {
        // For each course, count team members in each status
        const teamIds = new Set(team.map(m => m.id));
        const courseRows = COURSES.filter(c => c.status !== "archived").map(c => {
          const enrolledHere = (window.ALL_ENROLLMENTS || []).filter(e => e.courseId === c.id && teamIds.has(e.userId));
          const assigned = enrolledHere.length;
          const completed = enrolledHere.filter(e => e.status === "completed").length;
          const inProg = enrolledHere.filter(e => e.status === "in_progress").length;
          const overdue = enrolledHere.filter(e => e.required && e.status !== "completed" && (e.dueDays != null) && e.dueDays <= 0).length;
          const pct = assigned ? Math.round((completed / assigned) * 100) : 0;
          return { c, assigned, completed, inProg, overdue, pct };
        }).filter(r => r.assigned > 0);

        if (courseRows.length === 0) {
          return <div className="empty">Nothing assigned to your team yet.</div>;
        }
        return (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "32%" }}>Course</th>
                <th>Assigned</th>
                <th>In progress</th>
                <th>Completed</th>
                <th>Overdue</th>
                <th>Team progress</th>
              </tr>
            </thead>
            <tbody>
              {courseRows.map(({ c, assigned, completed, inProg, overdue, pct }) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{c.cat}</div>
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
              ))}
            </tbody>
          </table>
        );
      })()}

      <AssignTrainingModal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        preset={assignFor && assignFor !== "all" ? { userId: assignFor } : null}
      />

      {reminderOpen && <ReminderComposer
        team={team}
        memberStats={memberStats}
        onClose={() => setReminderOpen(false)}
        onSend={sendReminderTeamWide}
      />}

    </div>
  );
};

// ============================================================
// Reminder composer — custom subject + body, scope toggle
// ============================================================
const ReminderComposer = ({ team, memberStats, onClose, onSend }) => {
  const [scope, setScope] = React.useState("overdue");
  const [subject, setSubject] = React.useState("Training reminder");
  const [body, setBody] = React.useState("This is a reminder to complete your outstanding training in GIM Learning.");
  const [busy, setBusy] = React.useState(false);

  const overdueCount = team.filter(m => memberStats(m.id).overdue > 0).length;
  const incompleteCount = team.filter(m => memberStats(m.id).assigned > 0).length;
  const recipientCount = scope === "overdue" ? overdueCount : incompleteCount;

  const handleSend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSend({ overdueOnly: scope === "overdue", subject: subject.trim(), message: body.trim() });
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,16,17,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 540, boxShadow: "0 24px 60px rgba(0,0,0,.3)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid #ececec" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Send reminder</div>
          <div style={{ fontSize: 12, color: "#5f635f", marginTop: 4 }}>Email a reminder of incomplete training to your team.</div>
        </div>

        <div style={{ padding: 20, overflowY: "auto" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5f635f", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Recipients</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: scope === "overdue" ? "2px solid #7ac142" : "1px solid #ececec", borderRadius: 8, cursor: "pointer", background: scope === "overdue" ? "#f0f9e6" : "#fff" }}>
                <input type="radio" name="scope" checked={scope === "overdue"} onChange={() => setScope("overdue")} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Overdue only</div>
                  <div style={{ fontSize: 12, color: "#5f635f" }}>{overdueCount} {overdueCount === 1 ? "report has" : "reports have"} overdue training.</div>
                </div>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: scope === "all" ? "2px solid #7ac142" : "1px solid #ececec", borderRadius: 8, cursor: "pointer", background: scope === "all" ? "#f0f9e6" : "#fff" }}>
                <input type="radio" name="scope" checked={scope === "all"} onChange={() => setScope("all")} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Everyone with incomplete training</div>
                  <div style={{ fontSize: 12, color: "#5f635f" }}>{incompleteCount} {incompleteCount === 1 ? "report" : "reports"}.</div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5f635f", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Subject</div>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d8d9d8", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
              placeholder="Email subject…" />
          </div>

          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5f635f", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Message</div>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              rows={6}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d8d9d8", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
              placeholder="Body of the email — recipients will see it as the message body…" />
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
          <span style={{ fontSize: 12, color: "#5f635f" }}>
            Will email <strong>{recipientCount}</strong> {recipientCount === 1 ? "person" : "people"}.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={busy || recipientCount === 0 || !subject.trim() || !body.trim()}>
              <Icon name="send" size={13}/> {busy ? "Sending…" : "Send reminder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { MyTeamPage });
