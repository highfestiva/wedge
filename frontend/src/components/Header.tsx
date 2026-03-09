import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "urql";
import { PROJECTS_QUERY } from "../graphql/queries";
import { ThemeToggle } from "./ThemeToggle";
import { ProjectSelector } from "./ProjectSelector";
import type { Project } from "../types";

export const Header: React.FC = () => {
  const { projectPrefix } = useParams<{ projectPrefix: string }>();
  const navigate = useNavigate();

  const [queryResult] = useQuery({ query: PROJECTS_QUERY });
  const projects: Project[] = queryResult.data?.projects ?? [];

  const handleSelect = (prefix: string) => {
    navigate(`/projects/${prefix}/board`);
  };

  return (
    <header data-testid="header" className="app-header">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-soft/15 ring-1 ring-accent-soft/50">
          <span className="text-sm font-semibold text-accent-soft">W</span>
        </div>
        <div>
          <h1 className="app-title">Wedge</h1>
          <p className="text-xs text-slate-400">
            An almost sensible issue tracker.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ProjectSelector
          projects={projects}
          currentProjectPrefix={projectPrefix}
          onSelect={handleSelect}
        />
        <ThemeToggle />
      </div>
    </header>
  );
};
