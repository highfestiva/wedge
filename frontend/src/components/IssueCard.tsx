import React from "react";
import type { Issue } from "../types";

export interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

const priorityDot: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
  none: "bg-slate-600",
};

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const initials = issue.assignee
    ? issue.assignee
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "—";

  return (
    <div
      data-testid={`issue-card-${issue.identifier}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      role="button"
      tabIndex={0}
      className="card group"
    >
      <div className="flex items-center justify-between gap-2">
        <span data-testid="issue-identifier" className="text-[11px] font-medium text-slate-500">
          {issue.identifier}
        </span>
        <span
          data-testid="issue-assignee"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700/80 text-[9px] font-semibold text-slate-300"
          title={issue.assignee ?? "Unassigned"}
        >
          {initials}
        </span>
      </div>
      <p data-testid="issue-title" className="mt-1.5 text-[13px] leading-snug text-slate-200 line-clamp-2">
        {issue.title}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[issue.priority] ?? "bg-slate-600"}`} />
        <span data-testid="issue-priority" className="text-[11px] text-slate-500 capitalize">
          {issue.priority}
        </span>
      </div>
    </div>
  );
};
