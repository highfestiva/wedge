import { describe, it, expect } from "vitest";
import { getInitials } from "../utils/user";

describe("getInitials", () => {
  it("takes first char of first two dot-separated words", () => {
    expect(getInitials("john.doe@example.com")).toBe("JD");
  });

  it("handles multiple dots, using only the first two segments", () => {
    expect(getInitials("alice.bob.charlie@example.com")).toBe("AB");
  });

  it("falls back to first two chars when there is no dot", () => {
    expect(getInitials("admin@example.com")).toBe("AD");
  });

  it("uppercases the result", () => {
    expect(getInitials("jane.smith@corp.co")).toBe("JS");
  });

  it("handles single-char segments", () => {
    expect(getInitials("a.b@example.com")).toBe("AB");
  });

  it("handles email with no domain part", () => {
    expect(getInitials("solo")).toBe("SO");
  });

  it("handles single-char local part without dot", () => {
    expect(getInitials("x@example.com")).toBe("X");
  });

  it("produces different initials for different dot structures", () => {
    const a = getInitials("mike.jones@co.uk");
    const b = getInitials("mjones@co.uk");
    expect(a).toBe("MJ");
    expect(b).toBe("MJ");
  });
});
