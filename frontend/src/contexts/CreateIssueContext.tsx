import React, { createContext, useContext, useState } from "react";

type Handler = (() => void) | null;

const Ctx = createContext<{
  onCreateIssue: Handler;
  setOnCreateIssue: (fn: Handler) => void;
}>({ onCreateIssue: null, setOnCreateIssue: () => {} });

export const useCreateIssueAction = () => useContext(Ctx);

export const CreateIssueActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onCreateIssue, setOnCreateIssue] = useState<Handler>(null);
  return <Ctx.Provider value={{ onCreateIssue, setOnCreateIssue }}>{children}</Ctx.Provider>;
};
