import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RatingDisplay } from "./rating";

describe("RatingDisplay", () => {
  it("announces the rating to assistive tech", () => {
    render(<RatingDisplay value={4} />);
    expect(screen.getByText("Rated 4 of 5.")).toBeInTheDocument();
  });

  it("renders a visible n/5 numeric label in mono", () => {
    render(<RatingDisplay value={3} />);
    const label = screen.getByText("3/5");
    expect(label).toBeInTheDocument();
    expect(label.className).toContain("font-mono");
    expect(label.className).toContain("tabular-nums");
    expect(label.className).toContain("text-ink-soft");
  });

  it("fills exactly the number of ticks equal to the value", () => {
    const { container } = render(<RatingDisplay value={2} />);
    const marks = container.querySelectorAll("[aria-hidden='true'] > span");
    const filled = [...marks].filter((mark) =>
      mark.className.includes("bg-magenta")
    );
    expect(filled).toHaveLength(2);
  });
});
