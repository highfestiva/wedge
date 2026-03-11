import React from "react";
import type { Issue } from "../types";
import { getInitials, hashColor } from "../utils/user";

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
  const initials = issue.assignee ? getInitials(issue.assignee) : "—";
  const avatarStyle = issue.assignee
    ? { backgroundColor: hashColor(issue.assignee) }
    : undefined;

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
        <span data-testid="issue-identifier" className="text-[11px] font-medium text-t-faint">
          {issue.identifier}
        </span>
        <span
          data-testid="issue-assignee"
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold ${issue.assignee ? "text-white" : "bg-t-avatar text-t-tertiary"}`}
          style={avatarStyle}
          title={issue.assignee ?? "Unassigned"}
        >
          {initials}
        </span>
      </div>
      <p data-testid="issue-title" className="mt-1.5 text-[13px] leading-snug text-t-secondary line-clamp-2">
        {issue.title}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[issue.priority] ?? "bg-slate-600"}`} />
        <span data-testid="issue-priority" className="text-[11px] text-t-faint capitalize">
          {issue.priority}
        </span>
      </div>
    </div>
  );
};
