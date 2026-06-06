import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for @tanstack/react-virtual
globalThis.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line class-methods-use-this
  disconnect(): void {
    // no-op for jsdom
  }

  // eslint-disable-next-line class-methods-use-this
  unobserve(): void {
    // no-op for jsdom
  }

  #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }

  observe(element: Element): void {
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      this.#callback(
        [
          {
            contentRect: rect as DOMRectReadOnly,
            target: element,
          } as ResizeObserverEntry,
        ],
        this
      );
    });
    void id;
  }
};

// Mock getBoundingClientRect for @tanstack/react-virtual
Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    bottom: 800,
    height: 800,
    left: 0,
    right: 1024,
    toJSON: () => ({}),
    top: 0,
    width: 1024,
    x: 0,
    y: 0,
  };
};

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = function scrollIntoView() {
  // no-op for jsdom
};

// Mock matchMedia for theme/media queries
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({
    addEventListener: () => {
      // no-op for jsdom
    },
    dispatchEvent: () => false,
    matches: false,
    media: query,
    removeEventListener: () => {
      // no-op for jsdom
    },
  }),
  writable: true,
});
