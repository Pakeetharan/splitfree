import { describe, expect, it } from "vitest";
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateExactSplit,
  validatePercentageSplit,
  validateSharesSplit,
  baseSplitAmount,
} from "./split-calculator";

function sum(results: { amountCents: number }[]): number {
  return results.reduce((s, r) => s + r.amountCents, 0);
}

describe("calculateEqualSplit", () => {
  it("splits evenly when it divides cleanly", () => {
    const result = calculateEqualSplit(9000, ["a", "b", "c"]);
    expect(result.map((r) => r.amountCents)).toEqual([3000, 3000, 3000]);
    expect(sum(result)).toBe(9000);
  });

  it("distributes the remainder to the first members by index", () => {
    const result = calculateEqualSplit(8500, ["a", "b", "c"]);
    expect(result.map((r) => r.amountCents)).toEqual([2834, 2833, 2833]);
    expect(sum(result)).toBe(8500);
  });

  it("returns an empty array for no members", () => {
    expect(calculateEqualSplit(1000, [])).toEqual([]);
  });
});

describe("exact split", () => {
  it("passes through the given cent amounts", () => {
    const values = [
      { memberId: "a", value: 3000 },
      { memberId: "b", value: 6000 },
    ];
    const result = calculateExactSplit(9000, values);
    expect(result).toEqual([
      { memberId: "a", amountCents: 3000 },
      { memberId: "b", amountCents: 6000 },
    ]);
  });

  it("validates that amounts sum to the total", () => {
    expect(
      validateExactSplit(9000, [
        { memberId: "a", value: 3000 },
        { memberId: "b", value: 6000 },
      ]),
    ).toBeNull();

    expect(
      validateExactSplit(9000, [
        { memberId: "a", value: 3000 },
        { memberId: "b", value: 5000 },
      ]),
    ).not.toBeNull();
  });

  it("rejects negative amounts", () => {
    expect(
      validateExactSplit(9000, [
        { memberId: "a", value: -100 },
        { memberId: "b", value: 9100 },
      ]),
    ).not.toBeNull();
  });
});

describe("percentage split", () => {
  it("distributes proportionally and sums exactly to the total", () => {
    const values = [
      { memberId: "a", value: 34 },
      { memberId: "b", value: 33 },
      { memberId: "c", value: 33 },
    ];
    const result = calculatePercentageSplit(10000, values);
    expect(sum(result)).toBe(10000);
    expect(result.find((r) => r.memberId === "a")?.amountCents).toBe(3400);
  });

  it("distributes the rounding remainder without losing a cent", () => {
    // 100 / 3 members at equal thirds doesn't divide cleanly
    const values = [
      { memberId: "a", value: 34 },
      { memberId: "b", value: 33 },
      { memberId: "c", value: 33 },
    ];
    const result = calculatePercentageSplit(100, values);
    expect(sum(result)).toBe(100);
  });

  it("validates percentages sum to 100", () => {
    expect(
      validatePercentageSplit([
        { memberId: "a", value: 50 },
        { memberId: "b", value: 50 },
      ]),
    ).toBeNull();

    expect(
      validatePercentageSplit([
        { memberId: "a", value: 50 },
        { memberId: "b", value: 40 },
      ]),
    ).not.toBeNull();
  });
});

describe("shares split", () => {
  it("distributes proportionally to share counts", () => {
    const values = [
      { memberId: "a", value: 1 },
      { memberId: "b", value: 3 },
    ];
    const result = calculateSharesSplit(10000, values);
    expect(sum(result)).toBe(10000);
    expect(result.find((r) => r.memberId === "a")?.amountCents).toBe(2500);
    expect(result.find((r) => r.memberId === "b")?.amountCents).toBe(7500);
  });

  it("validates shares are positive whole numbers", () => {
    expect(
      validateSharesSplit([
        { memberId: "a", value: 1 },
        { memberId: "b", value: 2 },
      ]),
    ).toBeNull();

    expect(
      validateSharesSplit([
        { memberId: "a", value: 0 },
        { memberId: "b", value: 2 },
      ]),
    ).not.toBeNull();

    expect(
      validateSharesSplit([
        { memberId: "a", value: 1.5 },
        { memberId: "b", value: 2 },
      ]),
    ).not.toBeNull();
  });
});

describe("baseSplitAmount", () => {
  it("returns the floored average", () => {
    expect(baseSplitAmount(8500, 3)).toBe(2833);
  });

  it("returns 0 for zero members", () => {
    expect(baseSplitAmount(8500, 0)).toBe(0);
  });
});
