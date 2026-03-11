import React from "react";
import type { Project } from "../types";

export interface ProjectSelectorProps {
  projects: Project[];
  currentProjectPrefix?: string;
  onSelect?: (prefix: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProjectPrefix,
  onSelect,
}) => {
  return (
    <div>
      <label htmlFor="project-selector" className="project-select-label">
        Project
      </label>
      <select
        id="project-selector"
        data-testid="project-selector"
        value={currentProjectPrefix ?? ""}
        onChange={(e) => onSelect?.(e.target.value)}
        className="form-select w-auto min-w-[120px]"
      >
        {projects.map((p) => (
          <option key={p.prefix} value={p.prefix} data-testid={`project-option-${p.prefix}`}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
};
