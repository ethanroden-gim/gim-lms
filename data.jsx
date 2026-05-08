// =========================================================
// GIM LMS — shared icons + data + small primitives
// Exposed on window for sibling JSX scripts.
// =========================================================

const Icon = ({ name, className = "", size = 18 }) => {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round", strokeLinejoin: "round",
    className,
  };
  // Heroicons-aligned outline glyphs
  switch (name) {
    case "home":     return <svg {...props}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>;
    case "compass": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6 6-2z"/></svg>;
    case "book":     return <svg {...props}><path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M4 4v12a4 4 0 0 0 4 4h10"/></svg>;
    case "trophy":   return <svg {...props}><path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M5 6H3v2a3 3 0 0 0 3 3"/><path d="M19 6h2v2a3 3 0 0 1-3 3"/><path d="M10 14h4v3h-4z"/><path d="M8 20h8"/></svg>;
    case "shield":   return <svg {...props}><path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "users":    return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c.7-3.4 3.6-6 7-6s6.3 2.6 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c-.5-2.4-2.4-4-4.5-4"/></svg>;
    case "settings": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19 12c0 .5-.1 1-.2 1.4l2.1 1.6-2 3.4-2.4-1a7 7 0 0 1-2.5 1.5l-.4 2.6h-4l-.4-2.6a7 7 0 0 1-2.5-1.5l-2.4 1-2-3.4 2.1-1.6c-.1-.4-.2-.9-.2-1.4s.1-1 .2-1.4L1.3 9.4l2-3.4 2.4 1a7 7 0 0 1 2.5-1.5L8.6 3h4l.4 2.6a7 7 0 0 1 2.5 1.5l2.4-1 2 3.4-2.1 1.6c.1.4.2.9.2 1.4z"/></svg>;
    case "chart":    return <svg {...props}><path d="M4 20h16"/><rect x="6" y="10" width="3" height="8"/><rect x="11" y="6" width="3" height="12"/><rect x="16" y="13" width="3" height="5"/></svg>;
    case "play":     return <svg {...props} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>;
    case "play-o":   return <svg {...props}><path d="M8 5v14l11-7z"/></svg>;
    case "check":    return <svg {...props}><path d="m5 13 4 4L19 7"/></svg>;
    case "checkb":   return <svg {...props} strokeWidth="2.4"><path d="m5 13 4 4L19 7"/></svg>;
    case "clock":    return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "calendar": return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case "search":   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case "bell":     return <svg {...props}><path d="M6 9a6 6 0 1 1 12 0v4l1.5 3h-15L6 13V9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case "filter":   return <svg {...props}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5z"/></svg>;
    case "plus":     return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "edit":     return <svg {...props}><path d="M4 20h4l11-11-4-4L4 16v4z"/><path d="m13 5 4 4"/></svg>;
    case "trash":    return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>;
    case "download": return <svg {...props}><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16"/></svg>;
    case "external": return <svg {...props}><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M20 14v6H4V4h6"/></svg>;
    case "video":    return <svg {...props}><rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2z"/></svg>;
    case "doc":      return <svg {...props}><path d="M14 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M14 4v6h6"/><path d="M9 14h6M9 18h4"/></svg>;
    case "pdf":      return <svg {...props}><path d="M14 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M14 4v6h6"/><path d="M8 15h2M12 15h2M14 18h-4"/></svg>;
    case "quiz":     return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .8-1.5 1.5-1.5 2.5"/><circle cx="12" cy="17.5" r=".5" fill="currentColor"/></svg>;
    case "link":     return <svg {...props}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L12.5 17"/></svg>;
    case "lock":     return <svg {...props}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case "chevron-right": return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case "chevron-down":  return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case "chevron-up":    return <svg {...props}><path d="m6 15 6-6 6 6"/></svg>;
    case "grip":          return <svg {...props}><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></svg>;
    case "refresh":       return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case "upload":        return <svg {...props}><path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/></svg>;
    case "close":         return <svg {...props}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "eye-off":       return <svg {...props}><path d="M3 3l18 18"/><path d="M10.5 10.5a2 2 0 1 0 3 3"/><path d="M9.4 5.5A11.7 11.7 0 0 1 12 5c5 0 9 4 10 7-.4 1-1.2 2.3-2.4 3.6"/><path d="M6.5 7.5C4.4 9.1 2.7 11.4 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8"/></svg>;
    case "user":          return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "arrow-right":   return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case "arrow-left":    return <svg {...props}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case "tag":      return <svg {...props}><path d="M10 3H4v6l11 11 6-6L10 3z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/></svg>;
    case "flag":     return <svg {...props}><path d="M5 21V4h12l-2 4 2 4H5"/></svg>;
    case "more":     return <svg {...props}><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></svg>;
    case "send":     return <svg {...props}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>;
    case "award":    return <svg {...props}><circle cx="12" cy="9" r="6"/><path d="m8 14-2 7 6-3 6 3-2-7"/></svg>;
    case "list":     return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case "grid":     return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case "house":    return <svg {...props}><path d="M3 11 12 3l9 8"/><path d="M5 9v12h14V9"/><path d="M10 21v-7h4v7"/></svg>;
    case "wrench":   return <svg {...props}><path d="M14 6a4 4 0 0 1 5.5 5.2L9 21.5a2 2 0 0 1-2.8 0l-1.7-1.7a2 2 0 0 1 0-2.8L15 6.5A4 4 0 0 1 14 6z"/></svg>;
    case "money":    return <svg {...props}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>;
    case "phone":    return <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2H7a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg>;
    case "mail":     return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "globe":    return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    default: return null;
  }
};

// ====================== User (populated at runtime by Google sign-in) ====
const CURRENT_USER = {
  name: "",
  initials: "",
  email: "",
  role: "",
  isAdmin: false,
  isManager: false,
};

const TEAM_MEMBERS = [];

const DEPARTMENTS = [
  "Property Management", "Maintenance", "Sales/Marketing", "Finance", "Admin/Back Office"
];

const CATEGORIES = [
  "Property Management", "Maintenance", "Customer Service",
  "Accounting", "New Hire", "Leadership", "Compliance"
];

const COURSES = [];

const ENROLLMENTS = {};
const ASSIGNED = [];
const ACTIVITY = [];
const ALL_USERS = [];
const ENROLLMENT_COUNTS = {}; // { courseId: number } — admin-wide counts
const DEPARTMENT_DOCS = []; // Firestore-backed department records (id, name, ...)
const ALL_ENROLLMENTS = []; // every enrollment doc (admin-wide)

const SAMPLE_QUIZ = { courseId: null, title: "", questions: [] };

// ====== Tiny utilities =================================================
function classNames(...xs) { return xs.filter(Boolean).join(" "); }

const Avatar = ({ name, size = 32 }) => {
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  // Deterministic pleasant green/dark color from name
  const palettes = [
    "linear-gradient(135deg,#7ac142,#2e5a12)",
    "linear-gradient(135deg,#2a3d52,#4a7ab2)",
    "linear-gradient(135deg,#4a3a2a,#c08a52)",
    "linear-gradient(135deg,#6ba83a,#1a3608)",
    "linear-gradient(135deg,#3a1a1a,#b25252)",
    "linear-gradient(135deg,#1a2a3a,#5295b2)",
  ];
  const idx = (name.charCodeAt(0) + name.length) % palettes.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: palettes[idx],
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: Math.round(size * 0.4), letterSpacing: 0.5, flexShrink: 0,
    }}>{initials}</div>
  );
};

// Lesson type → icon
const lessonIcon = (t) => {
  if (t === "video") return "play-o";
  if (t === "article") return "doc";
  if (t === "pdf") return "pdf";
  if (t === "quiz") return "quiz";
  if (t === "link") return "link";
  return "doc";
};

// ====== Expose globally ================================================
Object.assign(window, {
  Icon, Avatar,
  CURRENT_USER, DEPARTMENTS, CATEGORIES, COURSES, ENROLLMENTS, ASSIGNED, ACTIVITY,
  ALL_USERS, SAMPLE_QUIZ, TEAM_MEMBERS, ENROLLMENT_COUNTS, DEPARTMENT_DOCS, ALL_ENROLLMENTS,
  classNames, lessonIcon,
});
