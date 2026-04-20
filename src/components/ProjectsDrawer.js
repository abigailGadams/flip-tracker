"use client";

import { useState, useEffect } from "react";
import { X, Trash2, FolderOpen, Plus, Loader2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ProjectsDrawer({ isOpen, onClose, onLoadProject, onNewProject, currentProjectId }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (isOpen) fetchProjects();
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("flip_projects")
      .select("id, project_name, updated_at, total_budget, tasks")
      .order("updated_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const deleteProject = async (id) => {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("flip_projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", justifyContent: "flex-end", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, background: "#fff", height: "100%",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>My Projects</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{projects.length} saved project{projects.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* New project button */}
        <div style={{ padding: "12px 24px" }}>
          <button
            onClick={() => { onNewProject(); onClose(); }}
            style={{
              width: "100%", padding: "10px 16px", fontSize: 13, fontWeight: 600,
              background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: 10,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, color: "#64748b", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Projects list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
              <FolderOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No saved projects</div>
              <div style={{ fontSize: 13 }}>Create a project and hit Save to see it here.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {projects.map((project) => {
                const taskCount = Array.isArray(project.tasks) ? project.tasks.length : 0;
                const isCurrent = project.id === currentProjectId;
                return (
                  <div
                    key={project.id}
                    style={{
                      background: isCurrent ? "#eef2ff" : "#fff",
                      border: `1px solid ${isCurrent ? "#6366f1" : "#e2e8f0"}`,
                      borderRadius: 12, padding: 16, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => onLoadProject(project.id)}
                    onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.borderColor = "#6366f1"; }}
                    onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{project.project_name}</span>
                          {isCurrent && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", background: "#6366f1", color: "#fff", borderRadius: 4 }}>
                              Current
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 12 }}>
                          <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
                          <span>${(project.total_budget || 0).toLocaleString()} budget</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={10} />
                          {new Date(project.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this project?")) deleteProject(project.id);
                        }}
                        disabled={deleting === project.id}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                      >
                        {deleting === project.id ? (
                          <Loader2 size={14} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 size={14} color="#cbd5e1" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
