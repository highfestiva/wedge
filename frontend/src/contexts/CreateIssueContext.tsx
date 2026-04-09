import { createContext, useContext, useState, PropsWithChildren } from "react";

type Handler = (() => void) | null;

const Ctx = createContext<{
  onCreateIssue: Handler;
  setOnCreateIssue: (fn: Handler) => void;
}>({ onCreateIssue: null, setOnCreateIssue: () => {} });

export const useCreateIssueAction = () => useContext(Ctx);

export function CreateIssueActionProvider({ children }: PropsWithChildren) {
  const [onCreateIssue, setOnCreateIssue] = useState<Handler>(null);
  return <Ctx.Provider value={{ onCreateIssue, setOnCreateIssue }}>{children}</Ctx.Provider>;
};
