// =========================================================
// GIM LMS — Firebase wiring (auth + Firestore live data)
// =========================================================
// Mirrors Firestore collections into the existing globals
// (COURSES, ALL_USERS, ENROLLMENTS, ASSIGNED, ACTIVITY) so
// every existing component keeps working unchanged.
// =========================================================

const _fbCfg = (window.GIM_CONFIG || {}).firebaseConfig || null;
const fbReady = !!(_fbCfg && _fbCfg.projectId && typeof firebase !== "undefined");

if (fbReady && !firebase.apps.length) {
  firebase.initializeApp(_fbCfg);
}

const fbAuth = fbReady ? firebase.auth() : null;
const fbDb   = fbReady ? firebase.firestore() : null;

// Exchange the Google Identity Services JWT for a Firebase Auth session.
const signIntoFirebase = (googleIdToken) => {
  if (!fbReady) return Promise.resolve(null);
  const cred = firebase.auth.GoogleAuthProvider.credential(googleIdToken);
  return fbAuth.signInWithCredential(cred).then(r => r.user);
};

// Create or update /users/{uid} on every sign-in.
const upsertUserDoc = async (firebaseUser, gisProfile) => {
  if (!fbReady) return null;
  const ref = fbDb.collection("users").doc(firebaseUser.uid);
  const snap = await ref.get();

  const adminEmails = (window.GIM_CONFIG || {}).adminEmails || [];
  const managerEmails = (window.GIM_CONFIG || {}).managerEmails || [];
  const email = firebaseUser.email || gisProfile?.email || "";
  const inheritsAdmin = adminEmails.length === 0 || adminEmails.includes(email);
  const inheritsManager = managerEmails.length === 0 || managerEmails.includes(email) || inheritsAdmin;

  const volatile = {
    name: firebaseUser.displayName || gisProfile?.name || email,
    email,
    photoURL: firebaseUser.photoURL || gisProfile?.picture || null,
    lastSignInAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (snap.exists) {
    await ref.set(volatile, { merge: true });
    return { id: snap.id, ...snap.data(), ...volatile };
  }

  const newDoc = {
    ...volatile,
    role: inheritsAdmin ? "Admin" : "Learner",
    dept: "",
    status: "active",
    isAdmin: inheritsAdmin,
    isManager: inheritsManager,
    adminSource: inheritsAdmin ? "google" : null,
    assigned: 0, completed: 0, due: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(newDoc);
  return { id: firebaseUser.uid, ...newDoc };
};

// Set up Firestore listeners and mirror into the existing globals.
// onChange() fires after each snapshot so the React app re-renders.
const subscribeToData = (onChange) => {
  if (!fbReady || !fbAuth.currentUser) { onChange(); return () => {}; }
  const uid = fbAuth.currentUser.uid;

  const setArr = (arr, items) => { arr.length = 0; arr.push(...items); };
  const setObj = (obj, src) => { for (const k of Object.keys(obj)) delete obj[k]; Object.assign(obj, src); };

  const subs = [];

  subs.push(fbDb.collection("courses").onSnapshot(s => {
    setArr(COURSES, s.docs.map(d => ({ id: d.id, ...d.data() })));
    onChange();
  }, err => console.error("courses listener:", err)));

  subs.push(fbDb.collection("users").onSnapshot(s => {
    setArr(ALL_USERS, s.docs.map(d => {
      const data = d.data();
      return { ...data, id: d.id, name: data.name || d.id };
    }));
    onChange();
  }, err => console.error("users listener:", err)));

  subs.push(fbDb.collection("enrollments").where("userId", "==", uid).onSnapshot(s => {
    const map = {};
    const assigned = [];
    s.docs.forEach(d => {
      const e = { id: d.id, ...d.data() };
      // Live-compute days remaining at read time
      const computed = daysUntilDue(e);
      e.dueDays = computed; // overwrite/derive for downstream consumers
      map[e.courseId] = e;
      if (e.status === "assigned") {
        assigned.push({ id: e.courseId, dueDays: computed, required: !!e.required });
      }
    });
    setObj(ENROLLMENTS, map);
    setArr(ASSIGNED, assigned);
    onChange();
  }, err => console.error("enrollments listener:", err)));

  // Mirror every enrollment doc + maintain per-course counts (admin views)
  subs.push(fbDb.collection("enrollments").onSnapshot(s => {
    const counts = {};
    const all = [];
    s.docs.forEach(d => {
      const e = { id: d.id, ...d.data() };
      // Live-compute dueDays from dueAt so countdowns stay accurate
      e.dueDays = daysUntilDue(e);
      all.push(e);
      if (e.courseId) counts[e.courseId] = (counts[e.courseId] || 0) + 1;
    });
    setObj(ENROLLMENT_COUNTS, counts);
    setArr(ALL_ENROLLMENTS, all);
    onChange();
  }, err => {
    if (err.code !== "permission-denied") console.error("all enrollments listener:", err);
  }));

  subs.push(fbDb.collection("departments").onSnapshot(s => {
    const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
    arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setArr(DEPARTMENT_DOCS, arr);
    onChange();
  }, err => {
    if (err.code !== "permission-denied") console.error("departments listener:", err);
  }));

  subs.push(fbDb.collection("roles").onSnapshot(s => {
    setArr(ROLE_DOCS, s.docs.map(d => ({ id: d.id, ...d.data() })));
    onChange();
  }, err => {
    if (err.code !== "permission-denied") console.error("roles listener:", err);
  }));

  subs.push(fbDb.collection("assessments").onSnapshot(s => {
    setArr(ASSESSMENTS, s.docs.map(d => ({ id: d.id, ...d.data() })));
    onChange();
  }, err => {
    if (err.code !== "permission-denied") console.error("assessments listener:", err);
  }));

  // Attempts listener — admins see everything, learners only see their own.
  // Surface permission errors so the admin can fix Firestore rules instead of
  // silently showing an empty queue.
  subs.push(fbDb.collection("attempts").onSnapshot(s => {
    setArr(ATTEMPTS, s.docs.map(d => ({ id: d.id, ...d.data() })));
    onChange();
  }, err => {
    console.error("attempts listener:", err.code, err.message);
    if (err.code === "permission-denied" && window.CURRENT_USER?.isAdmin) {
      console.warn("[GIM] Admin can't read /attempts. Update Firestore rules to allow admins to list attempts:\n" +
        "match /attempts/{id} {\n  allow read: if request.auth != null;\n  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;\n  allow update: if request.auth != null;\n}");
    }
  }));

  // Certificate template — single doc at /settings/certificate
  subs.push(fbDb.collection("settings").doc("certificate").onSnapshot(d => {
    if (d.exists) {
      window.CERTIFICATE_TEMPLATE = { ...(window.CERTIFICATE_DEFAULTS || {}), ...d.data() };
      onChange();
    }
  }, err => {
    if (err.code !== "permission-denied") console.error("certificate settings listener:", err);
  }));

  // Client-side sort avoids needing a composite (userId, createdAt) index
  subs.push(fbDb.collection("activity")
    .where("userId", "==", uid)
    .limit(50)
    .onSnapshot(s => {
      const rows = s.docs.map(d => d.data());
      rows.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? a.createdAt?.toMillis?.() / 1000 ?? 0;
        const tb = b.createdAt?.seconds ?? b.createdAt?.toMillis?.() / 1000 ?? 0;
        return tb - ta;
      });
      setArr(ACTIVITY, rows.slice(0, 8));
      onChange();
    }, err => {
      if (err.code !== "permission-denied") console.error("activity listener:", err);
    }));

  subs.push(fbDb.collection("activity")
    .limit(500)
    .onSnapshot(s => {
      const rows = s.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? a.createdAt?.toMillis?.() / 1000 ?? 0;
        const tb = b.createdAt?.seconds ?? b.createdAt?.toMillis?.() / 1000 ?? 0;
        return tb - ta;
      });
      setArr(ALL_ACTIVITY, rows);
      onChange();
    }, err => {
      if (err.code !== "permission-denied") console.error("all activity listener:", err);
    }));

  subs.push(fbDb.collection("adminActivity")
    .limit(500)
    .onSnapshot(s => {
      const rows = s.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? a.createdAt?.toMillis?.() / 1000 ?? 0;
        const tb = b.createdAt?.seconds ?? b.createdAt?.toMillis?.() / 1000 ?? 0;
        return tb - ta;
      });
      setArr(ADMIN_ACTIVITY, rows);
      onChange();
    }, err => {
      if (err.code !== "permission-denied") console.error("admin activity listener:", err);
    }));

  return () => subs.forEach(fn => fn());
};

// Hydrate CURRENT_USER from an existing Firebase session (returning visitor)
const hydrateUserFromFirebase = async (fbUser) => {
  if (!fbReady || !fbUser) return;
  let u = {};
  try {
    const snap = await fbDb.collection("users").doc(fbUser.uid).get();
    if (snap.exists) u = snap.data();
  } catch (e) { console.error("hydrate user:", e); }
  const name = u.name || fbUser.displayName || fbUser.email || "";
  Object.assign(window.CURRENT_USER, {
    uid: fbUser.uid,
    name,
    email: fbUser.email || u.email || "",
    initials: name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase(),
    picture: u.photoURL || fbUser.photoURL || null,
    isAdmin: !!u.isAdmin,
    isManager: !!u.isManager || !!u.isAdmin,
    role: u.role || "Learner",
    dept: u.dept || "",
  });
};

// ---- Generic field updates ------------------------------------------------
const updateUser = async (uid, fields) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("users").doc(uid).set(fields, { merge: true });
  if (window.CURRENT_USER?.isAdmin) {
    recordAdminActivity("Updated user", { targetUserId: uid, fields: Object.keys(fields || {}).join(", ") }).catch(() => {});
  }
};

// ---- Activity log ---------------------------------------------------------
const recordActivity = (text, courseId, extra = {}) => {
  if (!fbReady || !fbAuth.currentUser) return Promise.resolve();
  return fbDb.collection("activity").add({
    userId: fbAuth.currentUser.uid,
    text,
    courseId: courseId || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    ...extra,
  });
};

const recordAdminActivity = (action, extra = {}) => {
  if (!fbReady || !fbAuth.currentUser) return Promise.resolve();
  return fbDb.collection("adminActivity").add({
    actorId: fbAuth.currentUser.uid,
    actorName: window.CURRENT_USER?.name || "",
    actorEmail: window.CURRENT_USER?.email || "",
    action,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    ...extra,
  });
};

// ---- Enrollment progress --------------------------------------------------
const enrollmentDocRef = (courseId, uid = fbAuth.currentUser?.uid) => {
  if (!uid) throw new Error("Not signed in");
  return fbDb.collection("enrollments").doc(`${uid}_${courseId}`);
};

// Self-enroll the current user in a course (idempotent)
const enrollSelf = async (courseId) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const ref = enrollmentDocRef(courseId);
  const snap = await ref.get();
  if (snap.exists) return ref.id;
  await ref.set({
    userId: fbAuth.currentUser.uid,
    courseId,
    status: "in_progress",
    progress: 0,
    completedLessons: [],
    assignedAt: firebase.firestore.FieldValue.serverTimestamp(),
    startedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

// Mark a single lesson complete; recomputes progress against the course
const markLessonComplete = async (course, lessonId, userId = fbAuth.currentUser?.uid) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const ref = enrollmentDocRef(course.id, userId);
  const snap = await ref.get();
  const totalLessons = (course.sections || course.modules || [])
    .reduce((s, sec) => s + (sec.lessons?.length || 0), 0) || 1;

  const existing = snap.exists ? snap.data() : {};
  const completedLessons = Array.from(new Set([...(existing.completedLessons || []), lessonId]));
  const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));

  await ref.set({
    userId,
    courseId: course.id,
    completedLessons,
    progress,
    currentLessonId: lessonId,
    lastLesson: lessonId,
    status: progress >= 100 ? "completed" : "in_progress",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    ...(progress >= 100 && !existing.completedOn ? {
      completedOn: firebase.firestore.FieldValue.serverTimestamp(),
    } : {}),
  }, { merge: true });
};

// Record assessment completion (called from AssessmentPage on pass)
const recordCompletion = async (course, score, userId = fbAuth.currentUser?.uid) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const ref = enrollmentDocRef(course.id, userId);
  await ref.set({
    userId,
    courseId: course.id,
    status: "completed",
    progress: 100,
    score,
    completedOn: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

// Wipe all enrollments for a user (admin-only)
const resetUserProgress = async (userId) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const snap = await fbDb.collection("enrollments").where("userId", "==", userId).get();
  const batch = fbDb.batch();
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  recordAdminActivity("Reset user progress", { targetUserId: userId, count: snap.size }).catch(() => {});
  return snap.size;
};

// ---- Departments ----------------------------------------------------------
const saveDepartment = async (dept) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = dept;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (id) {
    await fbDb.collection("departments").doc(id).set(data, { merge: true });
    recordAdminActivity("Updated department", { departmentId: id, name: data.name || "" }).catch(() => {});
    return id;
  }
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await fbDb.collection("departments").add(data);
  recordAdminActivity("Created department", { departmentId: ref.id, name: data.name || "" }).catch(() => {});
  return ref.id;
};

const deleteDepartment = async (id) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("departments").doc(id).delete();
  recordAdminActivity("Deleted department", { departmentId: id }).catch(() => {});
};

// ---- Roles ----------------------------------------------------------------
const saveRole = async (role) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = role;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (id) {
    await fbDb.collection("roles").doc(id).set(data, { merge: true });
    recordAdminActivity("Updated role", { roleId: id, name: data.name || "" }).catch(() => {});
    return id;
  }
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await fbDb.collection("roles").add(data);
  recordAdminActivity("Created role", { roleId: ref.id, name: data.name || "" }).catch(() => {});
  return ref.id;
};

const deleteRole = async (id) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("roles").doc(id).delete();
  recordAdminActivity("Deleted role", { roleId: id }).catch(() => {});
};

// ---- Assessments ----------------------------------------------------------
const saveAssessment = async (a) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = a;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (id) {
    await fbDb.collection("assessments").doc(id).set(data, { merge: true });
    recordAdminActivity("Updated assessment", { assessmentId: id, title: data.title || "", status: data.status || "" }).catch(() => {});
    return id;
  }
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  if (window.CURRENT_USER?.uid) data.createdBy = window.CURRENT_USER.uid;
  const ref = await fbDb.collection("assessments").add(data);
  recordAdminActivity("Created assessment", { assessmentId: ref.id, title: data.title || "", type: data.type || "" }).catch(() => {});
  return ref.id;
};

const deleteAssessment = async (id) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("assessments").doc(id).delete();
  recordAdminActivity("Deleted assessment", { assessmentId: id }).catch(() => {});
};

const archiveAssessment = async (id) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("assessments").doc(id).set({ status: "archived" }, { merge: true });
  recordAdminActivity("Archived assessment", { assessmentId: id }).catch(() => {});
};

// ---- Certificate template -------------------------------------------------
const saveCertificateTemplate = async (template) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("settings").doc("certificate").set(template, { merge: true });
  recordAdminActivity("Updated certificate template").catch(() => {});
};

// ---- Bulk training assignment --------------------------------------------
// payload = { userIds:[], courseIds:[], dueDays?, required? }
const assignTraining = async ({ userIds, courseIds, dueDays, required }) => {
  if (!fbReady) throw new Error("Firebase not configured");
  if (!userIds?.length || !courseIds?.length) return 0;
  const batch = fbDb.batch();
  const now = firebase.firestore.FieldValue.serverTimestamp();
  // Compute an absolute due timestamp at assignment time so the countdown ticks
  const dueAt = (dueDays != null)
    ? firebase.firestore.Timestamp.fromMillis(Date.now() + dueDays * 86400000)
    : null;
  let n = 0;
  for (const uid of userIds) {
    for (const cid of courseIds) {
      const ref = fbDb.collection("enrollments").doc(`${uid}_${cid}`);
      batch.set(ref, {
        userId: uid,
        courseId: cid,
        status: "assigned",
        progress: 0,
        dueAt: dueAt,
        required: !!required,
        assignedBy: window.CURRENT_USER?.uid || null,
        assignedAt: now,
      }, { merge: true });
      n++;
    }
  }
  await batch.commit();
  recordAdminActivity("Assigned training", { userCount: userIds.length, courseCount: courseIds.length, required: !!required }).catch(() => {});
  return n;
};

// Compute "days remaining until due" from an enrollment doc.
// Prefers absolute dueAt timestamp; falls back to legacy dueDays field.
const daysUntilDue = (e) => {
  if (e?.dueAt?.toDate) {
    return Math.ceil((e.dueAt.toDate().getTime() - Date.now()) / 86400000);
  }
  if (typeof e?.dueDays === "number") return e.dueDays;
  return null;
};

// ---- Course CRUD ----------------------------------------------------------
const saveCourse = async (course) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = course;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (window.CURRENT_USER?.uid) data.updatedBy = window.CURRENT_USER.uid;

  if (!id || id === "new") {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    if (window.CURRENT_USER?.uid) data.createdBy = window.CURRENT_USER.uid;
    const ref = await fbDb.collection("courses").add(data);
    recordAdminActivity("Created course", { courseId: ref.id, title: data.title || "", status: data.status || "" }).catch(() => {});
    return ref.id;
  }
  await fbDb.collection("courses").doc(id).set(data, { merge: true });
  recordAdminActivity("Updated course", { courseId: id, title: data.title || "", status: data.status || "" }).catch(() => {});
  return id;
};

const archiveCourse = async (id) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("courses").doc(id).set({ status: "archived" }, { merge: true });
  recordAdminActivity("Archived course", { courseId: id }).catch(() => {});
};

const duplicateCourse = async (sourceId) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const snap = await fbDb.collection("courses").doc(sourceId).get();
  if (!snap.exists) throw new Error("Source course not found");
  const { id, createdAt, updatedAt, ...data } = snap.data();
  data.title = `Copy of ${data.title || "Untitled"}`;
  data.status = "draft";
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (window.CURRENT_USER?.uid) data.createdBy = window.CURRENT_USER.uid;
  const ref = await fbDb.collection("courses").add(data);
  recordAdminActivity("Duplicated course", { sourceCourseId: sourceId, courseId: ref.id, title: data.title || "" }).catch(() => {});
  return ref.id;
};

const deleteCourse = async (id) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("courses").doc(id).delete();
  recordAdminActivity("Deleted course", { courseId: id }).catch(() => {});
};

// ---- Lesson time tracking -------------------------------------------------
// Adds `seconds` to enrollment.timeSpent[lessonId] using a Firestore atomic
// increment so concurrent ticks don't clobber each other.
const addLessonTime = async (courseId, lessonId, seconds) => {
  if (!fbReady || !fbAuth.currentUser || !lessonId || !seconds || seconds < 1) return;
  const ref = fbDb.collection("enrollments").doc(`${fbAuth.currentUser.uid}_${courseId}`);
  await ref.set({
    userId: fbAuth.currentUser.uid,
    courseId,
    timeSpent: { [lessonId]: firebase.firestore.FieldValue.increment(seconds) },
    totalSeconds: firebase.firestore.FieldValue.increment(seconds),
    lastActivityAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

// ---- Quiz attempts ---------------------------------------------------------
// Every assessment submission writes an /attempts doc with answers + scores.
// payload = { courseId, assessmentId?, lessonId?, answers, autoScore, total, passMark, manualPending? }
const recordAttempt = async ({ courseId, assessmentId, lessonId, answers, autoScore, total, passMark, manualPending }) => {
  if (!fbReady || !fbAuth.currentUser) throw new Error("Not signed in");
  const doc = {
    userId: fbAuth.currentUser.uid,
    userName: window.CURRENT_USER?.name || "",
    userEmail: window.CURRENT_USER?.email || "",
    courseId,
    assessmentId: assessmentId || null,
    lessonId: lessonId || null,
    answers: answers || {},
    autoScore: autoScore ?? null,
    total: total ?? null,
    passMark: passMark ?? null,
    finalScore: manualPending ? null : autoScore,
    passed: manualPending ? null : (autoScore != null && passMark != null && autoScore >= passMark),
    status: manualPending ? "pending_review" : "graded",
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await fbDb.collection("attempts").add(doc);
  return { id: ref.id, ...doc };
};

// Admin grades a pending attempt and finalises it
const gradeAttempt = async (attemptId, { manualScores, finalScore, passed, gradedNotes }) => {
  if (!fbReady) throw new Error("Firebase not configured");
  await fbDb.collection("attempts").doc(attemptId).set({
    manualScores: manualScores || {},
    finalScore,
    passed,
    gradedNotes: gradedNotes || "",
    status: "graded",
    gradedBy: window.CURRENT_USER?.uid || null,
    gradedByName: window.CURRENT_USER?.name || "",
    gradedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  recordAdminActivity("Graded attempt", { attemptId, finalScore, passed: passed === true ? "yes" : passed === false ? "no" : "" }).catch(() => {});
};

// ---- Image upload (Firebase Storage) --------------------------------------
const uploadImage = async (file, pathPrefix = "covers") => {
  if (!fbReady) throw new Error("Firebase not configured");
  if (typeof firebase.storage !== "function") throw new Error("Storage SDK not loaded");
  const storage = firebase.storage();
  const ext = (file.name || "").split(".").pop() || "bin";
  const id = `${pathPrefix}/${fbAuth.currentUser?.uid || "anon"}_${Date.now()}.${ext}`;
  const ref = storage.ref(id);

  // Race upload against a 30s timeout so a stuck upload surfaces a clear error
  // rather than spinning forever (typically caused by missing Storage rules
  // or Firebase Storage not being enabled in the project).
  const uploadPromise = ref.put(file).then(snap => snap.ref.getDownloadURL());
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(
      "Upload timed out after 30s. Likely causes:\n" +
      "1. Firebase Storage isn't enabled — go to Firebase Console → Storage → Get started.\n" +
      "2. Storage security rules block writes — see the rules block in the README.\n" +
      "3. The Storage bucket name in firebaseConfig doesn't match the active bucket."
    )), 30000);
  });

  return Promise.race([uploadPromise, timeoutPromise]);
};

// ---- Email reminders (Google Apps Script web app) ------------------------
// Posts to the deployed Apps Script /exec URL. Uses a "simple" request
// (text/plain body) so the browser doesn't trigger a CORS preflight.
const sendEmailReminder = async ({ recipients, subject, message, course, dueDate }) => {
  const url = (window.GIM_CONFIG || {}).appsScriptReminderUrl;
  if (!url) throw new Error("Email reminders aren't configured. Add the Apps Script URL to GIM_CONFIG.appsScriptReminderUrl.");
  if (!recipients?.length) throw new Error("No recipients.");

  const payload = {
    recipients,
    subject: subject || (course ? `Reminder: ${course}` : "GIM Learning reminder"),
    message: message || "",
    course: course || "",
    dueDate: dueDate || "",
    sentBy: window.CURRENT_USER?.email || "",
    sentByName: window.CURRENT_USER?.name || "",
    secret: (window.GIM_CONFIG || {}).appsScriptSecret || "",
  };

  let resp;
  try {
    resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
    });
  } catch (netErr) {
    throw new Error(`Network error: ${netErr.message}. Check the Apps Script URL and that the deployment is set to "Anyone" access (not "Anyone in organisation").`);
  }
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); }
  catch {
    // Apps Script returned HTML — usually a "Sign in" page when the deployment
    // requires authenticated access. Tell the admin exactly what to fix.
    if (/<html|<!doctype/i.test(text)) {
      throw new Error('Apps Script returned an HTML page instead of JSON. Re-deploy the Web App with "Who has access: Anyone" (the secret check protects it). Manage deployments in Apps Script → Deploy → Manage deployments.');
    }
    throw new Error(`Bad response from Apps Script: ${text.slice(0, 200)}`);
  }
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
  if (data.error) throw new Error(data.error);
  return data; // { sent: number, errors: [...] }
};

const signOutEverywhere = async () => {
  if (window.google?.accounts?.id) {
    try { google.accounts.id.disableAutoSelect(); } catch {}
  }
  if (fbReady) await fbAuth.signOut();
};

Object.assign(window, {
  fbReady, fbAuth, fbDb,
  signIntoFirebase, upsertUserDoc, subscribeToData,
  hydrateUserFromFirebase,
  saveCourse, archiveCourse, deleteCourse, duplicateCourse,
  saveDepartment, deleteDepartment,
  saveRole, deleteRole,
  saveAssessment, archiveAssessment, deleteAssessment,
  saveCertificateTemplate,
  assignTraining, daysUntilDue, updateUser, resetUserProgress,
  enrollSelf, markLessonComplete, recordCompletion, recordActivity, recordAdminActivity,
  addLessonTime, recordAttempt, gradeAttempt,
  uploadImage,
  sendEmailReminder,
  signOutEverywhere,
});
