import React from "react";
import type { Project } from "../types";

export interface ProjectSelectorProps {
  projects: Project[];
  currentProjectId?: string;
  onSelect?: (projectId: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProjectId,
  onSelect,
}) => {
  return (
    <select
      data-testid="project-selector"
      value={currentProjectId ?? ""}
      onChange={(e) => onSelect?.(e.target.value)}
      className="form-select w-auto min-w-[120px]"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id} data-testid={`project-option-${p.id}`}>
          {p.name}
        </option>
      ))}
    </select>
  );
};
