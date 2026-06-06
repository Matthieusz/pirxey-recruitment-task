import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

globalThis.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line class-methods-use-this
  observe() {}
  // eslint-disable-next-line class-methods-use-this
  unobserve() {}
  disconnect() {}
};
