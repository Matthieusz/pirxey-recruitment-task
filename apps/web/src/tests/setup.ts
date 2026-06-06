import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// Polyfill for <search> element — valid HTML5 but jsdom doesn't recognise it.
// Without this, React emits a stderr warning:
// "The tag <search> is unrecognized in this browser."
if (typeof window !== "undefined" && !window.customElements?.get("search")) {
  try {
    window.customElements.define("search", class extends HTMLElement {});
  } catch {
    // jsdom may already define it or not support customElements — safe to ignore
  }
}

// Mock ResizeObserver for @tanstack/react-virtual
globalThis.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line class-methods-use-this
  observe() {}
  // eslint-disable-next-line class-methods-use-this
  unobserve() {}
  disconnect() {}
};
