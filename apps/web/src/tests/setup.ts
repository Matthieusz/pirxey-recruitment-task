import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

const unknownElementTag = "[object HTMLUnknownElement]";

const createSearchElement = () => document.createElement("search");

const doesBrowserSupportSearchElement =
  Object.prototype.toString.call(createSearchElement()) !== unknownElementTag;

if (!doesBrowserSupportSearchElement) {
  const originalCreateElement = document.createElement.bind(document);

  function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions
  ): HTMLElementTagNameMap[K];
  function createElement<K extends keyof HTMLElementDeprecatedTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions
  ): HTMLElementDeprecatedTagNameMap[K];
  function createElement(
    tagName: string,
    options?: ElementCreationOptions
  ): HTMLElement {
    const element = originalCreateElement(tagName, options);

    if (tagName.toLowerCase() === "search") {
      Object.defineProperty(element, Symbol.toStringTag, {
        configurable: true,
        value: "HTMLElement",
      });
    }

    return element;
  }

  document.createElement = createElement;
}

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
