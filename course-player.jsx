// =========================================================
// GIM LMS — Course player + Assessment + Certificate
// =========================================================

// Normalise YouTube / Google Drive URLs to embed format so iframes work
// regardless of which copy/paste link the admin used.
const toEmbedUrl = (url, source) => {
  if (!url) return url;
  const isYT = source === "youtube" || /youtube\.com|youtu\.be/.test(url);
  const isDrive = source === "drive" || /drive\.google\.com/.test(url);

  if (isYT) {
    // youtu.be/ID(?si=…) → youtube.com/embed/ID
    let m = url.match(/youtu\.be\/([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    // youtube.com/watch?v=ID → youtube.com/embed/ID
    m = url.match(/[?&]v=([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    // youtube.com/shorts/ID → youtube.com/embed/ID
    m = url.match(/youtube\.com\/shorts\/([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    if (/\/embed\//.test(url)) return url;
  }

  if (isDrive) {
    // /file/d/ID/(view|edit|preview) → /file/d/ID/preview
    let m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    // open?id=ID → /file/d/ID/preview
    m = url.match(/[?&]id=([\w-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }

  return url;
};

// ============================================================
// Course player
// ============================================================
const CoursePage = ({ courseId, goBack, goAssessment }) => {
  const course = COURSES.find(c => c.id === courseId);
  const enrollment = ENROLLMENTS[courseId];

  if (!course) {
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginBottom: 12 }}>
          <Icon name="arrow-left" size={12}/> Back
        </button>
        <div className="empty">Course not found. It may have been archived or deleted.</div>
      </div>
    );
  }

  // Build flat lesson list with section context.
  // Courses created via the editor save `modules`; legacy/seeded courses use `sections`.
  const courseSections = course.sections || course.modules || [];
  const flatLessons = [];
  courseSections.forEach((sec, sIdx) => {
    (sec.lessons || []).forEach((l, lIdx) => {
      flatLessons.push({ ...l, section: sec.title, sIdx, lIdx });
    });
  });

  // Determine starting lesson (resume from enrollment if possible)
  const initialIdx = (() => {
    if (enrollment?.currentLessonId) {
      const i = flatLessons.findIndex(l => l.id === enrollment.currentLessonId);
      if (i >= 0) return i;
    }
    return 0;
  })();
  const [activeIdx, setActiveIdx] = React.useState(initialIdx);

  // Completed set comes from Firestore enrollment.completedLessons (live)
  const completed = React.useMemo(() => {
    return new Set(enrollment?.completedLessons || []);
  }, [enrollment?.completedLessons?.length, courseId]);

  const active = flatLessons[activeIdx] || flatLessons[0];
  const progressPct = flatLessons.length
    ? Math.round((completed.size / flatLessons.length) * 100)
    : 0;

  // No lessons authored yet — show a friendly placeholder instead of crashing
  if (!active) {
    return (
      <div className="page page--wide">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, fontSize: 13, color: "#5f635f" }}>
          <button className="btn-icon" onClick={goBack} title="Back"><Icon name="arrow-left" /></button>
          <a onClick={goBack} style={{ cursor: "pointer" }}>Back</a>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: "#111", fontWeight: 600 }}>{course.title}</span>
        </div>
        <div className="card card-pad-lg" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 6px" }}>No lessons yet</h2>
          <div className="text-muted text-sm" style={{ marginBottom: 18 }}>
            This course doesn't have any lesson content authored. An admin needs to add modules and lessons in the course editor before learners can take it.
          </div>
          <button className="btn btn-ghost btn-sm" onClick={goBack}>Back to catalog</button>
        </div>
      </div>
    );
  }

  const [marking, setMarking] = React.useState(false);
  const linkedAssessment = (window.ASSESSMENTS || []).find(a => a.courseId === course.id && a.status !== "archived");
  const isLast = active && activeIdx >= flatLessons.length - 1;
  const courseFullyDone = flatLessons.length > 0 && completed.size >= flatLessons.length;

  const persistLessonComplete = async () => {
    if (!active || !window.fbReady || !window.markLessonComplete) return;
    try {
      await markLessonComplete(course, active.id);
      if (isLast && completed.size + 1 >= flatLessons.length) {
        await recordActivity(`Completed course "${course.title}"`, course.id);
      } else {
        await recordActivity(`Completed lesson "${active.title}" in ${course.title}`, course.id);
      }
    } catch (err) {
      console.error("markLessonComplete:", err);
      showToast?.("Couldn't save progress: " + err.message);
    }
  };

  const markDoneAndContinue = async () => {
    if (marking || !active) return;
    setMarking(true);
    await persistLessonComplete();
    setMarking(false);
    if (activeIdx < flatLessons.length - 1) setActiveIdx(activeIdx + 1);
  };

  const markDoneAndAssess = async () => {
    if (marking || !active) return;
    setMarking(true);
    if (!completed.has(active.id)) await persistLessonComplete();
    setMarking(false);
    goAssessment(course.id);
  };

  return (
    <div className="page page--wide">
      {/* Breadcrumb / back */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, fontSize: 13, color: "#5f635f" }}>
        <button className="btn-icon" onClick={goBack} title="Back">
          <Icon name="arrow-left" />
        </button>
        <a onClick={goBack} style={{ cursor: "pointer" }}>Catalog</a>
        <Icon name="chevron-right" size={12} />
        <span>{course.cat}</span>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: "#111", fontWeight: 600 }}>{course.title}</span>
      </div>

      {/* Title block */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="page-head__eyebrow">{course.cat}</div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "4px 0 8px" }}>
            {course.title}
          </h1>
          <div style={{ display: "flex", gap: 16, alignItems: "center", color: "#5f635f", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="users" size={14} />{course.instructor}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="clock" size={14} />{course.duration} min total
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="book" size={14} />{flatLessons.length} lessons
            </span>
            {course.required && <span className="chip chip-required">Required</span>}
          </div>
        </div>
        <div style={{ minWidth: 220, textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#5f635f", marginBottom: 4 }}>Your progress</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{progressPct}%</div>
          <div className="bar" style={{ marginTop: 6, width: 220, marginLeft: "auto" }}>
            <div style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="player-layout">
        {/* Main video / lesson area */}
        <div className="player-main">
          <div className="video-frame">
            {active.type === "video" && active.url ? (
              <iframe
                src={toEmbedUrl(active.url, active.source)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={active.title}
              />
            ) : active.type === "pdf" && active.url ? (
              <iframe
                src={toEmbedUrl(active.url, "drive")}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, background: "#fff" }}
                title={active.title}
              />
            ) : active.type === "link" && active.url ? (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 32 }}>
                <Icon name="external" size={42} />
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>External resource</div>
                <a href={active.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 16, textDecoration: "none" }}>
                  Open in new tab <Icon name="external" size={12}/>
                </a>
              </div>
            ) : (
              <div className={classNames("video-frame__bg", course.cover)} />
            )}
            {active.type === "video" && !active.url && (
              <button className="video-frame__play" title="Play">
                <Icon name="play" />
              </button>
            )}
            {active.type === "video" && active.url && (
              <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name={active.source === "youtube" ? "video" : "play-o"} size={12} />
                {active.source === "youtube" ? "YouTube" : "Google Drive"}
              </div>
            )}
            {active.type === "article" && (
              <div style={{ position: "relative", color: "#fff", textAlign: "center" }}>
                <Icon name="doc" size={42} />
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>Article · {active.dur}</div>
              </div>
            )}
            {active.type === "pdf" && !active.url && (
              <div style={{ position: "relative", color: "#fff", textAlign: "center" }}>
                <Icon name="pdf" size={42} />
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>PDF · {active.dur}</div>
              </div>
            )}
            {active.type === "quiz" && (
              <div style={{ position: "relative", color: "#fff", textAlign: "center" }}>
                <Icon name="quiz" size={42} />
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>Assessment · {active.dur}</div>
              </div>
            )}
            {active.type === "link" && (
              <div style={{ position: "relative", color: "#fff", textAlign: "center" }}>
                <Icon name="external" size={42} />
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>External resource</div>
              </div>
            )}
            {active.type === "video" && !active.url && (
              <div className="video-frame__controls">
                <Icon name="play" size={14} />
                <div className="video-frame__bar"><div style={{ width: "32%" }}/></div>
                <div className="video-frame__time">1:42 / {active.dur}</div>
                <Icon name="settings" size={14} />
              </div>
            )}
          </div>

          {/* Lesson title + meta */}
          <div className="card card-pad-lg" style={{ marginTop: 18 }}>
            <div className="eyebrow-sm" style={{ marginBottom: 6 }}>{active.section}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{active.title}</h2>
            {/* Article-type lessons show their full body; other types show course description */}
            {active.type === "article" && active.body ? (
              <div style={{ fontSize: 14, lineHeight: 1.65, marginTop: 16, color: "#1f1f1f", whiteSpace: "pre-wrap" }}>
                {active.body}
              </div>
            ) : (
              <p className="text-muted mt-3" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {course.description}
              </p>
            )}

            {/* Resources */}
            {(course.resources?.length > 0) && (
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                {course.resources.map((r, i) => (
                  <a key={i}
                    href={r.url || "#"}
                    target={r.url ? "_blank" : undefined}
                    rel={r.url ? "noopener noreferrer" : undefined}
                    onClick={r.url ? undefined : (e) => e.preventDefault()}
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: "none" }}>
                    <Icon name={r.type === "link" ? "external" : "download"} size={14} />
                    {r.name || (r.type === "link" ? "Reference" : "Resource")}
                    {r.size ? ` · ${r.size}` : ""}
                  </a>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, paddingTop: 18, borderTop: "1px solid #ececec" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                style={activeIdx === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}}
              >
                <Icon name="arrow-left" size={14}/> Previous
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                {(() => {
                  // Inline quiz lesson — go straight to assessment
                  if (active.type === "quiz") {
                    return <button className="btn btn-primary" onClick={() => goAssessment(course.id)}>
                      Start assessment <Icon name="arrow-right" size={14}/>
                    </button>;
                  }
                  // Last lesson + linked assessment exists in /assessments
                  if (isLast && linkedAssessment) {
                    return <button className="btn btn-primary" disabled={marking} onClick={markDoneAndAssess}>
                      {marking ? "Saving…" : (completed.has(active.id) ? "Take final assessment" : "Mark complete & take assessment")}
                      <Icon name="arrow-right" size={14}/>
                    </button>;
                  }
                  // Last lesson, no assessment, course fully complete
                  if (isLast && courseFullyDone) {
                    return <button className="btn btn-primary" onClick={goBack}>
                      Back to learning <Icon name="arrow-right" size={14}/>
                    </button>;
                  }
                  // Default: mark + continue
                  return <button className="btn btn-primary" onClick={markDoneAndContinue} disabled={marking}>
                    {marking ? "Saving…" : "Mark complete & continue"} <Icon name="arrow-right" size={14}/>
                  </button>;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson list */}
        <aside className="lesson-list">
          <div className="lesson-list__head">
            <div className="lesson-list__title">Course content</div>
            <div className="lesson-list__sub">
              {completed.size} of {flatLessons.length} lessons complete
            </div>
            <div className="bar bar-thin" style={{ marginTop: 8 }}>
              <div style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="lesson-list__scroll">
            {courseSections.map((sec, sIdx) => (
              <div className="lesson-section" key={sIdx}>
                <div className="lesson-section__title">Section {sIdx + 1} · {sec.title}</div>
                {(sec.lessons || []).map((l, lIdx) => {
                  const idx = flatLessons.findIndex(fl => fl.id === l.id && fl.sIdx === sIdx);
                  const isActive = idx === activeIdx;
                  const isDone = completed.has(l.id);
                  return (
                    <div
                      key={l.id}
                      className={classNames("lesson-row", isActive && "active")}
                      onClick={() => setActiveIdx(idx)}
                    >
                      <div className={classNames("lesson-row__check", isDone && "done")}>
                        {isDone ? <Icon name="checkb" size={11} /> : null}
                      </div>
                      <div className="lesson-row__type"><Icon name={lessonIcon(l.type)} /></div>
                      <div className="lesson-row__title">{l.title}</div>
                      <div className="lesson-row__dur">{l.dur}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

// ============================================================
// Assessment
// ============================================================
const AssessmentPage = ({ courseId, goCert, goBack }) => {
  const course = COURSES.find(c => c.id === courseId);

  // Prefer a real assessment from Firestore (linked by courseId); otherwise fall back to SAMPLE_QUIZ
  const linkedAssessment = (window.ASSESSMENTS || []).find(a => a.courseId === courseId && a.status !== "archived");
  const quiz = linkedAssessment || SAMPLE_QUIZ;
  const passMark = linkedAssessment?.passMark || 80;

  const [answers, setAnswers] = React.useState({});
  const [qIdx, setQIdx] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  if (!course) {
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginBottom: 12 }}>
          <Icon name="arrow-left" size={12}/> Back
        </button>
        <div className="empty">Course not found.</div>
      </div>
    );
  }
  if (!quiz?.questions?.length) {
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginBottom: 12 }}>
          <Icon name="arrow-left" size={12}/> Back
        </button>
        <div className="empty">This course doesn't have an assessment yet.</div>
      </div>
    );
  }

  const total = quiz.questions.length;
  const q = quiz.questions[qIdx];
  const allAnswered = Object.keys(answers).length === total;

  const score = React.useMemo(() => {
    let correct = 0;
    quiz.questions.forEach((qq, i) => { if (answers[i] === qq.correct) correct++; });
    return Math.round((correct / total) * 100);
  }, [answers, total]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (window.fbReady && score >= passMark) {
        await recordCompletion(course, score);
        await recordActivity(`Passed assessment for "${course.title}" with ${score}%`, course.id);
      } else if (window.fbReady) {
        await recordActivity(`Attempted assessment for "${course.title}" — ${score}%`, course.id);
      }
    } catch (err) {
      console.error("recordCompletion:", err);
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  if (submitted) {
    const passed = score >= passMark;
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card card-pad-lg" style={{ textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999, background: passed ? "#f0f9e6" : "#fdecec",
            color: passed ? "#2e5a12" : "#a8232b", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Icon name={passed ? "trophy" : "flag"} size={32} />
          </div>
          <div className="eyebrow-sm" style={{ color: passed ? "#2e5a12" : "#a8232b" }}>
            {passed ? "You passed" : "Not quite — review and retry"}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 8px" }}>
            {score}%
          </h1>
          <div className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>
            {course.title} · {Object.values(answers).filter((a, i) => a === quiz.questions[i].correct).length} of {total} correct · {passMark}% required to pass
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn btn-ghost" onClick={goBack}>Back to course</button>
            {passed ? (
              <button className="btn btn-primary" onClick={() => goCert(course.id)}>
                View certificate <Icon name="award" size={14}/>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => { setSubmitted(false); setAnswers({}); setQIdx(0); }}>
                Retake assessment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, fontSize: 13, color: "#5f635f" }}>
        <button className="btn-icon" onClick={goBack}><Icon name="arrow-left" /></button>
        <a onClick={goBack} style={{ cursor: "pointer" }}>{course.title}</a>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: "#111", fontWeight: 600 }}>Assessment</span>
      </div>

      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="page-head__eyebrow">Assessment</div>
          <h1 className="page-head__title">{quiz.title}</h1>
          <div className="page-head__sub">Answer all {total} questions. 80% required to pass.</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#5f635f" }}>Question</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {qIdx + 1} <span style={{ color: "#b9bbb9" }}>/ {total}</span>
          </div>
        </div>
      </div>

      <div className="bar mb-6">
        <div style={{ width: `${((qIdx + 1) / total) * 100}%` }} />
      </div>

      <div className="quiz-question">
        <div className="quiz-q-num">Question {qIdx + 1} of {total}</div>
        <div className="quiz-q-text">{q.q}</div>
        {q.options.map((opt, i) => (
          <div
            key={i}
            className={classNames("quiz-option", answers[qIdx] === i && "selected")}
            onClick={() => setAnswers({ ...answers, [qIdx]: i })}
          >
            <div className="quiz-option__radio" />
            <div>{opt}</div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={qIdx === 0}
            onClick={() => setQIdx(qIdx - 1)}
            style={qIdx === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}}
          >
            <Icon name="arrow-left" size={14}/> Previous
          </button>
          {qIdx < total - 1 ? (
            <button
              className="btn btn-primary btn-sm"
              disabled={answers[qIdx] === undefined}
              onClick={() => setQIdx(qIdx + 1)}
              style={answers[qIdx] === undefined ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              Next question <Icon name="arrow-right" size={14}/>
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
              style={(!allAnswered || submitting) ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {submitting ? "Submitting…" : "Submit assessment"} <Icon name="checkb" size={14}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Certificate
// ============================================================
const CertificatePage = ({ courseId, goBack }) => {
  const course = COURSES.find(c => c.id === courseId);
  const e = ENROLLMENTS[courseId] || { completedOn: "Today", score: 95 };
  if (!course) {
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginBottom: 12 }}>
          <Icon name="arrow-left" size={12}/> Back
        </button>
        <div className="empty">Course not found.</div>
      </div>
    );
  }
  const certNo = "GIM-" + (course.id.toUpperCase().replace(/[^A-Z]/g, "")) + "-" + (1000 + Math.abs(course.id.length * 137) % 9000);
  const template = window.CERTIFICATE_TEMPLATE || CERTIFICATE_DEFAULTS;
  const PREVIEW_W = 920;
  const scale = PREVIEW_W / 1056;

  return (
    <div className="page cert-page">
      <div style={{ width: "100%", maxWidth: 920, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-ghost btn-sm" onClick={goBack}>
          <Icon name="arrow-left" size={14}/> Back
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="send" size={14}/> Email a copy</button>
          <button className="btn btn-primary btn-sm"
            onClick={() => printCertificate(template, course, CURRENT_USER.name, e.completedOn || "Today", e.score || 95, certNo)}>
            <Icon name="download" size={14}/> Download PDF
          </button>
        </div>
      </div>

      <div style={{ width: PREVIEW_W, height: 816 * scale, marginTop: 20, boxShadow: "0 16px 48px rgba(0,0,0,.18)", overflow: "hidden", background: "#fff" }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <CertificateRender
            template={template}
            course={course}
            learnerName={CURRENT_USER.name}
            completedOn={e.completedOn || "Today"}
            score={e.score || 95}
            certNo={certNo}
          />
        </div>
      </div>

      <div style={{ display: "none" }}>
        <div className="cert__eyebrow">Certificate of Completion</div>
        <div className="cert__title">Awarded with Excellence</div>

        <div className="cert__awarded">This certifies that</div>
        <div className="cert__name">{CURRENT_USER.name}</div>

        <div className="cert__forcompletion">has successfully completed all required lessons, assessments, and final evaluation for</div>
        <div className="cert__course">{course.title}</div>

        <div className="cert__footer">
          <div style={{ display: "flex", gap: 32 }}>
            <div className="cert__sig-block">
              <div className="sig">Carlos Reyes</div>
              <div>Director of Operations · GIM</div>
            </div>
            <div className="cert__sig-block">
              <div className="sig">{e.completedOn || "Today"}</div>
              <div>Date of completion</div>
            </div>
            <div className="cert__sig-block">
              <div className="sig">{e.score || 95}%</div>
              <div>Final assessment score</div>
            </div>
          </div>
          <div className="cert__seal">RENT · MANAGE · MAINTAIN</div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CoursePage, AssessmentPage, CertificatePage });
