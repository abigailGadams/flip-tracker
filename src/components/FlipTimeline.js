"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Check, Clock, DollarSign, CalendarDays, LayoutList, BarChart3, FolderOpen, ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Home, Hammer, Paintbrush, Wrench, Zap, CheckCircle2, Circle, X, Edit3, Save, LogOut, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import AuthModal from "./AuthModal";
import ProjectsDrawer from "./ProjectsDrawer";

// ─── Data & Constants ────────────────────────────────────────────────
const PHASES = [
  { id: "acquisition", label: "Acquisition", color: "#6366f1", icon: "Home" },
  { id: "demo", label: "Demo & Cleanup", color: "#f59e0b", icon: "Hammer" },
  { id: "structural", label: "Structural", color: "#ef4444", icon: "Wrench" },
  { id: "roughin", label: "Rough-In", color: "#3b82f6", icon: "Zap" },
  { id: "finish", label: "Finish Work", color: "#8b5cf6", icon: "Paintbrush" },
  { id: "final", label: "Final & Staging", color: "#10b981", icon: "CheckCircle2" },
];

const PHASE_ICON_MAP = { Home, Hammer, Wrench, Zap, Paintbrush, CheckCircle2 };

const TEMPLATES = [
  {
    name: "Standard Flip",
    description: "Full renovation — cosmetic + structural updates for a typical single-family flip.",
    tasks: [
      { title: "Property inspection & assessment", phase: "acquisition", budget: 500, daysFromStart: 0, duration: 3 },
      { title: "Close on property", phase: "acquisition", budget: 0, daysFromStart: 3, duration: 1 },
      { title: "Secure permits", phase: "acquisition", budget: 1200, daysFromStart: 4, duration: 5 },
      { title: "Interior demolition", phase: "demo", budget: 3000, daysFromStart: 9, duration: 4 },
      { title: "Debris removal & cleanup", phase: "demo", budget: 1500, daysFromStart: 13, duration: 2 },
      { title: "Foundation / framing repairs", phase: "structural", budget: 8000, daysFromStart: 15, duration: 7 },
      { title: "Roof repair / replacement", phase: "structural", budget: 6000, daysFromStart: 15, duration: 5 },
      { title: "Electrical rough-in", phase: "roughin", budget: 4500, daysFromStart: 22, duration: 5 },
      { title: "Plumbing rough-in", phase: "roughin", budget: 4000, daysFromStart: 22, duration: 5 },
      { title: "HVAC installation", phase: "roughin", budget: 5500, daysFromStart: 27, duration: 4 },
      { title: "Insulation & drywall", phase: "finish", budget: 5000, daysFromStart: 31, duration: 6 },
      { title: "Flooring installation", phase: "finish", budget: 4500, daysFromStart: 37, duration: 4 },
      { title: "Kitchen remodel", phase: "finish", budget: 12000, daysFromStart: 37, duration: 8 },
      { title: "Bathroom remodel(s)", phase: "finish", budget: 8000, daysFromStart: 37, duration: 7 },
      { title: "Interior & exterior paint", phase: "finish", budget: 4000, daysFromStart: 45, duration: 5 },
      { title: "Landscaping & curb appeal", phase: "final", budget: 3000, daysFromStart: 50, duration: 3 },
      { title: "Final inspections", phase: "final", budget: 500, daysFromStart: 53, duration: 2 },
      { title: "Professional staging", phase: "final", budget: 2500, daysFromStart: 55, duration: 2 },
      { title: "Photography & listing", phase: "final", budget: 800, daysFromStart: 57, duration: 1 },
    ],
  },
  {
    name: "Cosmetic Refresh",
    description: "Light rehab — paint, floors, fixtures, and staging. No structural work.",
    tasks: [
      { title: "Property walkthrough & punch list", phase: "acquisition", budget: 200, daysFromStart: 0, duration: 1 },
      { title: "Deep clean & minor demo", phase: "demo", budget: 800, daysFromStart: 1, duration: 2 },
      { title: "Interior painting", phase: "finish", budget: 3000, daysFromStart: 3, duration: 4 },
      { title: "Update light fixtures & hardware", phase: "finish", budget: 1500, daysFromStart: 3, duration: 2 },
      { title: "Refinish / replace flooring", phase: "finish", budget: 4000, daysFromStart: 7, duration: 4 },
      { title: "Kitchen cosmetic update", phase: "finish", budget: 5000, daysFromStart: 7, duration: 5 },
      { title: "Bathroom cosmetic update", phase: "finish", budget: 3000, daysFromStart: 7, duration: 4 },
      { title: "Exterior touch-ups & landscaping", phase: "final", budget: 2000, daysFromStart: 12, duration: 3 },
      { title: "Staging & photography", phase: "final", budget: 2500, daysFromStart: 15, duration: 2 },
    ],
  },
  {
    name: "Gut Rehab",
    description: "Down-to-studs renovation for distressed properties needing everything.",
    tasks: [
      { title: "Engineering assessment", phase: "acquisition", budget: 1500, daysFromStart: 0, duration: 3 },
      { title: "Secure all permits", phase: "acquisition", budget: 3000, daysFromStart: 3, duration: 7 },
      { title: "Full interior demo to studs", phase: "demo", budget: 6000, daysFromStart: 10, duration: 6 },
      { title: "Hazmat abatement (lead/asbestos)", phase: "demo", budget: 5000, daysFromStart: 10, duration: 5 },
      { title: "Dumpster & debris hauling", phase: "demo", budget: 3000, daysFromStart: 16, duration: 2 },
      { title: "Foundation work", phase: "structural", budget: 12000, daysFromStart: 18, duration: 8 },
      { title: "Framing & structural repairs", phase: "structural", budget: 15000, daysFromStart: 18, duration: 10 },
      { title: "New roof", phase: "structural", budget: 10000, daysFromStart: 28, duration: 5 },
      { title: "Windows & exterior doors", phase: "structural", budget: 8000, daysFromStart: 28, duration: 4 },
      { title: "Full electrical rewire", phase: "roughin", budget: 8000, daysFromStart: 33, duration: 7 },
      { title: "Full plumbing replacement", phase: "roughin", budget: 7000, daysFromStart: 33, duration: 7 },
      { title: "New HVAC system", phase: "roughin", budget: 8000, daysFromStart: 40, duration: 5 },
      { title: "Insulation & drywall", phase: "finish", budget: 8000, daysFromStart: 45, duration: 8 },
      { title: "All flooring", phase: "finish", budget: 7000, daysFromStart: 53, duration: 5 },
      { title: "Full kitchen build-out", phase: "finish", budget: 18000, daysFromStart: 53, duration: 10 },
      { title: "Full bathroom build-out(s)", phase: "finish", budget: 14000, daysFromStart: 53, duration: 9 },
      { title: "Trim, doors, paint", phase: "finish", budget: 6000, daysFromStart: 63, duration: 6 },
      { title: "Exterior siding & paint", phase: "final", budget: 8000, daysFromStart: 69, duration: 5 },
      { title: "Landscaping", phase: "final", budget: 4000, daysFromStart: 74, duration: 3 },
      { title: "Final inspections & CO", phase: "final", budget: 1000, daysFromStart: 77, duration: 3 },
      { title: "Staging & listing prep", phase: "final", budget: 3500, daysFromStart: 80, duration: 3 },
    ],
  },
];

const genId = () => crypto.randomUUID();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatCurrency(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// ─── Main App ────────────────────────────────────────────────────────
export default function FlipTimeline() {
  const [view, setView] = useState("home");
  const [projectName, setProjectName] = useState("My First Flip");
  const [editingName, setEditingName] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalBudget, setTotalBudget] = useState(75000);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showTemplates, setShowTemplates] = useState(tasks.length === 0);
  const [expandedPhases, setExpandedPhases] = useState(PHASES.reduce((a, p) => ({ ...a, [p.id]: true }), {}));

  // Auth & persistence
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchAllProjects = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    setLoadingProjects(true);
    const { data } = await supabase
      .from("flip_projects")
      .select("id, project_name, start_date, updated_at, total_budget, tasks")
      .order("updated_at", { ascending: false });
    setAllProjects(data || []);
    setLoadingProjects(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchAllProjects();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchAllProjects();
    });
    return () => subscription.unsubscribe();
  }, [fetchAllProjects]);

  const saveProject = useCallback(async () => {
    if (!user) {
      setPendingSave(true);
      setShowAuthModal(true);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const projectData = {
      user_id: user.id,
      project_name: projectName,
      start_date: startDate,
      total_budget: totalBudget,
      tasks: tasks,
    };
    if (currentProjectId) {
      await supabase.from("flip_projects").update(projectData).eq("id", currentProjectId);
    } else {
      const { data } = await supabase.from("flip_projects").insert(projectData).select("id").single();
      if (data) setCurrentProjectId(data.id);
    }
    setSaving(false);
    setLastSaved(new Date());
    fetchAllProjects();
  }, [user, projectName, startDate, totalBudget, tasks, currentProjectId, fetchAllProjects]);

  // Auto-save after auth if save was pending
  useEffect(() => {
    if (!user || !pendingSave) return;
    setPendingSave(false);
    (async () => {
      setSaving(true);
      const supabase = createClient();
      const projectData = {
        user_id: user.id,
        project_name: projectName,
        start_date: startDate,
        total_budget: totalBudget,
        tasks: tasks,
      };
      if (currentProjectId) {
        await supabase.from("flip_projects").update(projectData).eq("id", currentProjectId);
      } else {
        const { data } = await supabase.from("flip_projects").insert(projectData).select("id").single();
        if (data) setCurrentProjectId(data.id);
      }
      setSaving(false);
      setLastSaved(new Date());
    })();
  }, [user, pendingSave]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProject = useCallback(async (projectId) => {
    const supabase = createClient();
    const { data } = await supabase.from("flip_projects").select("*").eq("id", projectId).single();
    if (data) {
      setProjectName(data.project_name);
      setStartDate(data.start_date);
      setTotalBudget(data.total_budget);
      setTasks(data.tasks || []);
      setCurrentProjectId(data.id);
      setLastSaved(new Date(data.updated_at));
      setShowProjects(false);
      setShowTemplates(false);
      setView("dashboard");
    }
  }, []);

  const handleNewProject = useCallback(() => {
    setProjectName("My First Flip");
    setStartDate(new Date().toISOString().slice(0, 10));
    setTotalBudget(75000);
    setTasks([]);
    setCurrentProjectId(null);
    setLastSaved(null);
    setShowTemplates(true);
    setView("dashboard");
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setCurrentProjectId(null);
    setLastSaved(null);
  };

  // New task form
  const [newTask, setNewTask] = useState({ title: "", phase: "acquisition", budget: 0, startDate: startDate, duration: 1 });

  // ─── Derived data ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSpent = tasks.reduce((s, t) => s + (t.budget || 0), 0);
    const completed = tasks.filter((t) => t.status === "done").length;
    const overdue = tasks.filter((t) => t.status !== "done" && new Date(t.endDate) < new Date()).length;
    const phaseBreakdown = PHASES.map((p) => {
      const phaseTasks = tasks.filter((t) => t.phase === p.id);
      return {
        ...p,
        taskCount: phaseTasks.length,
        completed: phaseTasks.filter((t) => t.status === "done").length,
        budget: phaseTasks.reduce((s, t) => s + (t.budget || 0), 0),
      };
    });
    const earliestStart = tasks.length ? tasks.reduce((m, t) => (t.startDate < m ? t.startDate : m), tasks[0].startDate) : startDate;
    const latestEnd = tasks.length ? tasks.reduce((m, t) => (t.endDate > m ? t.endDate : m), tasks[0].endDate) : startDate;
    return { totalSpent, completed, total: tasks.length, overdue, phaseBreakdown, earliestStart, latestEnd };
  }, [tasks, startDate]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const addTask = useCallback(() => {
    if (!newTask.title.trim()) return;
    const endDate = addDays(newTask.startDate, newTask.duration);
    setTasks((prev) => [...prev, { id: genId(), ...newTask, endDate, status: "todo" }]);
    setNewTask({ title: "", phase: "acquisition", budget: 0, startDate, duration: 1 });
    setShowNewTask(false);
    setShowTemplates(false);
  }, [newTask, startDate]);

  const loadTemplate = useCallback(
    (template) => {
      const newTasks = template.tasks.map((t) => ({
        id: genId(),
        title: t.title,
        phase: t.phase,
        budget: t.budget,
        startDate: addDays(startDate, t.daysFromStart),
        endDate: addDays(startDate, t.daysFromStart + t.duration),
        duration: t.duration,
        status: "todo",
      }));
      setTasks(newTasks);
      setShowTemplates(false);
    },
    [startDate]
  );

  const toggleTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t)));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const togglePhase = (id) => setExpandedPhases((p) => ({ ...p, [id]: !p[id] }));

  // ─── Styles ────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: "home", label: "Projects", icon: Home },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "tasks", label: "Tasks", icon: LayoutList },
    { id: "timeline", label: "Timeline", icon: CalendarDays },
    { id: "budget", label: "Budget", icon: DollarSign },
  ];

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => { setView("home"); if (user) fetchAllProjects(); }} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} color="#fff" />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>FlipTimeline</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Renovation Project Tracker</div>
          </div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editingName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ fontSize: 14, padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 6, outline: "none" }} autoFocus onKeyDown={(e) => e.key === "Enter" && setEditingName(false)} />
              <button onClick={() => setEditingName(false)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#334155" }}>
              <FolderOpen size={16} color="#64748b" /> {projectName} <Edit3 size={13} color="#94a3b8" />
            </button>
          )}

          <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />

          {/* Save Project */}
          <button
            onClick={saveProject}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600,
              background: lastSaved ? "#f0fdf4" : "#6366f1", color: lastSaved ? "#16a34a" : "#fff",
              border: lastSaved ? "1px solid #bbf7d0" : "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.15s", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {saving ? "Saving..." : lastSaved ? "Saved" : "Save Project"}
          </button>

          {/* My Projects (only when signed in) */}
          {user && (
            <button
              onClick={() => setShowProjects(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 500,
                background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer",
              }}
            >
              <FolderOpen size={14} /> My Projects
            </button>
          )}

          {/* User / Auth */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={14} color="#fff" />
              </div>
              <button
                onClick={handleSignOut}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
                title="Sign out"
              >
                <LogOut size={14} color="#94a3b8" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 500,
                background: "none", color: "#6366f1", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer",
              }}
            >
              <User size={14} /> Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Nav ── */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", gap: 4 }}>
        {NAV_ITEMS.map((n) => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? "#6366f1" : "#64748b", background: "none", border: "none", borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <Icon size={16} /> {n.label}
            </button>
          );
        })}
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        {/* ── Projects Home View ── */}
        {view === "home" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>My Projects</div>
                <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                  {user ? `${allProjects.length} saved project${allProjects.length !== 1 ? "s" : ""}` : "Sign in to save and manage your projects"}
                </div>
              </div>
              <button
                onClick={handleNewProject}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600,
                  background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                }}
              >
                <Plus size={16} /> New Project
              </button>
            </div>

            {!user ? (
              <div style={{ textAlign: "center", padding: 64, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <FolderOpen size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Sign in to view your projects</div>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
                  Create an account or sign in to save renovation projects and access them from anywhere.
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600,
                    background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                  }}
                >
                  <User size={16} /> Sign In
                </button>
              </div>
            ) : loadingProjects ? (
              <div style={{ textAlign: "center", padding: 64, color: "#94a3b8" }}>
                <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
                <div style={{ fontSize: 14 }}>Loading projects...</div>
              </div>
            ) : allProjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: 64, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <FolderOpen size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No projects yet</div>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
                  Create your first renovation project to get started.
                </div>
                <button
                  onClick={handleNewProject}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600,
                    background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                  }}
                >
                  <Plus size={16} /> Create Project
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {allProjects.map((project) => {
                  const taskCount = Array.isArray(project.tasks) ? project.tasks.length : 0;
                  const completedCount = Array.isArray(project.tasks) ? project.tasks.filter((t) => t.status === "done").length : 0;
                  const pct = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
                  const isCurrent = project.id === currentProjectId;
                  const spent = Array.isArray(project.tasks) ? project.tasks.reduce((s, t) => s + (t.budget || 0), 0) : 0;

                  return (
                    <button
                      key={project.id}
                      onClick={() => loadProject(project.id)}
                      style={{
                        textAlign: "left", background: isCurrent ? "#eef2ff" : "#fff",
                        border: `1px solid ${isCurrent ? "#6366f1" : "#e2e8f0"}`, borderRadius: 16, padding: 24,
                        cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        display: "flex", flexDirection: "column", gap: 16,
                      }}
                      onMouseEnter={(e) => { if (!isCurrent) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.1)"; } }}
                      onMouseLeave={(e) => { if (!isCurrent) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; } }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{project.project_name}</span>
                            {isCurrent && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "#6366f1", color: "#fff", borderRadius: 6 }}>
                                Active
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} />
                            {new Date(project.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{completedCount}/{taskCount} tasks</span>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                      </div>

                      {/* Budget */}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#64748b" }}>Budget</span>
                        <span style={{ fontWeight: 700, color: spent > project.total_budget ? "#ef4444" : "#0f172a" }}>
                          {formatCurrency(spent)} / {formatCurrency(project.total_budget)}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* New project card */}
                <button
                  onClick={handleNewProject}
                  style={{
                    textAlign: "left", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: 16,
                    padding: 24, cursor: "pointer", transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                    minHeight: 180,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}
                >
                  <Plus size={28} color="#94a3b8" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>New Project</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Template Chooser ── */}
        {showTemplates && tasks.length === 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Get started with a template</div>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, marginTop: 0 }}>Choose a renovation template to pre-fill your project, or start from scratch.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => loadTemplate(t)}
                  style={{
                    textAlign: "left", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, cursor: "pointer",
                    transition: "all 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"; }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>{t.description}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.tasks.length} tasks &middot; {formatCurrency(t.tasks.reduce((s, tk) => s + tk.budget, 0))} est. budget</div>
                </button>
              ))}
              <button
                onClick={() => { setShowTemplates(false); setShowNewTask(true); }}
                style={{
                  textAlign: "left", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: 12, padding: 20, cursor: "pointer",
                  transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Plus size={24} color="#94a3b8" />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Start from Scratch</div>
              </button>
            </div>
          </div>
        )}

        {/* ── Dashboard View ── */}
        {view === "dashboard" && (
          <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total Tasks", value: stats.total, sub: `${stats.completed} completed`, color: "#6366f1", icon: LayoutList },
                { label: "Budget Used", value: formatCurrency(stats.totalSpent), sub: `of ${formatCurrency(totalBudget)}`, color: "#10b981", icon: DollarSign },
                { label: "Budget Remaining", value: formatCurrency(totalBudget - stats.totalSpent), sub: totalBudget - stats.totalSpent < 0 ? "Over budget!" : `${Math.round(((totalBudget - stats.totalSpent) / totalBudget) * 100)}% left`, color: totalBudget - stats.totalSpent < 0 ? "#ef4444" : "#3b82f6", icon: TrendingUp },
                { label: "Overdue", value: stats.overdue, sub: stats.overdue > 0 ? "Needs attention" : "All on track", color: stats.overdue > 0 ? "#f59e0b" : "#10b981", icon: stats.overdue > 0 ? AlertTriangle : CheckCircle2 },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{c.label}</span>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + "14", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} color={c.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>{c.value}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{c.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Progress by phase */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Progress by Phase</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {stats.phaseBreakdown.map((p) => {
                  const pct = p.taskCount > 0 ? Math.round((p.completed / p.taskCount) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{p.label}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          {p.completed}/{p.taskCount} tasks &middot; {formatCurrency(p.budget)}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: p.color, borderRadius: 4, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget bar */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginTop: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Overall Budget</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Total: </span>
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    style={{ width: 100, fontSize: 13, fontWeight: 600, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "right", outline: "none" }}
                  />
                </div>
              </div>
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 7, overflow: "hidden", position: "relative" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (stats.totalSpent / totalBudget) * 100)}%`, background: stats.totalSpent > totalBudget ? "linear-gradient(90deg, #ef4444, #f87171)" : "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 7, transition: "width 0.3s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>{formatCurrency(stats.totalSpent)} spent</span>
                <span style={{ fontSize: 12, color: stats.totalSpent > totalBudget ? "#ef4444" : "#64748b", fontWeight: stats.totalSpent > totalBudget ? 700 : 400 }}>
                  {stats.totalSpent > totalBudget ? `${formatCurrency(stats.totalSpent - totalBudget)} over!` : `${formatCurrency(totalBudget - stats.totalSpent)} remaining`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tasks View ── */}
        {view === "tasks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Tasks</div>
              <div style={{ display: "flex", gap: 8 }}>
                {tasks.length > 0 && (
                  <button onClick={() => setShowTemplates(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Load Template
                  </button>
                )}
                <button onClick={() => setShowNewTask(!showNewTask)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  <Plus size={15} /> Add Task
                </button>
              </div>
            </div>

            {/* New task form */}
            {showNewTask && (
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginBottom: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>New Task</span>
                  <button onClick={() => setShowNewTask(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={16} color="#94a3b8" /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Task Name</label>
                    <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Install kitchen cabinets" style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} onKeyDown={(e) => e.key === "Enter" && addTask()} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Phase</label>
                    <select value={newTask.phase} onChange={(e) => setNewTask({ ...newTask, phase: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}>
                      {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Budget ($)</label>
                    <input type="number" value={newTask.budget} onChange={(e) => setNewTask({ ...newTask, budget: Number(e.target.value) })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Start Date</label>
                    <input type="date" value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Duration (days)</label>
                    <input type="number" min="1" value={newTask.duration} onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={addTask} style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Add Task
                  </button>
                </div>
              </div>
            )}

            {/* Task list grouped by phase */}
            {tasks.length === 0 && !showTemplates ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                <LayoutList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No tasks yet</div>
                <div style={{ fontSize: 13 }}>Add a task or load a template to get started.</div>
              </div>
            ) : (
              PHASES.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase.id);
                if (phaseTasks.length === 0) return null;
                const PhaseIcon = PHASE_ICON_MAP[phase.icon];
                return (
                  <div key={phase.id} style={{ marginBottom: 12 }}>
                    <button onClick={() => togglePhase(phase.id)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "8px 0", width: "100%" }}>
                      {expandedPhases[phase.id] ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: phase.color }} />
                      {PhaseIcon && <PhaseIcon size={15} color={phase.color} />}
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{phase.label}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>({phaseTasks.filter((t) => t.status === "done").length}/{phaseTasks.length})</span>
                    </button>
                    {expandedPhases[phase.id] && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8 }}>
                        {phaseTasks.map((task) => {
                          const overdue = task.status !== "done" && new Date(task.endDate) < new Date();
                          return (
                            <div
                              key={task.id}
                              style={{
                                display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 10, padding: "12px 16px",
                                border: `1px solid ${overdue ? "#fde68a" : "#e2e8f0"}`, boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                opacity: task.status === "done" ? 0.6 : 1,
                              }}
                            >
                              <button onClick={() => toggleTask(task.id)} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, border: task.status === "done" ? "none" : "2px solid #cbd5e1", background: task.status === "done" ? phase.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                                {task.status === "done" && <Check size={13} color="#fff" strokeWidth={3} />}
                              </button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CalendarDays size={11} /> {task.startDate} → {task.endDate}</span>
                                  {overdue && <span style={{ color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={11} /> Overdue</span>}
                                </div>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>{formatCurrency(task.budget)}</div>
                              <button onClick={() => deleteTask(task.id)} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4 }}>
                                <Trash2 size={14} color="#cbd5e1" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Timeline View ── */}
        {view === "timeline" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Timeline</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Project Start:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }} />
            </div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                <CalendarDays size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No tasks to display</div>
                <div style={{ fontSize: 13 }}>Add tasks to see your renovation timeline.</div>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                {(() => {
                  const earliest = tasks.reduce((m, t) => (t.startDate < m ? t.startDate : m), tasks[0].startDate);
                  const latest = tasks.reduce((m, t) => (t.endDate > m ? t.endDate : m), tasks[0].endDate);
                  const totalDays = Math.max(daysBetween(earliest, latest), 1);
                  const weeksCount = Math.ceil(totalDays / 7);
                  const weeks = Array.from({ length: weeksCount + 1 }, (_, i) => {
                    const d = new Date(earliest);
                    d.setDate(d.getDate() + i * 7);
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  });

                  return (
                    <div style={{ overflowX: "auto" }}>
                      {/* Week headers */}
                      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", paddingLeft: 200, minWidth: Math.max(600, weeksCount * 80) }}>
                        {weeks.map((w, i) => (
                          <div key={i} style={{ width: 80, flexShrink: 0, textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 600, padding: "8px 0", borderLeft: "1px solid #f1f5f9" }}>{w}</div>
                        ))}
                      </div>
                      {/* Bars by phase */}
                      {PHASES.map((phase) => {
                        const phaseTasks = tasks.filter((t) => t.phase === phase.id);
                        if (phaseTasks.length === 0) return null;
                        return (
                          <div key={phase.id}>
                            <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: phase.color, background: phase.color + "08", borderBottom: "1px solid #f1f5f9" }}>{phase.label}</div>
                            {phaseTasks.map((task) => {
                              const offsetDays = daysBetween(earliest, task.startDate);
                              const durationDays = daysBetween(task.startDate, task.endDate);
                              const leftPct = (offsetDays / totalDays) * 100;
                              const widthPct = Math.max((durationDays / totalDays) * 100, 1);
                              return (
                                <div key={task.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f8fafc", minWidth: Math.max(600, weeksCount * 80) }}>
                                  <div style={{ width: 200, flexShrink: 0, padding: "8px 12px", fontSize: 12, color: "#334155", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: task.status === "done" ? 0.5 : 1 }}>
                                    {task.status === "done" && <Check size={11} color={phase.color} style={{ marginRight: 4 }} />}
                                    {task.title}
                                  </div>
                                  <div style={{ flex: 1, position: "relative", height: 28 }}>
                                    <div
                                      style={{
                                        position: "absolute", top: 6, left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 4, height: 16,
                                        background: task.status === "done" ? phase.color + "60" : phase.color, borderRadius: 4,
                                        transition: "all 0.2s",
                                      }}
                                      title={`${task.title}: ${task.startDate} → ${task.endDate} (${formatCurrency(task.budget)})`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
            {/* Phase legend */}
            {tasks.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14, justifyContent: "center" }}>
                {PHASES.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} /> {p.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Budget View ── */}
        {view === "budget" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Budget Breakdown</div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                <DollarSign size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No budget data</div>
                <div style={{ fontSize: 13 }}>Add tasks with budgets to see your financial breakdown.</div>
              </div>
            ) : (
              <div>
                {/* Summary bar */}
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginBottom: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Total Estimated Cost</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>{formatCurrency(stats.totalSpent)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Project Budget</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: stats.totalSpent > totalBudget ? "#ef4444" : "#10b981", letterSpacing: "-0.03em" }}>{formatCurrency(totalBudget)}</div>
                    </div>
                  </div>
                  <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (stats.totalSpent / totalBudget) * 100)}%`, background: stats.totalSpent > totalBudget ? "#ef4444" : "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 6 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, textAlign: "center" }}>{Math.round((stats.totalSpent / totalBudget) * 100)}% of budget allocated</div>
                </div>

                {/* Phase breakdown */}
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>By Phase</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {stats.phaseBreakdown.filter((p) => p.budget > 0).sort((a, b) => b.budget - a.budget).map((p) => {
                      const pct = (p.budget / stats.totalSpent) * 100;
                      return (
                        <div key={p.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{p.label}</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "#94a3b8" }}>{Math.round(pct)}%</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", minWidth: 70, textAlign: "right" }}>{formatCurrency(p.budget)}</span>
                            </div>
                          </div>
                          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: p.color, borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top expenses */}
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginTop: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Top Expenses</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[...tasks].sort((a, b) => b.budget - a.budget).slice(0, 5).map((t, i) => {
                      const phase = PHASES.find((p) => p.id === t.phase);
                      return (
                        <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, width: 18 }}>#{i + 1}</span>
                            <div style={{ width: 6, height: 6, borderRadius: 2, background: phase?.color || "#94a3b8" }} />
                            <span style={{ fontSize: 13, color: "#334155" }}>{t.title}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(t.budget)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "24px 0 16px", fontSize: 11, color: "#cbd5e1" }}>
        FlipTimeline MVP &middot; Built for property flippers
      </footer>

      {/* ── Modals ── */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingSave(false); }}
        onAuthSuccess={() => setShowAuthModal(false)}
      />
      <ProjectsDrawer
        isOpen={showProjects}
        onClose={() => setShowProjects(false)}
        onLoadProject={loadProject}
        onNewProject={handleNewProject}
        currentProjectId={currentProjectId}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
