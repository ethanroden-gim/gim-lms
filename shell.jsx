// =========================================================
// GIM LMS — Sidebar + Topbar
// =========================================================

const Sidebar = ({ route, setRoute, mode }) => {
  const learnerLinks = [
    { id: "home", label: "Dashboard", icon: "home" },
    { id: "catalog", label: "Course catalog", icon: "compass" },
    { id: "learning", label: "My learning", icon: "book", badge: ASSIGNED.length || null },
    { id: "certs", label: "Certificates", icon: "award" },
    ...(CURRENT_USER.isManager ? [{ id: "team", label: "My team", icon: "users" }] : []),
  ];
  const adminLinks = [
    { id: "admin-overview", label: "Overview", icon: "chart" },
    { id: "admin-courses", label: "Courses", icon: "book" },
    { id: "admin-users", label: "People & enrollments", icon: "users" },
    { id: "admin-assess", label: "Assessments", icon: "quiz" },
    { id: "admin-cert", label: "Certificate designer", icon: "award" },
    { id: "admin-settings", label: "Roles & departments", icon: "settings" },
  ];
  const links = mode === "admin" ? adminLinks : learnerLinks;
  const sectionLabel = mode === "admin" ? "Administration" : "Learn";

  return (
    <aside className="app__sidebar">
      <div className="sidebar-section">
        <div className="sidebar-eyebrow">{sectionLabel}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {links.map(l => (
            <button
              key={l.id}
              className={classNames("sidebar-link", route === l.id && "active")}
              onClick={() => setRoute(l.id)}
            >
              <Icon name={l.icon} />
              <span>{l.label}</span>
              {l.badge ? <span className="sidebar-link__badge">{l.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {mode === "learner" && (
        <div className="sidebar-section">
          <div className="sidebar-eyebrow">Browse</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { label: "Property Management", icon: "house" },
              { label: "Maintenance", icon: "wrench" },
              { label: "Customer Service", icon: "phone" },
              { label: "Accounting", icon: "money" },
              { label: "Compliance", icon: "shield" },
            ].map(c => (
              <button key={c.label} className="sidebar-link" onClick={() => setRoute("catalog")}>
                <Icon name={c.icon} /><span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

const Topbar = ({ mode, setMode, isAdmin, goCourse }) => {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = q.trim().length >= 1
    ? COURSES.filter(c =>
        c.title.toLowerCase().includes(q.toLowerCase())
        || c.cat.toLowerCase().includes(q.toLowerCase())
        || (c.instructor || "").toLowerCase().includes(q.toLowerCase())
      ).slice(0, 8)
    : [];

  const pickCourse = (id) => {
    setOpen(false);
    setQ("");
    goCourse && goCourse(id);
  };

  return (
    <header className="app__topbar">
      <div className="app__brand">
        <img src="assets/logo-landscape-onblack.png" alt="GIM" />
        <div className="app__brand-divider" />
        <span className="app__brand-tag">Learning</span>
      </div>

      <div className="app__topright">
        <div ref={ref} style={{ position: "relative" }}>
          <label className="topbar-search">
            <Icon name="search" size={14} />
            <input
              type="search"
              placeholder="Search courses…"
              value={q}
              onChange={e => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
            />
          </label>
          {open && q.trim().length >= 1 && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 60,
              background: "#fff", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,.18)",
              border: "1px solid #ececec", overflow: "hidden", minWidth: 320,
            }}>
              {results.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: "#5f635f", textAlign: "center" }}>
                  No courses match "{q}"
                </div>
              ) : (
                <>
                  <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#5f635f", textTransform: "uppercase", letterSpacing: ".05em", background: "#fafafa", borderBottom: "1px solid #ececec" }}>
                    {results.length} {results.length === 1 ? "course" : "courses"}
                  </div>
                  {results.map(c => (
                    <button key={c.id} onClick={() => pickCourse(c.id)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", width: "100%",
                      border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
                      borderBottom: "1px solid #f5f5f5",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div className={classNames(c.cover)} style={{ width: 40, height: 28, borderRadius: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: "#5f635f" }}>{c.cat} · {c.duration} min</div>
                      </div>
                      {c.required && <span className="chip chip-required" style={{ fontSize: 10, padding: "1px 6px" }}>Required</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="topbar-mode" role="tablist" aria-label="View mode">
            <button className={mode === "learner" ? "active" : ""} onClick={() => setMode("learner")}>Learner</button>
            <button className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>Admin</button>
          </div>
        )}

        <div className="topbar-user">
          <Avatar name={CURRENT_USER.name} size={32} />
          <div className="topbar-user__meta">
            <div className="topbar-user__name">{CURRENT_USER.name}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

Object.assign(window, { Sidebar, Topbar });
