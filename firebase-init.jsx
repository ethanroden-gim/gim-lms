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

  // Aggregate enrolment counts per course (for the admin courses table)
  subs.push(fbDb.collection("enrollments").onSnapshot(s => {
    const counts = {};
    s.docs.forEach(d => {
      const cid = d.data().courseId;
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    });
    setObj(ENROLLMENT_COUNTS, counts);
    onChange();
  }, err => {
    if (err.code !== "permission-denied") console.error("enrollment counts listener:", err);
  }));

  subs.push(fbDb.collection("activity")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(8)
    .onSnapshot(s => {
      setArr(ACTIVITY, s.docs.map(d => d.data()));
      onChange();
    }, err => {
      // index may not exist yet — fall back silently
      if (err.code !== "failed-precondition") console.error("activity listener:", err);
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

const deleteCourse = (id) =>
  fbReady ? fbDb.collection("courses").doc(id).delete()
          : Promise.reject(new Error("Firebase not configured"));

const signOutEverywhere = async () => {
  if (window.google?.accounts?.id) {
    try { google.accounts.id.disableAutoSelect(); } catch {}
  }
  if (fbReady) await fbAuth.signOut();
};

Object.assign(window, {
  fbReady, fbAuth, fbDb,
  signIntoFirebase, upsertUserDoc, subscribeToData,
  hydrateUserFromFirebase, saveCourse, archiveCourse, deleteCourse, signOutEverywhere,
});
