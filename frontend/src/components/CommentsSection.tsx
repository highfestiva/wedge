import React, { useState } from "react";
import type { Comment } from "../types";

export interface CommentsSectionProps {
  comments: Comment[];
  onAddComment?: (body: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  onAddComment,
}) => {
  const [body, setBody] = useState("");

  const handleSubmit = () => {
    if (!body.trim()) return;
    onAddComment?.(body);
    setBody("");
  };

  return (
    <div data-testid="comments-section" className="space-y-3">
      <h3 className="label-text">Comments</h3>

      {comments.length === 0 && (
        <p className="text-xs text-slate-600">No comments yet.</p>
      )}

      <div className="space-y-2">
        {comments.map((c) => (
          <div
            key={c.id}
            data-testid={`comment-${c.id}`}
            className="rounded-lg bg-slate-800/30 border border-slate-800/40 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <strong data-testid="comment-author" className="text-xs font-semibold text-slate-300">
                {c.author}
              </strong>
              <time data-testid="comment-time" className="text-[11px] text-slate-600">
                {c.createdAt}
              </time>
            </div>
            <p data-testid="comment-body" className="text-sm text-slate-300 leading-relaxed">
              {c.body}
            </p>
          </div>
        ))}
      </div>

      <textarea
        data-testid="comment-input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment…"
        className="form-textarea min-h-[60px]"
      />
      <div className="flex justify-end">
        <button
          data-testid="comment-submit"
          onClick={handleSubmit}
          disabled={!body.trim()}
          className="primary-button text-xs px-3.5 py-1.5"
        >
          Submit
        </button>
      </div>
    </div>
  );
};
