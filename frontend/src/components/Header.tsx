import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { ProjectSelector } from "./ProjectSelector";

export const Header: React.FC = () => {
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
        <ProjectSelector projects={[]} />
        <ThemeToggle />
      </div>
    </header>
  );
};
