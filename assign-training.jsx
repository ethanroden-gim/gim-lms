// =========================================================
// GIM LMS — Assign Training Modal + Row Action Menu
// =========================================================

// ---------- Modal shell ----------
const Modal = ({ open, onClose, children, width = 720 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,16,17,0.5)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh",
        overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,.3)",
      }}>
        {children}
      </div>
    </div>
  );
};

// ---------- Assign Training modal ----------
// preset can be: { courseId } to lock the course / { userId } to lock a person / null
const AssignTrainingModal = ({ open, onClose, preset }) => {
  const [step, setStep] = React.useState(1);
  const [courseIds, setCourseIds] = React.useState(() => preset?.courseId ? [preset.courseId] : []);
  const [audience, setAudience] = React.useState(() => preset?.userId ? "people" : "department");
  const [depts, setDepts] = React.useState([]);
  const [people, setPeople] = React.useState(() => preset?.userId ? [preset.userId] : []);
  const [dueOption, setDueOption] = React.useState("30");
  const [dueDate, setDueDate] = React.useState("");
  const [required, setRequired] = React.useState(true);
  const [notify, setNotify] = React.useState(true);
  const [reminderCadence, setReminderCadence] = React.useState("weekly");
  const [courseQuery, setCourseQuery] = React.useState("");
  const [peopleQuery, setPeopleQuery] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Reset on open
  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setCourseIds(preset?.courseId ? [preset.courseId] : []);
    setAudience(preset?.userId ? "people" : "department");
    setDepts([]);
    setPeople(preset?.userId ? [preset.userId] : []);
    setDueOption("30");
    setDueDate("");
    setRequired(true);
    setNotify(true);
    setReminderCadence("weekly");
    setCourseQuery(""); setPeopleQuery("");
    setSubmitting(false);
  }, [open, preset]);

  const toggleCourse = (id) => setCourseIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleDept   = (d)  => setDepts(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const togglePerson = (id) => setPeople(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filteredCourses = COURSES
    .filter(c => (c.status !== "archived") && (!courseQuery || c.title.toLowerCase().includes(courseQuery.toLowerCase())))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  const filteredPeople  = ALL_USERS
    .filter(u => !peopleQuery || u.name.toLowerCase().includes(peopleQuery.toLowerCase()))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const deptOptions = (DEPARTMENT_DOCS.length > 0 ? DEPARTMENT_DOCS.map(d => d.name) : DEPARTMENTS)
    .sort((a, b) => (a || "").localeCompare(b || ""));

  // Resolve audience to actual user IDs
  const targetUserIds = React.useMemo(() => {
    if (audience === "all")            return ALL_USERS.filter(u => u.status !== "leave" && u.status !== "inactive").map(u => u.id);
    if (audience === "department")     return ALL_USERS.filter(u => depts.includes(u.dept) && u.status !== "leave" && u.status !== "inactive").map(u => u.id);
    if (audience === "role-onboarding")return ALL_USERS.filter(u => u.status === "onboarding").map(u => u.id);
    if (audience === "people")         return people;
    return [];
  }, [audience, depts, people]);

  const affected = targetUserIds.length;
  const totalEnrollments = affected * courseIds.length;

  const dueDays = (() => {
    if (dueOption === "none") return null;
    if (dueOption === "custom") {
      if (!dueDate) return null;
      const ms = new Date(dueDate).getTime() - Date.now();
      return Math.max(0, Math.round(ms / 86400000));
    }
    return parseInt(dueOption, 10);
  })();

  const dueLabel = () => {
    if (dueOption === "none") return "No due date";
    if (dueOption === "custom") return dueDate || "Pick a date";
    return `In ${dueOption} days`;
  };

  const canProceed = () => {
    if (step === 1) return courseIds.length > 0;
    if (step === 2) {
      if (audience === "all" || audience === "role-onboarding") return targetUserIds.length > 0;
      if (audience === "department") return depts.length > 0 && targetUserIds.length > 0;
      if (audience === "people") return people.length > 0;
    }
    return true;
  };

  const submit = async () => {
    if (submitting) return;
    if (!window.fbReady) { alert("Firebase isn't configured — can't assign."); return; }
    if (targetUserIds.length === 0) { alert("No learners selected."); return; }
    setSubmitting(true);
    try {
      const n = await assignTraining({ userIds: targetUserIds, courseIds, dueDays, required });

      // Send email notifications if requested and Apps Script URL is configured
      let emailNote = "";
      if (notify && (window.GIM_CONFIG || {}).appsScriptReminderUrl) {
        try {
          const recipients = targetUserIds
            .map(uid => ALL_USERS.find(u => u.id === uid))
            .filter(u => u && u.email)
            .map(u => ({ email: u.email, name: u.name }));
          if (recipients.length) {
            const titles = courseIds
              .map(id => COURSES.find(c => c.id === id)?.title)
              .filter(Boolean).join(", ");
            const dueLine = dueDays != null ? `\n\nIt's due in ${dueDays} day${dueDays === 1 ? "" : "s"}.` : "";
            const res = await sendEmailReminder({
              recipients,
              subject: `New training assigned: ${titles}`,
              course: titles,
              dueDate: dueDays != null ? `In ${dueDays} day${dueDays === 1 ? "" : "s"}` : "",
              message: `You've been assigned new training in GIM Learning:\n${titles}${dueLine}\n\nLog in to start.`,
            });
            emailNote = ` · emailed ${res.sent || 0} learner${res.sent === 1 ? "" : "s"}`;
          }
        } catch (err) {
          console.warn("Notify-on-assign email failed:", err);
          emailNote = " (email failed — check Apps Script URL)";
        }
      }

      showToast?.(`Created ${n} enrolment${n === 1 ? "" : "s"}${emailNote}.`);
      onClose();
    } catch (err) {
      alert("Assign failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={760}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #ececec", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="cd-section-title" style={{ marginBottom: 4 }}>Step {step} of 3</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
            {step === 1 && "Choose courses"}
            {step === 2 && "Choose who to assign"}
            {step === 3 && "Schedule & review"}
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} title="Close"><Icon name="close" size={16}/></button>
      </div>

      {/* Stepper */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #ececec", display: "flex", gap: 4, background: "#fafafa" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "#7ac142" : "#e3e3e3" }}/>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", overflow: "auto", flex: 1 }}>
        {step === 1 && (
          <div>
            <div className="cd-field">
              <label>Search courses</label>
              <input className="cd-input" placeholder="Search by title…" value={courseQuery} onChange={e => setCourseQuery(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, maxHeight: 360, overflow: "auto" }}>
              {filteredCourses.map(c => (
                <label key={c.id} className="ce-resource" style={{ cursor: "pointer", background: courseIds.includes(c.id) ? "#f0f9e6" : "#fafafa", borderColor: courseIds.includes(c.id) ? "#7ac142" : "#ececec" }}>
                  <input type="checkbox" checked={courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} disabled={preset?.courseId === c.id} />
                  <div className={classNames(!c.coverUrl && c.cover)} style={{
                    width: 36, height: 24, borderRadius: 4, flexShrink: 0,
                    ...(c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "#5f635f" }}>{c.cat} · {c.duration} min · {c.lessons} lessons</div>
                  </div>
                  {c.required && <span className="chip chip-required" style={{ fontSize: 10, padding: "1px 6px" }}>Required</span>}
                </label>
              ))}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 10 }}>
              {courseIds.length} selected
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="cd-section-title">Audience type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 8 }}>
              {[
                { id: "department",     icon: "users", label: "By department",   sub: "Pick one or more departments" },
                { id: "people",         icon: "user",  label: "Specific people", sub: "Pick individuals from the team" },
                { id: "role-onboarding",icon: "flag",  label: "All onboarding",  sub: `${ALL_USERS.filter(u => u.status === "onboarding").length} new hires` },
                { id: "all",            icon: "globe", label: "All employees",   sub: `${ALL_USERS.filter(u => u.status !== "leave").length} active learners` },
              ].map(opt => (
                <button key={opt.id} onClick={() => setAudience(opt.id)} disabled={preset?.userId} style={{
                  textAlign: "left", padding: 12, borderRadius: 8,
                  border: audience === opt.id ? "2px solid #7ac142" : "1px solid #ddd",
                  background: audience === opt.id ? "#f0f9e6" : "#fff",
                  cursor: preset?.userId ? "not-allowed" : "pointer", opacity: preset?.userId ? 0.5 : 1,
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <Icon name={opt.icon} size={16}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#5f635f", marginTop: 2 }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {audience === "department" && (
              <div style={{ marginTop: 16 }}>
                <div className="cd-section-title">Departments</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {deptOptions.length === 0 ? (
                    <div className="text-xs text-muted">No departments yet — create one in Admin → Roles &amp; departments.</div>
                  ) : deptOptions.map(d => (
                    <button key={d} onClick={() => toggleDept(d)} style={{
                      padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: depts.includes(d) ? "1px solid #7ac142" : "1px solid #ddd",
                      background: depts.includes(d) ? "#7ac142" : "#fff",
                      color: depts.includes(d) ? "#fff" : "#111",
                    }}>{d} <span style={{ opacity: 0.7 }}>({ALL_USERS.filter(u => u.dept === d).length})</span></button>
                  ))}
                </div>
              </div>
            )}

            {audience === "people" && (
              <div style={{ marginTop: 16 }}>
                <div className="cd-field">
                  <label>Search people</label>
                  <input className="cd-input" placeholder="Search by name…" value={peopleQuery} onChange={e => setPeopleQuery(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 240, overflow: "auto" }}>
                  {filteredPeople.length === 0 && (
                    <div className="text-xs text-muted" style={{ padding: 8 }}>No users yet — they'll appear here once they sign in for the first time.</div>
                  )}
                  {filteredPeople.map(u => (
                    <label key={u.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 6,
                      cursor: "pointer", background: people.includes(u.id) ? "#f0f9e6" : "transparent",
                    }}>
                      <input type="checkbox" checked={people.includes(u.id)} onChange={() => togglePerson(u.id)} disabled={preset?.userId === u.id} />
                      <Avatar name={u.name} size={26} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#5f635f" }}>{u.dept || "Unassigned"} · {u.role || "Learner"}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, padding: 12, background: "#fafafa", borderRadius: 8, fontSize: 12 }}>
              <strong>{affected}</strong> learner{affected === 1 ? "" : "s"} will be assigned · <strong>{totalEnrollments}</strong> total enrollment{totalEnrollments === 1 ? "" : "s"}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="cd-section-title">Due date</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 8 }}>
              {[
                { id: "7",  label: "1 week" },
                { id: "30", label: "30 days" },
                { id: "90", label: "90 days" },
                { id: "custom", label: "Pick date" },
                { id: "none", label: "No due date" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDueOption(opt.id)} style={{
                  padding: "8px 10px", fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: "pointer",
                  border: dueOption === opt.id ? "2px solid #7ac142" : "1px solid #ddd",
                  background: dueOption === opt.id ? "#f0f9e6" : "#fff", color: "#111",
                }}>{opt.label}</button>
              ))}
            </div>
            {dueOption === "custom" && (
              <input type="date" className="cd-input" style={{ marginTop: 8, maxWidth: 220 }} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            )}

            <div className="cd-section-title" style={{ marginTop: 18 }}>Options</div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 10, borderRadius: 8, background: "#fafafa", marginTop: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Mark as required</div>
                <div className="text-xs text-muted">Counts toward compliance reporting; flagged when overdue.</div>
              </div>
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 10, borderRadius: 8, background: "#fafafa", marginTop: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Email learners now</div>
                <div className="text-xs text-muted">Sends a Google Workspace email with course link.</div>
              </div>
            </label>
            {notify && (
              <div className="cd-field" style={{ marginLeft: 30 }}>
                <label>Reminder cadence</label>
                <select className="cd-input" value={reminderCadence} onChange={e => setReminderCadence(e.target.value)} style={{ maxWidth: 240 }}>
                  <option value="none">No reminders</option>
                  <option value="weekly">Weekly until complete</option>
                  <option value="3days">Every 3 days</option>
                  <option value="overdue">Only when overdue</option>
                </select>
              </div>
            )}

            {/* Review summary */}
            <div style={{ marginTop: 18, border: "1px solid #ececec", borderRadius: 10, padding: 14, background: "#fff" }}>
              <div className="cd-section-title" style={{ marginBottom: 10 }}>Review</div>
              <ReviewLine label="Courses"   value={`${courseIds.length} selected`} detail={courseIds.map(id => COURSES.find(c => c.id === id)?.title).filter(Boolean).join(", ")} />
              <ReviewLine label="Audience"  value={`${affected} learner${affected === 1 ? "" : "s"}`}
                detail={
                  audience === "department" ? depts.join(", ") || "—" :
                  audience === "people" ? people.map(id => ALL_USERS.find(u => u.id === id)?.name || id).join(", ") || "—" :
                  audience === "role-onboarding" ? "All onboarding employees" :
                  "All active employees"
                } />
              <ReviewLine label="Due date"  value={dueLabel()} />
              <ReviewLine label="Required"  value={required ? "Yes" : "No"} />
              <ReviewLine label="Notify"    value={notify ? "Email + " + reminderCadence : "Silent"} last />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <div style={{ display: "flex", gap: 8 }}>
          {step > 1 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>← Back</button>}
          {step < 3 && <button className="btn btn-primary btn-sm" disabled={!canProceed()} onClick={() => setStep(s => s + 1)} style={{ opacity: canProceed() ? 1 : 0.5 }}>Continue →</button>}
          {step === 3 && <button className="btn btn-primary btn-sm" onClick={submit} disabled={submitting}>
            <Icon name="check" size={14}/> {submitting ? "Assigning…" : "Assign training"}
          </button>}
        </div>
      </div>
    </Modal>
  );
};

const ReviewLine = ({ label, value, detail, last }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: last ? "none" : "1px dashed #ececec", gap: 12 }}>
    <div style={{ fontSize: 11, color: "#5f635f", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, minWidth: 80 }}>{label}</div>
    <div style={{ flex: 1, textAlign: "right" }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
      {detail && <div style={{ fontSize: 11, color: "#5f635f", marginTop: 2 }}>{detail}</div>}
    </div>
  </div>
);

// ---------- Row action menu (3-dot) ----------
// Uses a portal + fixed positioning so the dropdown is never clipped by
// the table or scroll container, and auto-flips above the button when
// there isn't enough room below.
const RowMenu = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const MENU_W = 220;
  const itemRows = items.filter(x => x !== "divider").length;
  const dividers = items.filter(x => x === "divider").length;
  const MENU_H = itemRows * 34 + dividers * 9 + 8;

  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const placeBelow = r.bottom + 4 + MENU_H <= window.innerHeight;
    setPos({
      top: placeBelow ? r.bottom + 4 : r.top - MENU_H - 4,
      left: Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8)),
    });
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button ref={btnRef} className="btn-icon" title="More" onClick={() => open ? setOpen(false) : openMenu()}>
        <Icon name="more" size={14}/>
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 1000,
          background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 4,
          width: MENU_W, boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        }}>
          {items.map((it, i) => it === "divider" ? (
            <div key={i} style={{ height: 1, background: "#ececec", margin: "4px 0" }} />
          ) : (
            <button key={i} onClick={() => { setOpen(false); it.onClick?.(); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", border: 0, background: "transparent",
              fontSize: 12, fontWeight: 500, fontFamily: "inherit",
              cursor: "pointer", textAlign: "left", borderRadius: 6, color: it.danger ? "#a8232b" : "#111",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {it.icon && <Icon name={it.icon} size={13} />}
              <span>{it.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

Object.assign(window, { Modal, AssignTrainingModal, RowMenu });
