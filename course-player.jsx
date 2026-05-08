// =========================================================
// GIM LMS — Course player + Assessment + Certificate
// =========================================================

// ============================================================
// Course player
// ============================================================
const CoursePage = ({ courseId, goBack, goAssessment }) => {
  const course = COURSES.find(c => c.id === courseId);
  const enrollment = ENROLLMENTS[courseId];

  // Build flat lesson list with section context
  const flatLessons = [];
  (course.sections || []).forEach((sec, sIdx) => {
    sec.lessons.forEach((l, lIdx) => {
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

  // Mark earlier lessons as completed
  const completedSet = React.useMemo(() => {
    const s = new Set();
    if (!course.sections) return s;
    const pct = enrollment?.progress ?? 0;
    const cnt = Math.floor((pct / 100) * flatLessons.length);
    for (let i = 0; i < cnt; i++) s.add(flatLessons[i].id);
    return s;
  }, [courseId]);
  const [completed, setCompleted] = React.useState(completedSet);

  const active = flatLessons[activeIdx] || flatLessons[0];
  const progressPct = Math.round((completed.size / Math.max(1, flatLessons.length)) * 100);

  const markDoneAndNext = () => {
    setCompleted(prev => new Set([...prev, active.id]));
    if (activeIdx < flatLessons.length - 1) setActiveIdx(activeIdx + 1);
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
                src={active.url}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={active.title}
              />
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
            {active.type === "pdf" && (
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
            <p className="text-muted mt-3" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {course.description}
            </p>

            {/* Resources */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm"><Icon name="download" size={14} /> Slides (PDF)</button>
              <button className="btn btn-ghost btn-sm"><Icon name="download" size={14} /> Transcript</button>
              <button className="btn btn-ghost btn-sm"><Icon name="external" size={14} /> Reference: MA G.L. c. 151B</button>
            </div>

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
                {active.type === "quiz" ? (
                  <button className="btn btn-primary" onClick={() => goAssessment(course.id)}>
                    Start assessment <Icon name="arrow-right" size={14}/>
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={markDoneAndNext}>
                    Mark complete & continue <Icon name="arrow-right" size={14}/>
                  </button>
                )}
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
            {(course.sections || []).map((sec, sIdx) => (
              <div className="lesson-section" key={sIdx}>
                <div className="lesson-section__title">Section {sIdx + 1} · {sec.title}</div>
                {sec.lessons.map((l, lIdx) => {
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
  const course = COURSES.find(c => c.id === courseId) || COURSES[1];
  const quiz = SAMPLE_QUIZ;
  const [answers, setAnswers] = React.useState({});
  const [qIdx, setQIdx] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);

  const total = quiz.questions.length;
  const q = quiz.questions[qIdx];
  const allAnswered = Object.keys(answers).length === total;

  const score = React.useMemo(() => {
    let correct = 0;
    quiz.questions.forEach((qq, i) => { if (answers[i] === qq.correct) correct++; });
    return Math.round((correct / total) * 100);
  }, [answers, total]);

  if (submitted) {
    const passed = score >= 80;
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
            {course.title} · {Object.values(answers).filter((a, i) => a === quiz.questions[i].correct).length} of {total} correct · 80% required to pass
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
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
              style={!allAnswered ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              Submit assessment <Icon name="checkb" size={14}/>
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
  const course = COURSES.find(c => c.id === courseId) || COURSES[0];
  const e = ENROLLMENTS[courseId] || { completedOn: "Today", score: 95 };
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
