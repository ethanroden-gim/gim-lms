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

// ====================== Mock data ============================
const CURRENT_USER = {
  name: "Maya Donovan",
  initials: "MD",
  email: "maya.donovan@getgim.com",
  role: "Property Manager",
  department: "Property Management",
  manager: "Carlos Reyes",
  hireDate: "Jul 2024",
  isManager: true,
  isAdmin: true, // inherited from Google Workspace Super Admin role
  googleAdmin: true,
};

const TEAM_MEMBERS = [
  { name: "Anya Kowalski",   role: "Property Coordinator", dept: "Property Management", assigned: 4, completed: 8,  due: 1, avgScore: 91, lastActive: "Today",      overdue: 0,
    courses: [
      { title: "MA Fair Housing Law",        progress: 70, status: "in_progress", due: "in 12d", required: true },
      { title: "Resident Communication",     progress: 100, status: "completed",  required: true },
      { title: "Working With Condo & HOA Boards", progress: 35, status: "in_progress", required: false },
      { title: "Emergency Response Playbook", progress: 0,  status: "assigned",  due: "in 7d",  required: true },
    ]},
  { name: "Tomás Reyna",     role: "Property Coordinator", dept: "Property Management", assigned: 6, completed: 1,  due: 4, avgScore: 78, lastActive: "Yesterday",  overdue: 1,
    courses: [
      { title: "GIM New Hire Orientation",   progress: 100, status: "completed", required: true },
      { title: "MA Fair Housing Law",        progress: 12,  status: "in_progress", due: "overdue 2d", required: true, overdue: true },
      { title: "Emergency Response Playbook", progress: 0,  status: "assigned",  due: "in 7d",  required: true },
      { title: "Resident Communication",     progress: 0,   status: "assigned",  due: "in 21d", required: true },
    ]},
  { name: "Elena Park",      role: "Property Manager",     dept: "Property Management", assigned: 4, completed: 10, due: 1, avgScore: 94, lastActive: "Today",      overdue: 0,
    courses: [
      { title: "MA Fair Housing Law",         progress: 100, status: "completed", required: true },
      { title: "Working With Condo & HOA Boards", progress: 100, status: "completed", required: false },
      { title: "Emergency Response Playbook", progress: 60,  status: "in_progress", due: "in 7d", required: true },
      { title: "AppFolio: Daily Workflows",   progress: 25,  status: "in_progress", required: false },
    ]},
  { name: "Devon Bryce",     role: "Senior Property Manager", dept: "Property Management", assigned: 0, completed: 19, due: 0, avgScore: 96, lastActive: "On leave",  overdue: 0,
    courses: [
      { title: "Working With Condo & HOA Boards", progress: 100, status: "completed", required: false },
      { title: "MA Fair Housing Law",         progress: 100, status: "completed", required: true },
    ]},
];

const DEPARTMENTS = [
  "Property Management", "Maintenance", "Sales/Marketing", "Finance", "Admin/Back Office"
];

const CATEGORIES = [
  "Property Management", "Maintenance", "Customer Service",
  "Accounting", "New Hire", "Leadership", "Compliance"
];

const COURSES = [
  {
    id: "c-orient", title: "GIM New Hire Orientation",
    cat: "New Hire", instructor: "GIM People Team",
    duration: 28, lessons: 6, level: "All staff",
    cover: "cv-1", required: true, dueIn: 3,
    description: "An introduction to GIM — our family story, the markets we serve, our service pillars, and what it means to treat every property as if it were our own.",
    sections: [
      { title: "Welcome to GIM", lessons: [
        { id: "l1", title: "A family-founded company", type: "video", dur: "4:12", source: "drive", url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview" },
        { id: "l2", title: "Our service pillars", type: "video", dur: "5:20", source: "youtube", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { id: "l3", title: "How we work — Rent | Manage | Maintain", type: "article", dur: "6 min read" },
      ]},
      { title: "Tools you'll use", lessons: [
        { id: "l4", title: "Software stack overview", type: "video", dur: "7:30", source: "drive", url: "https://drive.google.com/file/d/1ToolStackOverviewPlaceholder/preview" },
        { id: "l5", title: "GIM employee handbook", type: "pdf", dur: "PDF · 24 pages" },
      ]},
      { title: "Wrap up", lessons: [
        { id: "l6", title: "Final assessment", type: "quiz", dur: "10 questions" },
      ]},
    ],
  },
  {
    id: "c-mafh", title: "Massachusetts Fair Housing Law",
    cat: "Compliance", instructor: "Lena Ortiz, Esq.",
    duration: 45, lessons: 8, level: "Required · Annual",
    cover: "cv-9", required: true, dueIn: 12,
    description: "Annual fair-housing recertification covering protected classes under Massachusetts law, advertising rules, and tenant screening practices.",
    sections: [
      { title: "Foundations", lessons: [
        { id: "l1", title: "Federal vs Massachusetts protected classes", type: "video", dur: "8:45", source: "drive", url: "https://drive.google.com/file/d/1MAFairHousingProtectedClasses/preview" },
        { id: "l2", title: "Source-of-income protections in MA", type: "video", dur: "6:10", source: "youtube", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { id: "l3", title: "Reasonable accommodations & modifications", type: "article", dur: "8 min read" },
        { id: "l4", title: "Knowledge check", type: "quiz", dur: "5 questions" },
      ]},
      { title: "Practice in the field", lessons: [
        { id: "l5", title: "Advertising language to avoid", type: "video", dur: "7:00", source: "drive", url: "https://drive.google.com/file/d/1AdvertisingLanguagePlaceholder/preview" },
        { id: "l6", title: "Application & screening best practices", type: "video", dur: "9:15", source: "youtube", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { id: "l7", title: "MA Attorney General — fair housing guidance (external)", type: "link", dur: "External" },
      ]},
      { title: "Certification", lessons: [
        { id: "l8", title: "Final assessment", type: "quiz", dur: "20 questions" },
      ]},
    ],
  },
  {
    id: "c-escal", title: "Maintenance Escalations: From Call to Resolution",
    cat: "Maintenance", instructor: "Brian Halverson",
    duration: 38, lessons: 7, level: "Property Mgrs · Maintenance",
    cover: "cv-2", required: false,
    description: "How to triage a maintenance call, when to dispatch in-house vs vendor, and how to keep boards and residents informed end-to-end.",
  },
  {
    id: "c-resident", title: "Resident Communication — Hard Conversations",
    cat: "Customer Service", instructor: "Priya Shah",
    duration: 32, lessons: 6, level: "Customer-facing roles",
    cover: "cv-4", required: true, dueIn: 21,
    description: "A practical workshop on handling complaints, fee disputes, and emotional residents while protecting the relationship.",
  },
  {
    id: "c-trust", title: "Trust Accounting Fundamentals",
    cat: "Accounting", instructor: "Marcus Lee, CPA",
    duration: 52, lessons: 9, level: "Finance · Property Mgrs",
    cover: "cv-3", required: false,
    description: "How operating, reserve, and security-deposit funds work in MA & RI — and how GIM keeps every cent reconciled.",
  },
  {
    id: "c-listing", title: "From Listing to Lease",
    cat: "Sales/Marketing", instructor: "Dana Whitcomb",
    duration: 42, lessons: 8, level: "Leasing agents",
    cover: "cv-6", required: false,
    description: "Photographing units, writing listings that convert, qualifying applicants, and signing tight, defensible leases.",
  },
  {
    id: "c-board", title: "Working With Condo & HOA Boards",
    cat: "Property Management", instructor: "Carlos Reyes",
    duration: 36, lessons: 7, level: "Property Mgrs",
    cover: "cv-5", required: false,
    description: "How to run a board meeting, present financials, and handle the inevitable hard ask without losing the room.",
  },
  {
    id: "c-emerg", title: "Emergency Response Playbook",
    cat: "Maintenance", instructor: "Brian Halverson",
    duration: 24, lessons: 5, level: "All field staff",
    cover: "cv-5", required: true, dueIn: 7,
    description: "Burst pipes, power outages, fire & flood. The 24-hour playbook for property managers and on-call maintenance.",
  },
  {
    id: "c-vendor", title: "Vendor Management & Bid Comparison",
    cat: "Maintenance", instructor: "Brian Halverson",
    duration: 30, lessons: 6, level: "Property Mgrs",
    cover: "cv-7", required: false,
    description: "Sourcing vendors, structuring bids, and evaluating proposals beyond the bottom line.",
  },
  {
    id: "c-ri", title: "Rhode Island Landlord-Tenant Basics",
    cat: "Compliance", instructor: "Lena Ortiz, Esq.",
    duration: 35, lessons: 7, level: "RI staff · Required",
    cover: "cv-9", required: true, dueIn: 18,
    description: "Notice periods, security deposit rules, and eviction procedure under Rhode Island General Laws Title 34.",
  },
  {
    id: "c-appfolio", title: "AppFolio: Daily Workflows",
    cat: "Property Management", instructor: "GIM Tech Team",
    duration: 48, lessons: 10, level: "Property Mgrs · Admin",
    cover: "cv-8", required: false,
    description: "The exact AppFolio playbook GIM uses — from work orders and journal entries to owner statements.",
  },
  {
    id: "c-bookkeep", title: "Month-End Close at GIM",
    cat: "Accounting", instructor: "Marcus Lee, CPA",
    duration: 40, lessons: 8, level: "Finance",
    cover: "cv-3", required: false,
    description: "GIM's standard month-end close — bank rec, accruals, owner reporting, and the 5th-business-day deadline.",
  },
];

// Per-user enrollment / progress
const ENROLLMENTS = {
  "c-orient":    { progress: 100, status: "completed", completedOn: "Aug 14, 2025", score: 96 },
  "c-mafh":      { progress: 62,  status: "in_progress", lastLesson: "Source-of-income protections in MA", currentLessonId: "l2" },
  "c-resident":  { progress: 30,  status: "in_progress", lastLesson: "De-escalation frameworks", currentLessonId: "l1" },
  "c-emerg":     { progress: 0,   status: "assigned" },
  "c-board":     { progress: 100, status: "completed", completedOn: "Mar 02, 2026", score: 92 },
  "c-vendor":    { progress: 45,  status: "in_progress", lastLesson: "Bid evaluation worksheet", currentLessonId: "l3" },
};

const ASSIGNED = [
  { id: "c-mafh",     dueDays: 12, required: true },
  { id: "c-emerg",    dueDays: 7,  required: true },
  { id: "c-resident", dueDays: 21, required: true },
  { id: "c-ri",       dueDays: 18, required: true },
];

const ACTIVITY = [
  { when: "Today",       text: "Completed lesson \"Federal vs MA protected classes\"", course: "MA Fair Housing Law" },
  { when: "Yesterday",   text: "Earned a certificate", course: "Working With Condo & HOA Boards" },
  { when: "2 days ago",  text: "Started course",     course: "Resident Communication — Hard Conversations" },
  { when: "Last week",   text: "Scored 96% on assessment", course: "GIM New Hire Orientation" },
];

const ALL_USERS = [
  { name: "Maya Donovan",      role: "Admin",   adminSource: "google", dept: "Property Management",  status: "active", assigned: 4, completed: 12, due: 2 },
  { name: "Carlos Reyes",      role: "Admin",   adminSource: "google", dept: "Property Management",  status: "active", assigned: 2, completed: 18, due: 0 },
  { name: "Brian Halverson",   role: "Admin",   adminSource: "granted", dept: "Maintenance",         status: "active", assigned: 1, completed: 22, due: 0 },
  { name: "Priya Shah",        role: "Learner", dept: "Customer Service",     status: "active", assigned: 5, completed: 9,  due: 1 },
  { name: "Marcus Lee",        role: "Manager", dept: "Finance",              status: "active", assigned: 3, completed: 14, due: 0 },
  { name: "Dana Whitcomb",     role: "Learner", dept: "Sales/Marketing",      status: "active", assigned: 4, completed: 7,  due: 1 },
  { name: "Anya Kowalski",     role: "Learner", dept: "Admin/Back Office",    status: "active", assigned: 3, completed: 5,  due: 0 },
  { name: "Tomás Reyna",       role: "Learner", dept: "Maintenance",          status: "onboarding", assigned: 6, completed: 1, due: 4 },
  { name: "Elena Park",        role: "Learner", dept: "Property Management",  status: "active", assigned: 4, completed: 10, due: 1 },
  { name: "Jordan Whitfield",  role: "Learner", dept: "Sales/Marketing",      status: "active", assigned: 4, completed: 8,  due: 0 },
  { name: "Sarah O'Connor",    role: "Learner", dept: "Customer Service",     status: "active", assigned: 4, completed: 11, due: 0 },
  { name: "Devon Bryce",       role: "Learner", dept: "Property Management",  status: "leave",  assigned: 0, completed: 19, due: 0 },
];

// ====== Quiz mock ======================================================
const SAMPLE_QUIZ = {
  courseId: "c-mafh",
  title: "MA Fair Housing — Knowledge Check",
  questions: [
    {
      q: "Which of the following is a protected class under Massachusetts fair housing law that is NOT a federal protected class?",
      options: [
        "Race",
        "Source of income (e.g. Section 8 voucher holders)",
        "National origin",
        "Religion",
      ],
      correct: 1,
    },
    {
      q: "A prospective tenant who uses a wheelchair asks if they can install grab bars in the bathroom at their own expense. This is best classified as a:",
      options: [
        "Reasonable accommodation",
        "Reasonable modification",
        "Lease violation",
        "Service animal request",
      ],
      correct: 1,
    },
    {
      q: "Which advertising phrase is most likely to violate fair-housing rules?",
      options: [
        "\"Walk-up unit, third floor\"",
        "\"Quiet professional building\"",
        "\"Spacious 2-bedroom near T\"",
        "\"Pet-friendly with deposit\"",
      ],
      correct: 1,
    },
  ],
};

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
  ALL_USERS, SAMPLE_QUIZ, TEAM_MEMBERS,
  classNames, lessonIcon,
});
