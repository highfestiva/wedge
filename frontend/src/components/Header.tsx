import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "urql";
import { PROJECTS_QUERY } from "../graphql/queries";
import { useCreateIssueAction } from "../contexts/CreateIssueContext";
import { ThemeToggle } from "./ThemeToggle";
import { ProjectSelector } from "./ProjectSelector";
import type { Project } from "../types";

export const Header: React.FC = () => {
  const { projectPrefix } = useParams<{ projectPrefix: string }>();
  const navigate = useNavigate();
  const { onCreateIssue } = useCreateIssueAction();

  const [queryResult] = useQuery({ query: PROJECTS_QUERY });
  const projects: Project[] = queryResult.data?.projects ?? [];

  const handleSelect = (prefix: string) => {
    navigate(`/projects/${prefix}/board`);
  };

  return (
    <header data-testid="header" className="app-header">
      <div className="flex items-center gap-3">
        <img src="/img/logo.png" alt="Wedge" className="h-9 w-9 object-contain" />
        <div>
          <h1 className="app-title">Wedge</h1>
          <p className="text-xs text-t-muted">
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
        <div className="mx-1 h-6 w-px bg-t-border-input opacity-50" />
        {onCreateIssue && (
          <button
            data-testid="create-issue-btn"
            onClick={onCreateIssue}
            title="Create Issue"
            className="group flex h-[39px] w-[39px] items-center justify-center rounded-lg border border-[var(--t-border-input)] bg-gradient-to-b from-t-surface to-t-inset shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.05)] transition-all hover:shadow-[inset_0_3px_6px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.45)] active:scale-95"
          >
            <svg className="h-5 w-5 text-t-muted group-hover:text-accent-soft" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="10" y1="4" x2="10" y2="16" />
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};
