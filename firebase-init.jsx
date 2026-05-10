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
      const e = d.data();
      map[e.courseId] = e;
      if (e.status === "assigned") {
        assigned.push({ id: e.courseId, dueDays: e.dueDays || 0, required: !!e.required });
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
    setArr(DEPARTMENT_DOCS, s.docs.map(d => ({ id: d.id, ...d.data() })));
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
const updateUser = (uid, fields) =>
  fbReady ? fbDb.collection("users").doc(uid).set(fields, { merge: true })
          : Promise.reject(new Error("Firebase not configured"));

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
const markLessonComplete = async (course, lessonId) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const ref = enrollmentDocRef(course.id);
  const snap = await ref.get();
  const totalLessons = (course.sections || course.modules || [])
    .reduce((s, sec) => s + (sec.lessons?.length || 0), 0) || 1;

  const existing = snap.exists ? snap.data() : {};
  const completedLessons = Array.from(new Set([...(existing.completedLessons || []), lessonId]));
  const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));

  await ref.set({
    userId: fbAuth.currentUser.uid,
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
const recordCompletion = async (course, score) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const ref = enrollmentDocRef(course.id);
  await ref.set({
    userId: fbAuth.currentUser.uid,
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
  return snap.size;
};

// ---- Departments ----------------------------------------------------------
const saveDepartment = async (dept) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = dept;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (id) {
    await fbDb.collection("departments").doc(id).set(data, { merge: true });
    return id;
  }
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await fbDb.collection("departments").add(data);
  return ref.id;
};

const deleteDepartment = (id) =>
  fbReady ? fbDb.collection("departments").doc(id).delete()
          : Promise.reject(new Error("Firebase not configured"));

// ---- Roles ----------------------------------------------------------------
const saveRole = async (role) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = role;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (id) {
    await fbDb.collection("roles").doc(id).set(data, { merge: true });
    return id;
  }
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await fbDb.collection("roles").add(data);
  return ref.id;
};

const deleteRole = (id) =>
  fbReady ? fbDb.collection("roles").doc(id).delete()
          : Promise.reject(new Error("Firebase not configured"));

// ---- Assessments ----------------------------------------------------------
const saveAssessment = async (a) => {
  if (!fbReady) throw new Error("Firebase not configured");
  const { id, ...data } = a;
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  if (id) {
    await fbDb.collection("assessments").doc(id).set(data, { merge: true });
    return id;
  }
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  if (window.CURRENT_USER?.uid) data.createdBy = window.CURRENT_USER.uid;
  const ref = await fbDb.collection("assessments").add(data);
  return ref.id;
};

const deleteAssessment = (id) =>
  fbReady ? fbDb.collection("assessments").doc(id).delete()
          : Promise.reject(new Error("Firebase not configured"));

const archiveAssessment = (id) =>
  fbReady ? fbDb.collection("assessments").doc(id).set({ status: "archived" }, { merge: true })
          : Promise.reject(new Error("Firebase not configured"));

// ---- Certificate template -------------------------------------------------
const saveCertificateTemplate = (template) =>
  fbReady ? fbDb.collection("settings").doc("certificate").set(template, { merge: true })
          : Promise.reject(new Error("Firebase not configured"));

// ---- Bulk training assignment --------------------------------------------
// payload = { userIds:[], courseIds:[], dueDays?, required? }
const assignTraining = async ({ userIds, courseIds, dueDays, required }) => {
  if (!fbReady) throw new Error("Firebase not configured");
  if (!userIds?.length || !courseIds?.length) return 0;
  const batch = fbDb.batch();
  const now = firebase.firestore.FieldValue.serverTimestamp();
  let n = 0;
  for (const uid of userIds) {
    for (const cid of courseIds) {
      const ref = fbDb.collection("enrollments").doc(`${uid}_${cid}`);
      batch.set(ref, {
        userId: uid,
        courseId: cid,
        status: "assigned",
        progress: 0,
        dueDays: dueDays ?? null,
        required: !!required,
        assignedBy: window.CURRENT_USER?.uid || null,
        assignedAt: now,
      }, { merge: true });
      n++;
    }
  }
  await batch.commit();
  return n;
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
    return ref.id;
  }
  await fbDb.collection("courses").doc(id).set(data, { merge: true });
  return id;
};

const archiveCourse = (id) =>
  fbReady ? fbDb.collection("courses").doc(id).set({ status: "archived" }, { merge: true })
          : Promise.reject(new Error("Firebase not configured"));

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
  return ref.id;
};

const deleteCourse = (id) =>
  fbReady ? fbDb.collection("courses").doc(id).delete()
          : Promise.reject(new Error("Firebase not configured"));

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

  const resp = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
  if (!resp.ok) throw new Error(`Reminder service returned HTTP ${resp.status}`);
  const data = await resp.json().catch(() => ({}));
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
  assignTraining, updateUser, resetUserProgress,
  enrollSelf, markLessonComplete, recordCompletion, recordActivity,
  sendEmailReminder,
  signOutEverywhere,
});
