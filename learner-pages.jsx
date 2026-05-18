// =========================================================
// GIM LMS — Learner pages
// =========================================================

// Format a Firestore Timestamp / Date / string into a friendly date label
const formatDate = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val.toDate) return val.toDate().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  if (val instanceof Date) return val.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return "";
};

const learnerCourseCoverStyle = (course) => course?.coverUrl
  ? { backgroundImage: `url(${course.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
  : undefined;

const learnerCourseLessons = (course) => {
  const sections = course?.sections || course?.modules || [];
  return sections.flatMap(sec => sec.lessons || []);
};

const learnerLessonTitle = (course, lessonId) => {
  if (!lessonId) return "";
  return learnerCourseLessons(course).find(l => l.id === lessonId)?.title || "";
};

const learnerNextLessonTitle = (course, enrollment = {}) => {
  const lessons = learnerCourseLessons(course);
  const done = new Set(enrollment.completedLessons || []);
  return lessons.find(l => !done.has(l.id))?.title
    || learnerLessonTitle(course, enrollment.currentLessonId || enrollment.lastLesson);
};

// ============================================================
// Reusable: Course card (grid)
// ============================================================
const CourseCard = ({ course, onOpen, enrollment }) => {
  const e = enrollment;
  const coverStyle = course.coverUrl
    ? { backgroundImage: `url(${course.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : null;
  return (
    <div className="course-card" onClick={onOpen}>
      <div className={classNames("course-card__cover", !course.coverUrl && course.cover)} style={coverStyle || undefined}>
        <div className="course-card__cover-tint" />
        <div className="course-card__chips">
          {e?.status === "completed" && <span className="chip chip-green">Completed</span>}
        </div>
        <div className="course-card__duration">{course.duration} min</div>
      </div>
      <div className="course-card__body">
        <div className="course-card__cat">{course.cat}</div>
        <div className="course-card__title">{course.title}</div>
        <div className="course-card__meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="play-o" size={12} />{course.lessons || 0} {course.lessons === 1 ? "lesson" : "lessons"}
          </span>
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
  const totalForPct = completedCount + totalAssigned;
  const overallPct = totalForPct ? Math.round((completedCount / totalForPct) * 100) : 0;
  const requiredDueSoon = ASSIGNED.filter(a => a.required && a.dueDays <= 30).length;
  const earliestDue = ASSIGNED.length ? Math.min(...ASSIGNED.map(a => a.dueDays)) : null;
  const scoredCourses = completed.filter(c => typeof ENROLLMENTS[c.id]?.score === "number");
  const avgScore = scoredCourses.length
    ? Math.round(scoredCourses.reduce((s, c) => s + ENROLLMENTS[c.id].score, 0) / scoredCourses.length)
    : null;
  const firstName = (CURRENT_USER.name || "there").split(" ")[0];

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-card">
        <div>
          <div className="hero-card__greeting">Welcome</div>
          <div className="hero-card__name">
            {firstName}{totalForPct ? `, you're ${overallPct}% through your training.` : `, you have no training assigned yet.`}
          </div>
          <div className="hero-card__sub">
            {totalForPct ? (
              <>
                You have <strong style={{ color: "#fff" }}>{requiredDueSoon} required course{requiredDueSoon === 1 ? "" : "s"}</strong> due this month and{" "}
                <strong style={{ color: "#fff" }}>{inProgress.length} in progress</strong>.
              </>
            ) : (
              <>{CURRENT_USER.status === "onboarding" ? "An admin will assign onboarding training shortly." : "An admin will assign training shortly. Browse the catalog any time."}</>
            )}
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
          <div className="stat__value">{requiredDueSoon}</div>
          <div className="stat__sub">{earliestDue !== null ? `Earliest due: in ${earliestDue} days` : "Nothing due"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">In progress</div>
          <div className="stat__value">{inProgress.length}</div>
          <div className="stat__sub">{inProgress.length ? "Keep going" : "No courses started"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Completed YTD</div>
          <div className="stat__value">{completedCount}</div>
          <div className="stat__sub">{completedCount ? "Nice work" : "Nothing yet"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Avg. assessment score</div>
          <div className="stat__value">{avgScore !== null ? <>{avgScore}<span style={{ fontSize: 18, color: "#5f635f" }}>%</span></> : "—"}</div>
          <div className="stat__sub">{scoredCourses.length ? `Across ${scoredCourses.length} graded course${scoredCourses.length === 1 ? "" : "s"}` : "No graded courses yet"}</div>
        </div>
      </div>

      {/* Single-column flow: Pick up where you left off → Assigned → Recent activity */}
      <div className="mt-8">
        <div className="section-head">
          <h3>Pick up where you left off</h3>
          <a onClick={() => setRoute("learning")}>View all →</a>
        </div>
        {inProgress.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", color: "#5f635f", fontSize: 13 }}>
            Nothing in progress yet. Browse the catalog or pick something from your assignments below.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inProgress.map(c => {
              const e = ENROLLMENTS[c.id] || {};
              const nextTitle = learnerNextLessonTitle(c, e);
              return (
                <div key={c.id} className="ip-card" onClick={() => goCourse(c.id)}>
                  <div className={classNames("ip-card__cover", !c.coverUrl && c.cover)} style={learnerCourseCoverStyle(c)} />
                  <div className="ip-card__body">
                    <div className="ip-card__cat">{c.cat}</div>
                    <div className="ip-card__title">{c.title}</div>
                    {nextTitle && (
                      <div className="ip-card__meta"><span>Up next: {nextTitle}</span></div>
                    )}
                    <div className="ip-card__bar"><div style={{ width: `${e.progress || 0}%` }} /></div>
                    <div className="ip-card__meta" style={{ justifyContent: "space-between" }}>
                      <span>{e.progress || 0}% complete</span>
                      <span style={{ color: "#2e5a12", fontWeight: 600 }}>Resume <Icon name="arrow-right" size={12}/></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="section-head mt-8">
          <h3>Assigned to you</h3>
          <a onClick={() => setRoute("learning")}>All assignments →</a>
        </div>
        {assigned.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", color: "#5f635f", fontSize: 13 }}>
            No new assignments right now.
          </div>
        ) : (
          <div className="card">
            <div style={{ padding: 8 }}>
              {assigned.map(a => {
                const soon = a.dueDays != null && a.dueDays <= 14;
                if (!a.course) return null; // silently skip if course was deleted
                return (
                  <div className="assigned-row" key={a.id} onClick={() => goCourse(a.id)}>
                    <div className={classNames("assigned-row__cover", !a.course.coverUrl && a.course.cover)} style={learnerCourseCoverStyle(a.course)} />
                    <div>
                      <div className="assigned-row__title">{a.course.title}</div>
                      <div className="assigned-row__sub">{a.course.cat} · {a.course.duration} min</div>
                    </div>
                    <div className="assigned-row__due">
                      {a.dueDays != null && (
                        <div className={classNames("assigned-row__due-date", soon && "assigned-row__due-soon")}>
                          Due in {a.dueDays}d
                        </div>
                      )}
                      <div>{a.required ? "Required" : "Optional"}</div>
                    </div>
                    <Icon name="chevron-right" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="section-head mt-8">
          <h3>Recent activity</h3>
        </div>
        {ACTIVITY.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", color: "#5f635f", fontSize: 13 }}>
            No activity yet. Complete a lesson to start your history.
          </div>
        ) : (
          <div className="card card-pad">
            {ACTIVITY.map((a, i) => {
              const ts = a.createdAt?.toDate ? a.createdAt.toDate() : null;
              const when = ts ? ts.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : (a.when || "");
              const courseTitle = a.course || (a.courseId && (COURSES.find(c => c.id === a.courseId)?.title)) || "";
              return (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid #f3f3f3" : "none" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: "#f0f9e6",
                    color: "#2e5a12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon name="checkb" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.text}</div>
                    <div style={{ fontSize: 12, color: "#5f635f" }}>{courseTitle}{courseTitle && when ? " · " : ""}{when}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Catalog
// ============================================================
const CatalogPage = ({ goCourse, initialCategory }) => {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState(initialCategory || "All");
  const [reqOnly, setReqOnly] = React.useState(false);
  const cats = ["All", ...CATEGORIES];
  const isOnboarding = CURRENT_USER.status === "onboarding";

  // If a Browse category was clicked while already on /catalog, apply the new filter
  React.useEffect(() => {
    if (initialCategory && initialCategory !== cat) setCat(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory]);

  const filtered = COURSES.filter(c => {
    // Learners only see published courses
    const status = c.status || "published";
    if (status !== "published") return false;
    if (isOnboarding && !ENROLLMENTS[c.id]) return false;
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
          <div className="page-head__sub">
            {isOnboarding
              ? "During onboarding, only courses assigned to you are shown."
              : `${COURSES.filter(c => (c.status || "published") === "published").length} courses across compliance, operations, and growth.`}
          </div>
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
  const [tab, setTab] = React.useState("active");
  const visibleCourses = COURSES.filter(c => c.status !== "archived");
  const inProgress = visibleCourses.filter(c => ENROLLMENTS[c.id]?.status === "in_progress");
  const completed  = COURSES.filter(c => ENROLLMENTS[c.id]?.status === "completed");
  const assigned   = ASSIGNED.map(a => visibleCourses.find(c => c.id === a.id)).filter(Boolean);

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
        <button className={classNames("tab", tab === "active" && "active")} onClick={() => setTab("active")}>
          Active · {inProgress.length + assigned.length}
        </button>
        <button className={classNames("tab", tab === "completed" && "active")} onClick={() => setTab("completed")}>
          Completed · {completed.length}
        </button>
      </div>

      {tab === "active" && (
        <>
          <div className="section-head" style={{ marginTop: 4 }}>
            <h3>In progress · {inProgress.length}</h3>
          </div>
          {inProgress.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: "center", color: "#5f635f", fontSize: 13 }}>
              Nothing in progress.
            </div>
          ) : (
            <div className="course-grid">
              {inProgress.map(c => (
                <CourseCard key={c.id} course={c} enrollment={ENROLLMENTS[c.id]} onOpen={() => goCourse(c.id)} />
              ))}
            </div>
          )}

          <div className="section-head mt-8">
            <h3>Assigned · {assigned.length}</h3>
          </div>
          {assigned.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: "center", color: "#5f635f", fontSize: 13 }}>
              Nothing currently assigned.
            </div>
          ) : (
            <div className="course-grid">
              {assigned.map(c => (
                <CourseCard key={c.id} course={c} enrollment={ENROLLMENTS[c.id]} onOpen={() => goCourse(c.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "completed" && (
        completed.length === 0 ? (
          <div className="empty">No completed courses yet.</div>
        ) : (
          <div className="course-grid">
            {completed.map(c => (
              <CourseCard key={c.id} course={c} enrollment={ENROLLMENTS[c.id]} onOpen={() => goCourse(c.id)} />
            ))}
          </div>
        )
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
                  Awarded {formatDate(e.completedOn) || "—"}{e.score != null ? ` · Score ${e.score}%` : ""}
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
