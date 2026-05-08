// =========================================================
// GIM LMS — Learner pages
// =========================================================

// ============================================================
// Reusable: Course card (grid)
// ============================================================
const CourseCard = ({ course, onOpen, enrollment }) => {
  const isReq = course.required;
  const e = enrollment;
  return (
    <div className="course-card" onClick={onOpen}>
      <div className={classNames("course-card__cover", course.cover)}>
        <div className="course-card__cover-tint" />
        <div className="course-card__chips">
          {isReq && <span className="chip chip-required">Required</span>}
          {e?.status === "completed" && <span className="chip chip-green">Completed</span>}
        </div>
        <div className="course-card__duration">{course.duration} min</div>
      </div>
      <div className="course-card__body">
        <div className="course-card__cat">{course.cat}</div>
        <div className="course-card__title">{course.title}</div>
        <div className="course-card__meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="play-o" size={12} />{course.lessons} lessons
          </span>
          <span>·</span>
          <span>{course.level}</span>
        </div>
        {e?.status === "in_progress" && (
          <div className="bar bar-thin" style={{ marginTop: 4 }}>
            <div style={{ width: `${e.progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Dashboard
// ============================================================
const DashboardPage = ({ goCourse, setRoute }) => {
  const inProgress = COURSES.filter(c => ENROLLMENTS[c.id]?.status === "in_progress");
  const completed  = COURSES.filter(c => ENROLLMENTS[c.id]?.status === "completed");
  const assigned   = ASSIGNED.map(a => ({ ...a, course: COURSES.find(c => c.id === a.id) }));
  const totalAssigned = ASSIGNED.length + inProgress.length;
  const completedCount = completed.length;
  const overallPct = Math.round((completedCount / (completedCount + totalAssigned)) * 100);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-card">
        <div>
          <div className="hero-card__greeting">Good afternoon</div>
          <div className="hero-card__name">{CURRENT_USER.name.split(" ")[0]}, you're {overallPct}% through your training.</div>
          <div className="hero-card__sub">
            You have <strong style={{ color: "#fff" }}>2 required courses</strong> due this month and{" "}
            <strong style={{ color: "#fff" }}>{inProgress.length} in progress</strong>. Pick up where you left off below.
          </div>
        </div>
        <div className="hero-card__progress">
          <div className="hero-card__progress-num">{completedCount}<span>/{completedCount + totalAssigned}</span></div>
          <div className="hero-card__progress-label">Courses complete</div>
          <div className="hero-card__bar"><div style={{ width: `${overallPct}%` }} /></div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-grid mt-6">
        <div className="stat">
          <div className="stat__label">Required · due ≤ 30d</div>
          <div className="stat__value">2</div>
          <div className="stat__sub">Earliest due: in 7 days</div>
        </div>
        <div className="stat">
          <div className="stat__label">In progress</div>
          <div className="stat__value">{inProgress.length}</div>
          <div className="stat__sub">Last active: today</div>
        </div>
        <div className="stat">
          <div className="stat__label">Completed YTD</div>
          <div className="stat__value">{completedCount}</div>
          <div className="stat__sub">+1 this month</div>
        </div>
        <div className="stat">
          <div className="stat__label">Avg. assessment score</div>
          <div className="stat__value">94<span style={{ fontSize: 18, color: "#5f635f" }}>%</span></div>
          <div className="stat__sub">Across 4 graded courses</div>
        </div>
      </div>

      {/* Two-col: Continue learning + Assigned */}
      <div className="dash-2col mt-8">
        <div>
          <div className="section-head">
            <h3>Pick up where you left off</h3>
            <a onClick={() => setRoute("learning")}>View all →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inProgress.map(c => {
              const e = ENROLLMENTS[c.id];
              return (
                <div key={c.id} className="ip-card" onClick={() => goCourse(c.id)}>
                  <div className={classNames("ip-card__cover", c.cover)} />
                  <div className="ip-card__body">
                    <div className="ip-card__cat">{c.cat}</div>
                    <div className="ip-card__title">{c.title}</div>
                    <div className="ip-card__meta">
                      <span>Up next: {e.lastLesson}</span>
                    </div>
                    <div className="ip-card__bar"><div style={{ width: `${e.progress}%` }} /></div>
                    <div className="ip-card__meta" style={{ justifyContent: "space-between" }}>
                      <span>{e.progress}% complete</span>
                      <span style={{ color: "#2e5a12", fontWeight: 600 }}>Resume <Icon name="arrow-right" size={12}/></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="section-head">
            <h3>Assigned to you</h3>
            <a onClick={() => setRoute("learning")}>All assignments →</a>
          </div>
          <div className="card">
            <div style={{ padding: 8 }}>
              {assigned.map(a => {
                const soon = a.dueDays <= 14;
                return (
                  <div className="assigned-row" key={a.id} onClick={() => goCourse(a.id)}>
                    <div className={classNames("assigned-row__icon", a.required && "req")}>
                      <Icon name={a.required ? "shield" : "book"} />
                    </div>
                    <div>
                      <div className="assigned-row__title">{a.course.title}</div>
                      <div className="assigned-row__sub">{a.course.cat} · {a.course.duration} min</div>
                    </div>
                    <div className="assigned-row__due">
                      <div className={classNames("assigned-row__due-date", soon && "assigned-row__due-soon")}>
                        Due in {a.dueDays}d
                      </div>
                      <div>{a.required ? "Required" : "Optional"}</div>
                    </div>
                    <Icon name="chevron-right" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-head mt-6">
            <h3>Recent activity</h3>
          </div>
          <div className="card card-pad">
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid #f3f3f3" : "none" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: "#f0f9e6",
                  color: "#2e5a12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="checkb" size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.text}</div>
                  <div style={{ fontSize: 12, color: "#5f635f" }}>{a.course} · {a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Catalog
// ============================================================
const CatalogPage = ({ goCourse }) => {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [reqOnly, setReqOnly] = React.useState(false);
  const cats = ["All", ...CATEGORIES];

  const filtered = COURSES.filter(c => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "All" && c.cat !== cat) return false;
    if (reqOnly && !c.required) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Catalog</div>
          <h1 className="page-head__title">Course library</h1>
          <div className="page-head__sub">{COURSES.length} courses across compliance, operations, and growth.</div>
        </div>
      </div>

      <div className="filterbar">
        <input type="search" placeholder="Search courses…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          className={classNames("btn btn-sm", reqOnly ? "btn-primary" : "btn-ghost")}
          onClick={() => setReqOnly(!reqOnly)}
        >
          <Icon name="shield" size={14} /> Required only
        </button>
        <div className="fb-spacer" />
        <span style={{ fontSize: 12, color: "#5f635f" }}>{filtered.length} of {COURSES.length}</span>
      </div>

      <div className="course-grid">
        {filtered.map(c => (
          <CourseCard key={c.id} course={c} enrollment={ENROLLMENTS[c.id]} onOpen={() => goCourse(c.id)} />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// My Learning
// ============================================================
const MyLearningPage = ({ goCourse }) => {
  const [tab, setTab] = React.useState("inprogress");
  const inProgress = COURSES.filter(c => ENROLLMENTS[c.id]?.status === "in_progress");
  const completed  = COURSES.filter(c => ENROLLMENTS[c.id]?.status === "completed");
  const assigned   = ASSIGNED.map(a => COURSES.find(c => c.id === a.id));

  let list = [];
  if (tab === "inprogress") list = inProgress;
  if (tab === "assigned")   list = assigned;
  if (tab === "completed")  list = completed;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">My learning</div>
          <h1 className="page-head__title">Your training</h1>
          <div className="page-head__sub">Everything you've started, been assigned, or finished.</div>
        </div>
      </div>

      <div className="tabs">
        <button className={classNames("tab", tab === "inprogress" && "active")} onClick={() => setTab("inprogress")}>
          In progress · {inProgress.length}
        </button>
        <button className={classNames("tab", tab === "assigned" && "active")} onClick={() => setTab("assigned")}>
          Assigned · {assigned.length}
        </button>
        <button className={classNames("tab", tab === "completed" && "active")} onClick={() => setTab("completed")}>
          Completed · {completed.length}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty">Nothing here yet.</div>
      ) : (
        <div className="course-grid">
          {list.map(c => (
            <CourseCard key={c.id} course={c} enrollment={ENROLLMENTS[c.id]} onOpen={() => goCourse(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Certificates page
// ============================================================
const CertificatesPage = ({ goCert }) => {
  const completed = COURSES.filter(c => ENROLLMENTS[c.id]?.status === "completed");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-head__eyebrow">Certificates</div>
          <h1 className="page-head__title">Your certificates</h1>
          <div className="page-head__sub">Downloadable proof of completion for every course you finish.</div>
        </div>
      </div>

      <div className="course-grid">
        {completed.map(c => {
          const e = ENROLLMENTS[c.id];
          return (
            <div className="card" key={c.id} style={{ overflow: "hidden", cursor: "pointer" }} onClick={() => goCert(c.id)}>
              <div style={{
                background: "#fff", border: "1px solid #ececec", margin: 16, borderRadius: 8,
                padding: 18, position: "relative", aspectRatio: "1.414", display: "flex", flexDirection: "column",
              }}>
                <div style={{ position: "absolute", inset: 6, border: "2px solid #7ac142", borderRadius: 6, pointerEvents: "none" }} />
                <div style={{ fontFamily: "var(--font-accent)", fontSize: 9, letterSpacing: "0.18em", color: "#2e5a12", fontWeight: 700, textTransform: "uppercase" }}>Certificate</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.1, marginTop: 8 }}>{c.title}</div>
                <div style={{ marginTop: "auto", fontSize: 11, color: "#5f635f" }}>
                  Awarded {e.completedOn} · Score {e.score}%
                </div>
              </div>
              <div style={{ padding: "12px 16px 16px", display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={(ev) => { ev.stopPropagation(); goCert(c.id); }}>
                  <Icon name="external" size={14} /> View
                </button>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={(ev) => ev.stopPropagation()}>
                  <Icon name="download" size={14} /> Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { CourseCard, DashboardPage, CatalogPage, MyLearningPage, CertificatesPage });
