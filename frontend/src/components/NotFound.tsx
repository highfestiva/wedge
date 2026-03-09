import React from "react";

export const NotFound: React.FC = () => {
  return (
    <div data-testid="not-found-page" className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl font-bold text-t-ghost">404</div>
      <h1 className="mt-4 text-lg font-semibold text-t-tertiary">Page Not Found</h1>
      <p className="mt-2 text-sm text-t-faint">The page you are looking for does not exist.</p>
    </div>
  );
};
