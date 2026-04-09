import React, { useEffect } from "react";

export interface ModalOverlayProps {
  onOverlayClick?: () => void;
  children: React.ReactNode;
}

export function ModalOverlay({ onOverlayClick, children }: ModalOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOverlayClick?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOverlayClick]);

  return (
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOverlayClick?.();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
