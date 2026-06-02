// =========================================================
// OneSource LMS — shared icons + data + small primitives
// Exposed on window for sibling JSX scripts.
// =========================================================

const Icon = ({ name, className = "", size = 18, color, style }) => {
  const overrideUrl = ((window.ICON_SETTINGS || ICON_SETTINGS || {}).iconOverrides || {})[name];
  if (overrideUrl) {
    return (
      <img
        src={overrideUrl}
        alt=""
        className={className}
        style={{ width: size, height: size, objectFit: "contain", display: "inline-block", flexShrink: 0, ...style }}
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
    );
  }
  const customIcon = (window.ICON_DOCS || []).find(i => i && i.id === name && i.url);
  if (customIcon) {
    return (
      <img
        src={customIcon.url}
        alt=""
        title={customIcon.label || ""}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "inline-block",
          flexShrink: 0,
          ...style,
        }}
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
    );
  }
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color || "currentColor", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
    className, style,
  };
  const filledProps = { ...props, fill: color || "currentColor", stroke: "none" };
  switch (name) {
    case "home": return <svg {...props}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-7h4v7h5V9.5"/></svg>;
    case "compass": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m16 8-2.4 6.4L7 17l2.4-6.4L16 8Z"/><circle cx="12" cy="12" r=".5" fill="currentColor"/></svg>;
    case "book": return <svg {...props}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z"/><path d="M4 5.5V22"/><path d="M8 7h8M8 11h7M8 15h5"/></svg>;
    case "trophy": return <svg {...props}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M5 6H3v2a4 4 0 0 0 4 4"/><path d="M19 6h2v2a4 4 0 0 1-4 4"/><path d="M10 14h4v4h-4Z"/><path d="M8 21h8"/></svg>;
    case "shield": return <svg {...props}><path d="M12 3 5 6v5.5c0 4.1 2.9 7.9 7 9.5 4.1-1.6 7-5.4 7-9.5V6l-7-3Z"/><path d="m8.8 12.2 2 2 4.4-4.5"/><path d="M12 6.5v2"/></svg>;
    case "users": return <svg {...props}><circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.1 3.1-5 6-5s5.4 1.9 6 5"/><circle cx="17" cy="9" r="2"/><path d="M21 19c-.4-1.8-1.7-3.1-3.4-3.6"/></svg>;
    case "settings": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a8 8 0 0 0 .1-1.5l2-1.5-2-3.5-2.4 1a7.3 7.3 0 0 0-1.3-.8L15.5 6h-7l-.3 2.7c-.5.2-.9.5-1.3.8l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 0 1.5l-2 1.5 2 3.5 2.4-1c.4.3.8.6 1.3.8l.3 2.7h7l.3-2.7c.5-.2.9-.5 1.3-.8l2.4 1 2-3.5-2.1-1.5Z"/></svg>;
    case "chart": return <svg {...props}><path d="M4 20h16"/><rect x="6" y="11" width="3" height="7" rx="1"/><rect x="11" y="6" width="3" height="12" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/></svg>;
    case "play": return <svg {...filledProps}><path d="M8 5v14l11-7Z"/></svg>;
    case "play-o": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></svg>;
    case "check":
    case "checkb": return <svg {...props}><path d="m5 13 4 4L19 7"/></svg>;
    case "clock": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "calendar": return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
    case "search": return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>;
    case "bell": return <svg {...props}><path d="M6 9a6 6 0 0 1 12 0v4.5l1.5 2.5h-15L6 13.5V9Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case "filter": return <svg {...props}><path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8L4 5Z"/></svg>;
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "edit": return <svg {...props}><path d="M4 20h4l10.5-10.5-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>;
    case "trash": return <svg {...props}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m6 7 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M10 11v6M14 11v6"/></svg>;
    case "download": return <svg {...props}><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M4 20h16"/></svg>;
    case "upload": return <svg {...props}><path d="M12 16V5"/><path d="m8 9 4-4 4 4"/><path d="M4 20h16"/></svg>;
    case "external": return <svg {...props}><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M20 14v6H4V4h6"/></svg>;
    case "video": return <svg {...props}><rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2v-4Z"/></svg>;
    case "doc": return <svg {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>;
    case "pdf": return <svg {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M8 15h2M12 15h2M16 15h.01M8 18h6"/></svg>;
    case "quiz": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .8-1.5 1.5-1.5 2.5"/><circle cx="12" cy="17.5" r=".5" fill="currentColor"/></svg>;
    case "link": return <svg {...props}><path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.8"/><path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3"/></svg>;
    case "lock": return <svg {...props}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "chevron-right": return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case "chevron-down": return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case "chevron-up": return <svg {...props}><path d="m6 15 6-6 6 6"/></svg>;
    case "grip": return <svg {...props}><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></svg>;
    case "refresh": return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case "close": return <svg {...props}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "eye-off": return <svg {...props}><path d="M3 3l18 18"/><path d="M10.5 10.5a2 2 0 0 0 3 3"/><path d="M9.8 5.3A10.8 10.8 0 0 1 12 5c5 0 8.5 3.5 10 7a12.9 12.9 0 0 1-3.1 4.5"/><path d="M6.4 7.4C4.3 8.8 2.8 10.8 2 12c1.5 3.5 5 7 10 7 1.4 0 2.7-.3 3.8-.8"/></svg>;
    case "user": return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "arrow-right": return <svg {...props}><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></svg>;
    case "arrow-left": return <svg {...props}><path d="M19 12H5"/><path d="m11 5-7 7 7 7"/></svg>;
    case "tag": return <svg {...props}><path d="M10 3H4v6l10.8 10.8a2 2 0 0 0 2.8 0l2.2-2.2a2 2 0 0 0 0-2.8L10 3Z"/><circle cx="7.5" cy="7.5" r="1.4"/><path d="m13 8 4 4"/></svg>;
    case "flag": return <svg {...props}><path d="M5 21V4h12l-2 4 2 4H5"/></svg>;
    case "more": return <svg {...props}><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/></svg>;
    case "send": return <svg {...props}><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>;
    case "award": return <svg {...props}><circle cx="12" cy="8.5" r="5.5"/><path d="m8.8 13-1.6 8 4.8-2.6 4.8 2.6-1.6-8"/><path d="m9.8 8.6 1.4 1.4 3-3"/></svg>;
    case "list": return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case "grid": return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "building":
    case "house": return <svg {...props}><path d="M4 21V8.5L12 3l8 5.5V21"/><path d="M8 21v-7h8v7"/><path d="M9 9.5h.01M15 9.5h.01"/><path d="M6 21h12"/></svg>;
    case "wrench":
    case "tools": return <svg {...props}><path d="M14.7 5.3a4.2 4.2 0 0 0 4.9 5.7l-7.7 7.7a2.1 2.1 0 0 1-3 0l-1.6-1.6a2.1 2.1 0 0 1 0-3l7.7-7.7a4.2 4.2 0 0 0-.3-1.1Z"/><path d="m5 4 5 5"/><path d="m3.5 5.5 3-3 5 5-3 3"/><path d="m14 14 6 6"/></svg>;
    case "calculator":
    case "money": return <svg {...props}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01"/><path d="M8 18h4"/></svg>;
    case "headset":
    case "phone": return <svg {...props}><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M5 13h2.5v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2Z"/><path d="M16.5 13H19a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2.5v-5Z"/><path d="M16 18c0 1.7-1.8 3-4 3h-1"/><path d="M9 21h2"/></svg>;
    case "mail": return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "globe": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>;
    case "monitor": return <svg {...props}><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M7 8h6M7 11h10"/></svg>;
    case "umbrella": return <svg {...props}><path d="M3 12a9 9 0 0 1 18 0Z"/><path d="M12 12v6a3 3 0 0 0 6 0"/><path d="M12 3v2"/><path d="M7 12c.4-3.8 2-6.4 5-9 3 2.6 4.6 5.2 5 9"/></svg>;
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
  companyId: "",
};

const TEAM_MEMBERS = [];

const DEPARTMENTS = [
  "Property Management", "Maintenance", "Sales/Marketing", "Finance", "Admin/Back Office"
];

const CATEGORIES = [
  "Property Management", "Maintenance", "Customer Service",
  "Accounting", "New Hire", "Leadership", "Compliance"
];

const CATEGORY_ICON_CHOICES = [
  { icon: "building", label: "Property" },
  { icon: "tools", label: "Maintenance" },
  { icon: "headset", label: "Customer Service" },
  { icon: "calculator", label: "Accounting" },
  { icon: "shield", label: "Compliance" },
  { icon: "book", label: "Learning" },
  { icon: "award", label: "Certification" },
  { icon: "umbrella", label: "Insurance" },
  { icon: "monitor", label: "Webinar" },
  { icon: "users", label: "People" },
  { icon: "tag", label: "General" },
];

const ICON_DOCS = [];       // Firestore-backed custom icon library
const ICON_SETTINGS = { navIcons: {}, iconOverrides: {} };
const NAV_ICON_TARGETS = [
  { id: "home", label: "Learner dashboard", fallback: "home" },
  { id: "catalog", label: "Course catalog", fallback: "compass" },
  { id: "learning", label: "My learning", fallback: "book" },
  { id: "certs", label: "Certificates", fallback: "award" },
  { id: "team", label: "My team", fallback: "users" },
  { id: "admin-overview", label: "Admin overview", fallback: "chart" },
  { id: "admin-courses", label: "Admin courses", fallback: "book" },
  { id: "admin-users", label: "People & enrollments", fallback: "users" },
  { id: "admin-assess", label: "Assessments", fallback: "quiz" },
  { id: "admin-attempts", label: "Attempts", fallback: "list" },
  { id: "admin-activity", label: "Activity", fallback: "clock" },
  { id: "admin-cert", label: "Certificate designer", fallback: "award" },
  { id: "admin-settings", label: "Settings", fallback: "settings" },
];
const CATEGORY_COLOR_CHOICES = [
  { id: "green", label: "Green", bg: "#f0f9e6", color: "#2e5a12", borderColor: "#cfeab0" },
  { id: "blue", label: "Blue", bg: "#eaf3ff", color: "#1f4e79", borderColor: "#bfd8f2" },
  { id: "amber", label: "Amber", bg: "#fff5dc", color: "#8a5a00", borderColor: "#f3d999" },
  { id: "teal", label: "Teal", bg: "#e7f7f3", color: "#0f5f51", borderColor: "#b8e2d8" },
  { id: "rose", label: "Rose", bg: "#fff0f1", color: "#9f2430", borderColor: "#f1c2c8" },
  { id: "indigo", label: "Indigo", bg: "#eef0ff", color: "#343a8a", borderColor: "#c9cdf7" },
  { id: "slate", label: "Slate", bg: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" },
  { id: "lime", label: "Lime", bg: "#f6fbdf", color: "#4a6505", borderColor: "#dbe99f" },
];
const CATEGORY_BROWSE_DEFAULTS = ["Property Management", "Maintenance", "Customer Service", "Accounting", "Compliance"];

const COMPANY_DOCS = [];     // Firestore-backed company/entity records
const DEFAULT_COMPANY = {
  id: "onesource",
  name: "OneSource",
  domains: [],
  logoUrl: "",
  certificateLogoUrl: "",
  certificateName: "OneSource",
  accent: "#1d4ed8",
  secondary: "#0f2f6b",
  active: true,
  adminBrand: true,
};

const COURSES = [];

const ENROLLMENTS = {};
const ASSIGNED = [];
const ACTIVITY = [];
const ALL_ACTIVITY = [];
const ADMIN_ACTIVITY = [];
const ALL_USERS = [];
const ENROLLMENT_COUNTS = {}; // { courseId: number } — admin-wide counts
const DEPARTMENT_DOCS = []; // Firestore-backed department records (id, name, ...)
const ROLE_DOCS = [];       // Firestore-backed custom role records
const CATEGORY_DOCS = [];   // Firestore-backed category records
const ASSESSMENTS = [];     // Firestore-backed assessments
const ALL_ENROLLMENTS = []; // every enrollment doc (admin-wide)
const ATTEMPTS = [];        // every assessment attempt (admin-wide; learners filter to own)

const SAMPLE_QUIZ = { courseId: null, title: "", questions: [] };

// ====== Tiny utilities =================================================
function classNames(...xs) { return xs.filter(Boolean).join(" "); }

const defaultCategoryColorId = (name, idx = 0) => {
  const presetIdx = (window.CATEGORIES || CATEGORIES || []).indexOf(name);
  const colorIdx = presetIdx >= 0 ? presetIdx : idx;
  return CATEGORY_COLOR_CHOICES[colorIdx % CATEGORY_COLOR_CHOICES.length].id;
};

const getCategoryColor = (colorId) =>
  CATEGORY_COLOR_CHOICES.find(c => c.id === colorId) || CATEGORY_COLOR_CHOICES[0];

const getCategoryDocs = () => {
  const docs = (window.CATEGORY_DOCS || CATEGORY_DOCS || []).filter(c => c && c.name);
  if (docs.length) {
    return [...docs]
      .map((c, idx) => ({
        ...c,
        icon: c.icon || "tag",
        colorId: c.colorId || defaultCategoryColorId(c.name, idx),
        showInBrowse: c.showInBrowse !== false,
        sortOrder: c.sortOrder ?? idx,
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
  return (window.CATEGORIES || CATEGORIES || []).map((name, idx) => ({
    id: `preset-${name}`,
    name,
    icon: (CATEGORY_ICON_CHOICES[idx] || CATEGORY_ICON_CHOICES[CATEGORY_ICON_CHOICES.length - 1]).icon,
    colorId: defaultCategoryColorId(name, idx),
    showInBrowse: CATEGORY_BROWSE_DEFAULTS.includes(name),
    preset: true,
    sortOrder: idx,
  }));
};

const getCategoryNames = () => getCategoryDocs().map(c => c.name).filter(Boolean);
const getBrowseCategories = () => getCategoryDocs().filter(c => c.showInBrowse !== false);
const getCategoryByName = (name) => getCategoryDocs().find(c => c.name === name);
const getCategoryChipStyle = (nameOrDoc) => {
  const doc = typeof nameOrDoc === "string" ? getCategoryByName(nameOrDoc) : nameOrDoc;
  const palette = getCategoryColor(doc?.colorId || defaultCategoryColorId(doc?.name || ""));
  return { background: palette.bg, color: palette.color, borderColor: palette.borderColor };
};

const iconDocId = (label = "") => {
  const base = String(label || "icon").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `ico-${base || Math.random().toString(36).slice(2, 8)}`;
};

const normalizeIconDoc = (icon = {}, idx = 0) => {
  const label = String(icon.label || icon.name || `Custom icon ${idx + 1}`).trim();
  return {
    id: icon.id || iconDocId(label),
    label,
    url: String(icon.url || "").trim(),
    tags: String(icon.tags || icon.scope || "").trim(),
    active: icon.active !== false,
    sortOrder: icon.sortOrder ?? idx,
  };
};

const getCustomIconDocs = () => (window.ICON_DOCS || ICON_DOCS || [])
  .filter(i => i && i.url && i.active !== false)
  .map(normalizeIconDoc)
  .sort((a, b) => (a.label || "").localeCompare(b.label || ""));

const getIconChoices = () => [
  ...(window.CATEGORY_ICON_CHOICES || CATEGORY_ICON_CHOICES || []).map(p => ({
    id: p.icon,
    icon: p.icon,
    label: p.label,
    builtin: true,
    url: ((window.ICON_SETTINGS || ICON_SETTINGS || {}).iconOverrides || {})[p.icon] || "",
  })),
  ...getCustomIconDocs().map(p => ({
    id: p.id,
    icon: p.id,
    label: p.label,
    custom: true,
    url: p.url,
  })),
];

const getIconChoiceById = (id) => getIconChoices().find(p => p.id === id || p.icon === id);

const getNavIcon = (id, fallback) => {
  const map = (window.ICON_SETTINGS || ICON_SETTINGS || {}).navIcons || {};
  return map[id] || fallback;
};

const normalizeDomain = (value = "") => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/^@+/, "");

const domainFromEmail = (email = "") => normalizeDomain(String(email || "").split("@")[1] || "");

const companyDocId = (name = "") => {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `co-${base || Math.random().toString(36).slice(2, 8)}`;
};

const normalizeHexColor = (value = "", fallback = "#1d4ed8") => {
  const raw = String(value || "").trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-f]{6}$/i.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(withHash)) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toLowerCase();
  }
  return fallback;
};
const isLightHexColor = (value = "#ffffff") => {
  const hex = normalizeHexColor(value, "#ffffff").slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 150;
};

const normalizeCompany = (company = {}, idx = 0) => {
  const name = String(company.name || company.displayName || DEFAULT_COMPANY.name).trim();
  const domains = Array.isArray(company.domains)
    ? company.domains
    : String(company.domains || "").split(/[,\n|]/);
  return {
    ...DEFAULT_COMPANY,
    ...company,
    id: company.id || companyDocId(name),
    name,
    domains: domains.map(normalizeDomain).filter(Boolean),
    logoUrl: company.logoUrl || company.logo || DEFAULT_COMPANY.logoUrl,
    certificateLogoUrl: company.certificateLogoUrl || company.logoUrl || company.logo || DEFAULT_COMPANY.certificateLogoUrl,
    certificateName: company.certificateName || name,
    accent: normalizeHexColor(company.accent || DEFAULT_COMPANY.accent, DEFAULT_COMPANY.accent),
    secondary: normalizeHexColor(company.secondary || company.accent || DEFAULT_COMPANY.secondary, DEFAULT_COMPANY.secondary),
    active: company.active !== false,
    adminBrand: !!company.adminBrand || idx === 0 && (window.COMPANY_DOCS || COMPANY_DOCS || []).length === 0,
  };
};

const getCompanyDocs = () => {
  const docs = (window.COMPANY_DOCS || COMPANY_DOCS || []).filter(c => c && c.name);
  const source = docs.length ? docs : [DEFAULT_COMPANY];
  return source.map(normalizeCompany).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

const getCompanyById = (id) => getCompanyDocs().find(c => c.id === id) || null;
const getCompanyForEmail = (email) => {
  const domain = domainFromEmail(email);
  if (!domain) return null;
  return getCompanyDocs().find(c => c.active !== false && (c.domains || []).map(normalizeDomain).includes(domain)) || null;
};
const getAdminBrandCompany = () => getCompanyDocs().find(c => c.adminBrand && c.active !== false) || getCompanyDocs()[0] || DEFAULT_COMPANY;
const getCurrentUserCompany = () => getCompanyById((window.CURRENT_USER || CURRENT_USER).companyId) || getCompanyForEmail((window.CURRENT_USER || CURRENT_USER).email);
const getBrandCompany = (mode = "learner") => mode === "admin" ? getAdminBrandCompany() : (getCurrentUserCompany() || DEFAULT_COMPANY);
const getBrandStyle = (mode = "learner") => {
  const co = getBrandCompany(mode);
  const accent = normalizeHexColor(co.accent || DEFAULT_COMPANY.accent, DEFAULT_COMPANY.accent);
  const secondary = normalizeHexColor(co.secondary || co.accent || DEFAULT_COMPANY.secondary, DEFAULT_COMPANY.secondary);
  return {
    "--t-accent": accent,
    "--t-accent-hover": secondary,
    "--t-accent-pale": `${accent}55`,
    "--t-accent-soft": `${accent}18`,
    "--t-accent-deep": secondary,
    "--t-accent-fg": isLightHexColor(accent) ? "#111" : "#fff",
    "--t-accent-hover-fg": isLightHexColor(secondary) ? "#111" : "#fff",
  };
};
const companyName = (id) => getCompanyById(id)?.name || "";
const companyNames = (ids = []) => (ids || []).map(companyName).filter(Boolean).join(", ");
const courseVisibleToCompany = (course, companyId = (window.CURRENT_USER || CURRENT_USER).companyId) => {
  if (!course) return false;
  if ((course.companyVisibility || "all") === "all") return true;
  const allowed = Array.isArray(course.allowedCompanyIds) ? course.allowedCompanyIds : [];
  return !!companyId && allowed.includes(companyId);
};
const visibleLearnerCourses = (courses = (window.COURSES || COURSES)) =>
  (courses || []).filter(c => courseVisibleToCompany(c, (window.CURRENT_USER || CURRENT_USER).companyId));

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const plainTextToArticleHtml = (value = "") =>
  String(value || "")
    .split(/\n{2,}/)
    .map(part => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("") || "<p></p>";

const articleHtmlToText = (html = "") => {
  const el = document.createElement("div");
  el.innerHTML = html || "";
  return (el.textContent || "").trim();
};

const sanitizeArticleHtml = (html = "") => {
  const template = document.createElement("template");
  template.innerHTML = html || "";
  const allowed = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "A", "H2", "H3", "BLOCKQUOTE"]);
  const cleanNode = (node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }
      if (!allowed.has(child.tagName)) {
        cleanNode(child);
        child.replaceWith(...child.childNodes);
        return;
      }
      [...child.attributes].forEach(attr => {
        const isSafeLink = child.tagName === "A" && attr.name === "href" && /^(https?:|mailto:|tel:|#|\/)/i.test(attr.value || "");
        if (!isSafeLink) child.removeAttribute(attr.name);
      });
      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
      cleanNode(child);
    });
  };
  cleanNode(template.content);
  return template.innerHTML || "<p></p>";
};

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
  ALL_ACTIVITY, ADMIN_ACTIVITY,
  ALL_USERS, SAMPLE_QUIZ, TEAM_MEMBERS, ENROLLMENT_COUNTS, DEPARTMENT_DOCS, ROLE_DOCS, CATEGORY_DOCS,
  COMPANY_DOCS, DEFAULT_COMPANY, ICON_DOCS, ICON_SETTINGS, NAV_ICON_TARGETS,
  CATEGORY_ICON_CHOICES, CATEGORY_COLOR_CHOICES, CATEGORY_BROWSE_DEFAULTS,
  getCategoryDocs, getCategoryNames, getBrowseCategories, getCategoryByName, getCategoryChipStyle,
  iconDocId, normalizeIconDoc, getCustomIconDocs, getIconChoices, getIconChoiceById, getNavIcon,
  normalizeDomain, domainFromEmail, companyDocId, normalizeCompany, getCompanyDocs, getCompanyById, getCompanyForEmail,
  normalizeHexColor, isLightHexColor,
  getAdminBrandCompany, getCurrentUserCompany, getBrandCompany, getBrandStyle, companyName, companyNames,
  courseVisibleToCompany, visibleLearnerCourses,
  plainTextToArticleHtml, articleHtmlToText, sanitizeArticleHtml,
  ASSESSMENTS, ALL_ENROLLMENTS, ATTEMPTS,
  classNames, lessonIcon,
});
