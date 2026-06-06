import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("does not update before the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { delay: 300, value: "hello" } }
    );

    rerender({ delay: 300, value: "world" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("hello");
  });

  it("updates after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { delay: 300, value: "hello" } }
    );

    rerender({ delay: 300, value: "world" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("world");
  });

  it("cancels previous timer on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { delay: 300, value: "a" } }
    );

    rerender({ delay: 300, value: "b" });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender({ delay: 300, value: "c" });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    // Only 150ms total since last change, not yet updated
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    // Now 300ms since "c", should update
    expect(result.current).toBe("c");
  });

  it("clears timeout on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useDebouncedValue("hello", 300)
    );
    expect(result.current).toBe("hello");
    unmount();
    // Should not throw
  });
});
