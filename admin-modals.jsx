// =========================================================
// GIM LMS — Admin modals: New Assessment, Department editor,
//          Role editor
// =========================================================

// ---------- Shared form bits ----------
const FieldLabel = ({ children, hint, required }) => (
  <div style={{ marginBottom: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
      {children} {required && <span style={{ color: "#a8232b" }}>*</span>}
    </label>
    {hint && <div style={{ fontSize: 11, color: "#5f635f", marginTop: 2 }}>{hint}</div>}
  </div>
);

const TextInput = (props) => (
  <input {...props} style={{
    width: "100%", padding: "9px 12px", border: "1px solid #d8d9d8",
    borderRadius: 8, fontSize: 13, fontFamily: "inherit",
    background: "#fff", ...(props.style || {}),
  }} />
);

const TextArea = (props) => (
  <textarea {...props} style={{
    width: "100%", padding: "9px 12px", border: "1px solid #d8d9d8",
    borderRadius: 8, fontSize: 13, fontFamily: "inherit",
    background: "#fff", resize: "vertical", minHeight: 70, ...(props.style || {}),
  }} />
);

const SelectInput = (props) => (
  <select {...props} style={{
    width: "100%", padding: "9px 12px", border: "1px solid #d8d9d8",
    borderRadius: 8, fontSize: 13, fontFamily: "inherit",
    background: "#fff", appearance: "none",
    backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="%235f635f" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>\')',
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
    ...(props.style || {}),
  }}>
    {props.children}
  </select>
);

// ---------- Stepper header (Modal sub-component) ----------
const Stepper = ({ step, steps }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
    {steps.map((s, i) => {
      const idx = i + 1;
      const active = step === idx;
      const done = step > idx;
      return (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 999, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? "#7ac142" : active ? "#111" : "#ececec",
              color: done || active ? "#fff" : "#5f635f",
            }}>
              {done ? <Icon name="check" size={12}/> : idx}
            </div>
            <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#111" : "#5f635f" }}>{s}</div>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: "#ececec" }} />}
        </React.Fragment>
      );
    })}
  </div>
);

// ============================================================
// New Assessment modal — 4 steps
// ============================================================
const NewAssessmentModal = ({ open, onClose, initial }) => {
  // initial may be: null/{} (brand new) | { courseId, title, ... } (prefilled new) | { id, ... } (edit)
  const isEdit = !!(initial && initial.id);
  const [step, setStep] = React.useState(1);

  // Step 1: Details
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [courseId, setCourseId] = React.useState("");
  const [type, setType] = React.useState("final");

  // Step 2: Questions
  const [questions, setQuestions] = React.useState([]);
  const [editingQ, setEditingQ] = React.useState(null); // index or "new"

  // Step 3: Settings
  const [passMark, setPassMark] = React.useState(80);
  const [attemptsAllowed, setAttemptsAllowed] = React.useState("3");
  const [timeLimit, setTimeLimit] = React.useState("none");
  const [timeLimitMin, setTimeLimitMin] = React.useState(30);
  const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
  const [showAnswers, setShowAnswers] = React.useState("after-pass");
  const [certOnPass, setCertOnPass] = React.useState(true);

  // Reset / hydrate on open
  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setEditingQ(null);
    if (initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setCourseId(initial.courseId || "");
      setType(initial.type || "final");
      setQuestions(initial.questions || []);
      setPassMark(initial.passMark || 80);
      setAttemptsAllowed(initial.attemptsAllowed === null || initial.attemptsAllowed === undefined
        ? "unlimited" : String(initial.attemptsAllowed));
      setTimeLimit(initial.timeLimit ? "limit" : "none");
      setTimeLimitMin(initial.timeLimit || 30);
      setShuffleQuestions(initial.shuffleQuestions !== false);
      setShowAnswers(initial.showAnswers || "after-pass");
      setCertOnPass(initial.certOnPass !== false);
    } else {
      setTitle(""); setDescription(""); setCourseId(""); setType("final");
      setQuestions([]);
      setPassMark(80); setAttemptsAllowed("3"); setTimeLimit("none"); setTimeLimitMin(30);
      setShuffleQuestions(true); setShowAnswers("after-pass"); setCertOnPass(true);
    }
  }, [open, initial]);

  const valid1 = title.trim().length > 0 && courseId;
  const valid2 = questions.length >= 1;
  const [submitting, setSubmitting] = React.useState(false);

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const submit = async () => {
    if (submitting) return;
    if (!window.fbReady) { alert("Firebase isn't configured — can't save."); return; }
    setSubmitting(true);
    try {
      await saveAssessment({
        id: initial?.id,
        title: title.trim(),
        description: description.trim(),
        courseId,
        type,
        passMark,
        attemptsAllowed: attemptsAllowed === "unlimited" ? null : parseInt(attemptsAllowed, 10),
        timeLimit: timeLimit === "none" ? null : timeLimitMin,
        shuffleQuestions,
        showAnswers,
        certOnPass,
        questions,
        status: initial?.status || "published",
      });
      showToast?.(isEdit ? `Assessment "${title}" updated` : `Assessment "${title}" created`);
      onClose();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally { setSubmitting(false); }
  };

  const upsertQuestion = (q) => {
    if (editingQ === "new") setQuestions(p => [...p, q]);
    else setQuestions(p => p.map((x, i) => i === editingQ ? q : x));
    setEditingQ(null);
  };
  const removeQuestion = (i) => setQuestions(p => p.filter((_, idx) => idx !== i));

  return (
    <Modal open={open} onClose={onClose} width={780}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ececec" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow-sm">Admin · Assessments</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{isEdit ? "Edit assessment" : "New assessment"}</div>
          </div>
          <button className="btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <Stepper step={step} steps={["Details", "Questions", "Settings", "Review"]} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
            <div>
              <FieldLabel required>Assessment title</FieldLabel>
              <TextInput
                placeholder="e.g. Fair Housing Final Exam"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel hint="Shown to learners before they begin.">Description</FieldLabel>
              <TextArea
                placeholder="Brief overview of what this assessment covers…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <FieldLabel required>Linked course</FieldLabel>
                <SelectInput value={courseId} onChange={e => setCourseId(e.target.value)}>
                  <option value="">Select a course…</option>
                  {COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </SelectInput>
              </div>
              <div>
                <FieldLabel>Type</FieldLabel>
                <SelectInput value={type} onChange={e => setType(e.target.value)}>
                  <option value="quiz">Quiz (lesson check, ungraded)</option>
                  <option value="final">Final exam (required to complete course)</option>
                  <option value="cert">Certification exam (with certificate)</option>
                </SelectInput>
              </div>
            </div>

          </div>
        )}

        {step === 2 && (
          <QuestionsStep
            questions={questions}
            removeQuestion={removeQuestion}
            editingQ={editingQ}
            setEditingQ={setEditingQ}
            upsertQuestion={upsertQuestion}
          />
        )}

        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel hint="Score required to pass.">Pass mark</FieldLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="range" min={50} max={100} step={5} value={passMark}
                  onChange={e => setPassMark(parseInt(e.target.value))}
                  style={{ flex: 1 }}/>
                <div style={{ width: 60, fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 16 }}>{passMark}%</div>
              </div>
            </div>

            <div>
              <FieldLabel hint="How many tries before learner is blocked.">Attempts allowed</FieldLabel>
              <SelectInput value={attemptsAllowed} onChange={e => setAttemptsAllowed(e.target.value)}>
                <option value="1">1 attempt</option>
                <option value="2">2 attempts</option>
                <option value="3">3 attempts</option>
                <option value="unlimited">Unlimited</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel>Time limit</FieldLabel>
              <SelectInput value={timeLimit} onChange={e => setTimeLimit(e.target.value)}>
                <option value="none">No time limit</option>
                <option value="custom">Custom limit…</option>
              </SelectInput>
              {timeLimit === "custom" && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" min={5} max={300} value={timeLimitMin}
                    onChange={e => setTimeLimitMin(parseInt(e.target.value) || 0)}
                    style={{ width: 80, padding: "7px 10px", border: "1px solid #d8d9d8", borderRadius: 8, fontSize: 13 }}/>
                  <span style={{ fontSize: 12, color: "#5f635f" }}>minutes</span>
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Show correct answers</FieldLabel>
              <SelectInput value={showAnswers} onChange={e => setShowAnswers(e.target.value)}>
                <option value="never">Never</option>
                <option value="after-pass">After learner passes</option>
                <option value="after-attempt">After every attempt</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel>Question order</FieldLabel>
              <SelectInput value={shuffleQuestions ? "shuffle" : "fixed"} onChange={e => setShuffleQuestions(e.target.value === "shuffle")}>
                <option value="fixed">Fixed order</option>
                <option value="shuffle">Shuffle each attempt</option>
              </SelectInput>
            </div>

            <div style={{ gridColumn: "1 / -1", padding: 14, border: "1px solid #ececec", borderRadius: 10, background: "#fafafa" }}>
              <label style={{ display: "flex", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={certOnPass} onChange={e => setCertOnPass(e.target.checked)} style={{ marginTop: 2 }}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Issue certificate on pass</div>
                  <div style={{ fontSize: 12, color: "#5f635f", marginTop: 2 }}>
                    Learners passing this assessment get a certificate with their name, score,
                    pass date, and a verification ID. Recommended for any compliance training.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <ReviewStep
            title={title}
            description={description}
            type={type}
            courseTitle={COURSES.find(c => c.id === courseId)?.title || "—"}
            questions={questions}
            passMark={passMark}
            attemptsAllowed={attemptsAllowed}
            timeLimit={timeLimit}
            timeLimitMin={timeLimitMin}
            shuffleQuestions={shuffleQuestions}
            showAnswers={showAnswers}
            certOnPass={certOnPass}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
        <div style={{ fontSize: 12, color: "#5f635f" }}>
          Step {step} of 4
          {step === 2 && questions.length > 0 && <span> · {questions.length} {questions.length === 1 ? "question" : "questions"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {step > 1 && <button className="btn btn-ghost btn-sm" onClick={back}>Back</button>}
          {step < 4 && (
            <button className="btn btn-primary btn-sm"
              disabled={(step === 1 && !valid1) || (step === 2 && !valid2)}
              onClick={next}
              style={{ opacity: ((step === 1 && !valid1) || (step === 2 && !valid2)) ? 0.5 : 1, cursor: ((step === 1 && !valid1) || (step === 2 && !valid2)) ? "not-allowed" : "pointer" }}>
              Next
            </button>
          )}
          {step === 4 && (
            <>
              <button className="btn btn-ghost btn-sm" disabled={submitting} onClick={async () => {
                if (submitting) return;
                if (!window.fbReady) { alert("Firebase isn't configured — can't save."); return; }
                try {
                  await saveAssessment({
                    title: title.trim(), description: description.trim(),
                    courseId, type, passMark,
                    attemptsAllowed: attemptsAllowed === "unlimited" ? null : parseInt(attemptsAllowed, 10),
                    timeLimit: timeLimit === "none" ? null : timeLimitMin,
                    shuffleQuestions, showAnswers, certOnPass,
                    questions, status: "draft",
                  });
                  showToast?.("Saved as draft");
                  onClose();
                } catch (err) { alert("Save failed: " + err.message); }
              }}>Save as draft</button>
              <button className="btn btn-primary btn-sm" onClick={submit} disabled={submitting}>
                {submitting ? "Saving…" : (isEdit ? "Save changes" : "Publish assessment")}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// QuestionsStep — list + inline editor
// ============================================================
const QuestionsStep = ({ questions, removeQuestion, editingQ, setEditingQ, upsertQuestion }) => {
  if (editingQ !== null) {
    const initial = editingQ === "new" ? null : questions[editingQ];
    return <QuestionEditor initial={initial} onSave={upsertQuestion} onCancel={() => setEditingQ(null)} />;
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Questions</div>
          <div style={{ fontSize: 12, color: "#5f635f" }}>Add at least one question. Drag to reorder.</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditingQ("new")}>
          <Icon name="plus" size={14}/> Add question
        </button>
      </div>

      {questions.length === 0 ? (
        <div style={{ padding: 32, border: "2px dashed #d8d9d8", borderRadius: 14, textAlign: "center", background: "#fafafa" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "#fff", border: "1px solid #ececec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Icon name="quiz" size={20} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No questions yet</div>
          <div style={{ fontSize: 12, color: "#5f635f", marginBottom: 14 }}>Add your first question to continue.</div>
          <button className="btn btn-primary btn-sm" onClick={() => setEditingQ("new")}>
            <Icon name="plus" size={14}/> Add first question
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {questions.map((q, i) => (
            <div key={i} style={{ padding: 14, border: "1px solid #ececec", borderRadius: 10, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#5f635f" }}>Q{i + 1}</span>
                    <span className="chip chip-grey" style={{ fontSize: 10 }}>{qTypeLabel(q.type)}</span>
                    <span style={{ fontSize: 11, color: "#5f635f" }}>{q.points || 1} pt</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, wordWrap: "break-word" }}>{q.text}</div>
                  {q.type !== "short" && q.options && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ fontSize: 11, color: q.correct.includes(oi) ? "#2e5a12" : "#5f635f", display: "flex", gap: 6 }}>
                          {q.correct.includes(oi) ? <Icon name="check" size={11}/> : <span style={{ width: 11, display: "inline-block" }}/>}
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-icon" onClick={() => setEditingQ(i)}><Icon name="edit" size={14}/></button>
                  <button className="btn-icon" onClick={() => removeQuestion(i)}><Icon name="trash" size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const qTypeLabel = (t) =>
  t === "single" ? "Single choice"
  : t === "multi" ? "Multi-select"
  : t === "tf" ? "True / False"
  : t === "short" ? "Short answer"
  : t;

// ============================================================
// QuestionEditor — single-question editor
// ============================================================
const QuestionEditor = ({ initial, onSave, onCancel }) => {
  const [type, setType] = React.useState(initial?.type || "single");
  const [text, setText] = React.useState(initial?.text || "");
  const [options, setOptions] = React.useState(initial?.options || ["", "", "", ""]);
  const [correct, setCorrect] = React.useState(initial?.correct || []);
  const [points, setPoints] = React.useState(initial?.points || 1);
  const [explanation, setExplanation] = React.useState(initial?.explanation || "");

  // Reset options when type changes
  React.useEffect(() => {
    if (type === "tf") {
      setOptions(["True", "False"]);
      setCorrect([]);
    } else if (type === "short") {
      setOptions([]);
      setCorrect([]);
    } else if (options.length === 0 || options[0] === "True") {
      setOptions(["", "", "", ""]);
      setCorrect([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const toggleCorrect = (i) => {
    if (type === "single" || type === "tf") setCorrect([i]);
    else setCorrect(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };
  const updateOption = (i, v) => setOptions(p => p.map((o, idx) => idx === i ? v : o));
  const addOption = () => setOptions(p => [...p, ""]);
  const removeOption = (i) => {
    setOptions(p => p.filter((_, idx) => idx !== i));
    setCorrect(p => p.filter(x => x !== i).map(x => x > i ? x - 1 : x));
  };

  const valid = text.trim().length > 0
    && (type === "short" || (options.filter(o => o.trim()).length >= 2 && correct.length >= 1));

  const save = () => {
    onSave({ type, text: text.trim(), options, correct, points, explanation: explanation.trim() });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button className="btn-icon" onClick={onCancel}><Icon name="chevron-right" style={{transform:"rotate(180deg)"}} size={16}/></button>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{initial ? "Edit question" : "New question"}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>Question type</FieldLabel>
          <SelectInput value={type} onChange={e => setType(e.target.value)}>
            <option value="single">Single choice (one correct)</option>
            <option value="multi">Multi-select (multiple correct)</option>
            <option value="tf">True / False</option>
            <option value="short">Short answer (manually graded)</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Points</FieldLabel>
          <input type="number" min={1} max={20} value={points}
            onChange={e => setPoints(parseInt(e.target.value) || 1)}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d8d9d8", borderRadius: 8, fontSize: 13 }}/>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel required>Question text</FieldLabel>
        <TextArea
          placeholder="Type the question…"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ minHeight: 80 }}
        />
      </div>

      {type !== "short" && (
        <div style={{ marginBottom: 14 }}>
          <FieldLabel hint={type === "multi" ? "Tap the circles to mark correct answers (multiple)." : "Tap the circle to mark the correct answer."}>
            Answer options
          </FieldLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => toggleCorrect(i)} style={{
                  width: 22, height: 22, borderRadius: 999, border: "2px solid",
                  borderColor: correct.includes(i) ? "#7ac142" : "#d8d9d8",
                  background: correct.includes(i) ? "#7ac142" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}>
                  {correct.includes(i) && <Icon name="check" size={12} color="#fff"/>}
                </button>
                <input
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  disabled={type === "tf"}
                  style={{
                    flex: 1, padding: "8px 12px", border: "1px solid #d8d9d8", borderRadius: 8,
                    fontSize: 13, fontFamily: "inherit",
                    background: type === "tf" ? "#f8f7f2" : "#fff",
                  }}
                />
                {type !== "tf" && options.length > 2 && (
                  <button className="btn-icon" onClick={() => removeOption(i)}><Icon name="trash" size={14}/></button>
                )}
              </div>
            ))}
            {type !== "tf" && options.length < 6 && (
              <button className="btn btn-ghost btn-sm" onClick={addOption} style={{ alignSelf: "flex-start", marginTop: 4 }}>
                <Icon name="plus" size={12}/> Add option
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <FieldLabel hint="Shown to learners after they answer (when feedback is enabled).">Explanation (optional)</FieldLabel>
        <TextArea
          placeholder="Explain why the correct answer is right…"
          value={explanation}
          onChange={e => setExplanation(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid}
          style={{ opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
          {initial ? "Save changes" : "Add question"}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ReviewStep
// ============================================================
const ReviewStep = ({ title, description, type, courseTitle, questions, passMark, attemptsAllowed, timeLimit, timeLimitMin, shuffleQuestions, showAnswers, certOnPass }) => {
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const Row = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f3f3f3" }}>
      <div style={{ fontSize: 12, color: "#5f635f" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value}</div>
    </div>
  );
  return (
    <div>
      <div style={{ padding: 16, background: "#f8f7f2", borderRadius: 10, marginBottom: 14 }}>
        <div className="eyebrow-sm">Review &amp; publish</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{title || "Untitled assessment"}</div>
        {description && <div style={{ fontSize: 13, color: "#5f635f", marginTop: 4, lineHeight: 1.5 }}>{description}</div>}
      </div>

      <Row label="Type" value={type === "quiz" ? "Quiz" : type === "final" ? "Final exam" : "Certification exam"} />
      <Row label="Linked course" value={courseTitle} />
      <Row label="Questions" value={`${questions.length} (${totalPoints} pts total)`} />
      <Row label="Pass mark" value={`${passMark}%`} />
      <Row label="Attempts allowed" value={attemptsAllowed === "unlimited" ? "Unlimited" : `${attemptsAllowed} ${attemptsAllowed === "1" ? "attempt" : "attempts"}`} />
      <Row label="Time limit" value={timeLimit === "none" ? "None" : `${timeLimitMin} minutes`} />
      <Row label="Question order" value={shuffleQuestions ? "Shuffle each attempt" : "Fixed order"} />
      <Row label="Show answers" value={showAnswers === "never" ? "Never" : showAnswers === "after-pass" ? "After pass" : "After every attempt"} />
      <Row label="Certificate on pass" value={certOnPass ? "Yes" : "No"} />
    </div>
  );
};

// ============================================================
// Department Editor modal
// ============================================================
const DEPT_PRESETS = [
  { icon: "house",   bg: "#f0f9e6", color: "#2e5a12", label: "Property"    },
  { icon: "wrench",  bg: "#f0f9e6", color: "#2e5a12", label: "Maintenance" },
  { icon: "tag",     bg: "#f3e8ff", color: "#5b21b6", label: "Sales / Marketing" },
  { icon: "money",   bg: "#fff7d6", color: "#8a5a00", label: "Finance"     },
  { icon: "users",   bg: "#e6f0ff", color: "#1e3a8a", label: "People"      },
  { icon: "monitor", bg: "#ffe8d6", color: "#c2410c", label: "Admin"       },
  { icon: "shield",  bg: "#fee2e2", color: "#991b1b", label: "Compliance"  },
];

const DepartmentEditModal = ({ open, onClose, initial }) => {
  const isNew = !initial;
  const [name, setName] = React.useState("");
  const [autoAssign, setAutoAssign] = React.useState(true);
  const [iconIdx, setIconIdx] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setAutoAssign(initial?.autoAssign ?? true);
    setIconIdx(initial?.iconIdx ?? 0);
  }, [open, initial]);

  const peopleCount = initial ? (ALL_USERS.filter(u => u.dept === initial.name).length) : 0;
  const valid = name.trim().length >= 2;
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    if (busy) return;
    if (!window.fbReady) { alert("Firebase isn't configured — can't save."); return; }
    setBusy(true);
    try {
      await saveDepartment({
        id: initial?.id,
        name: name.trim(),
        autoAssign,
        iconIdx,
      });
      showToast?.(`${isNew ? "Created" : "Updated"} department "${name.trim()}"`);
      onClose();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (busy) return;
    if (peopleCount > 0) {
      alert(`Cannot delete: ${peopleCount} ${peopleCount === 1 ? "person is" : "people are"} still in this department.\nReassign them first.`);
      return;
    }
    if (!confirm(`Delete department "${initial.name}"?`)) return;
    setBusy(true);
    try {
      await deleteDepartment(initial.id);
      showToast?.(`Department "${initial.name}" deleted`);
      onClose();
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ececec", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow-sm">Settings · Departments</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{isNew ? "New department" : "Edit department"}</div>
        </div>
        <button className="btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <FieldLabel required>Department name</FieldLabel>
          <TextInput
            placeholder="e.g. Property Management"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel>Icon</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {DEPT_PRESETS.map((p, i) => (
              <button key={i} onClick={() => setIconIdx(i)} title={p.label} style={{
                aspectRatio: "1 / 1", borderRadius: 10, border: "2px solid",
                borderColor: iconIdx === i ? "#7ac142" : "#ececec",
                background: p.bg, color: p.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
                <Icon name={p.icon} size={18}/>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18, padding: 14, border: "1px solid #ececec", borderRadius: 10 }}>
          <label style={{ display: "flex", gap: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={autoAssign} onChange={e => setAutoAssign(e.target.checked)} style={{ marginTop: 2 }}/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Auto-assign required courses</div>
              <div style={{ fontSize: 12, color: "#5f635f", marginTop: 2 }}>
                When someone is moved into this department, automatically enroll them in all
                courses tagged with this department's category.
              </div>
            </div>
          </label>
        </div>

        {!isNew && (
          <div style={{ padding: 14, background: "#fafafa", borderRadius: 10, border: "1px solid #ececec" }}>
            <div style={{ fontSize: 12, color: "#5f635f", marginBottom: 4 }}>Currently in this department</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{peopleCount} {peopleCount === 1 ? "person" : "people"}</div>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 24px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "space-between", background: "#fafafa" }}>
        <div>
          {!isNew && (
            <button className="btn btn-ghost btn-sm" onClick={remove} style={{ color: "#a8232b" }}>
              <Icon name="trash" size={14}/> Delete
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid}
            style={{ opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
            {isNew ? "Create department" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// Role Editor modal
// ============================================================
const ALL_PERMISSIONS = [
  { group: "Catalog", items: [
    { id: "browse",       label: "Browse course catalog" },
    { id: "take",         label: "Enroll in & take courses" },
    { id: "viewOwn",      label: "View own progress & certificates" },
  ]},
  { group: "Team & reporting", items: [
    { id: "viewTeam",     label: "View direct reports' progress" },
    { id: "remind",       label: "Send reminders to direct reports" },
    { id: "reassign",     label: "Reassign / extend due dates for direct reports" },
    { id: "viewAllUsers", label: "View ALL users' progress" },
    { id: "exportReport", label: "Export reports & CSVs" },
  ]},
  { group: "Course management", items: [
    { id: "createCourse", label: "Create & edit courses" },
    { id: "publishCourse",label: "Publish / unpublish courses" },
    { id: "manageAssess", label: "Create & edit assessments" },
  ]},
  { group: "User management", items: [
    { id: "assignAny",    label: "Assign training to any user" },
    { id: "manageRoles",  label: "Change user roles & departments" },
    { id: "deactivate",   label: "Deactivate users" },
  ]},
  { group: "Settings", items: [
    { id: "manageDepts",  label: "Manage departments" },
    { id: "manageRolesCfg", label: "Manage roles & permissions" },
  ]},
];

const ROLE_PRESETS = {
  Learner: ["browse", "take", "viewOwn"],
  Manager: ["browse", "take", "viewOwn", "viewTeam", "remind", "reassign", "exportReport"],
  Admin:   ALL_PERMISSIONS.flatMap(g => g.items.map(i => i.id)),
};

const RoleEditModal = ({ open, onClose, initial }) => {
  const isNew = !initial;
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [perms, setPerms] = React.useState([]);

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setDesc(initial?.desc || "");
    setPerms(initial?.perms || ROLE_PRESETS.Learner);
  }, [open, initial]);

  const togglePerm = (id) => setPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const valid = name.trim().length >= 2 && perms.length >= 1;
  const [busy, setBusy] = React.useState(false);

  const peopleCount = initial ? ALL_USERS.filter(u => u.role === initial.name).length : 0;

  const save = async () => {
    if (busy) return;
    if (!window.fbReady) { alert("Firebase isn't configured — can't save."); return; }
    setBusy(true);
    try {
      await saveRole({
        id: initial?.id,
        name: name.trim(),
        desc: desc.trim(),
        perms,
      });
      showToast?.(`${isNew ? "Created" : "Updated"} role "${name.trim()}"`);
      onClose();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} width={680}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ececec", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow-sm">Settings · Roles</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{isNew ? "New role" : `Edit role: ${initial.name}`}</div>
        </div>
        <button className="btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <FieldLabel required>Role name</FieldLabel>
            <TextInput
              placeholder="e.g. Department Manager"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!isNew && (initial.name === "Admin" || initial.name === "Learner")}
              title={!isNew && (initial.name === "Admin" || initial.name === "Learner") ? "Built-in role name cannot be changed" : ""}
            />
          </div>
          <div>
            <FieldLabel>Copy from</FieldLabel>
            <SelectInput value="" onChange={e => { if (e.target.value) setPerms(ROLE_PRESETS[e.target.value]); }}>
              <option value="">— Start blank or copy preset —</option>
              <option value="Learner">Learner permissions</option>
              <option value="Manager">Manager permissions</option>
              <option value="Admin">All permissions (Admin)</option>
            </SelectInput>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel>Description</FieldLabel>
          <TextArea
            placeholder="What this role is for…"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        <FieldLabel hint={`${perms.length} of ${ALL_PERMISSIONS.flatMap(g => g.items).length} permissions selected.`}>
          Permissions
        </FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ALL_PERMISSIONS.map(group => {
            const groupIds = group.items.map(i => i.id);
            const allOn = groupIds.every(id => perms.includes(id));
            const someOn = groupIds.some(id => perms.includes(id));
            const toggleGroup = () => {
              if (allOn) setPerms(p => p.filter(x => !groupIds.includes(x)));
              else setPerms(p => Array.from(new Set([...p, ...groupIds])));
            };
            return (
              <div key={group.group} style={{ border: "1px solid #ececec", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "#5f635f" }}>{group.group}</div>
                  <button onClick={toggleGroup} style={{
                    fontSize: 11, color: "#2e5a12", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600,
                  }}>
                    {allOn ? "Clear group" : someOn ? "Select all" : "Select all"}
                  </button>
                </div>
                <div style={{ padding: "4px 14px" }}>
                  {group.items.map(item => (
                    <label key={item.id} style={{ display: "flex", gap: 12, padding: "9px 0", cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}>
                      <input type="checkbox" checked={perms.includes(item.id)} onChange={() => togglePerm(item.id)} style={{ marginTop: 2 }}/>
                      <div style={{ fontSize: 13 }}>{item.label}</div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!isNew && peopleCount > 0 && (
          <div style={{ marginTop: 18, padding: 14, background: "#fff5e0", border: "1px solid #f3d999", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Icon name="shield" size={16} color="#8a5a00"/>
            <div style={{ fontSize: 12, color: "#8a5a00", lineHeight: 1.5 }}>
              <strong>{peopleCount} {peopleCount === 1 ? "person has" : "people have"} this role.</strong> Permission changes apply immediately on save.
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 24px", borderTop: "1px solid #ececec", display: "flex", justifyContent: "flex-end", gap: 8, background: "#fafafa" }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid}
          style={{ opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
          {isNew ? "Create role" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
};

Object.assign(window, { NewAssessmentModal, DepartmentEditModal, RoleEditModal, DEPT_PRESETS });
