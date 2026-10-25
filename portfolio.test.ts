import { describe, it, expect } from "vitest";
import { HOLDINGS, simulate, totalValue, impliedShares } from "./portfolio";

describe("portfolio", () => {
  it("total of PLTR + MU is Rp51.125,06", () => {
    expect(totalValue(HOLDINGS.map((h) => h.valueIdr))).toBeCloseTo(51125.06, 2);
  });
  it("+2% on PLTR adds Rp830,81", () => {
    expect(simulate(41540.507, 2).delta).toBeCloseTo(830.81, 2);
  });
  it("-2% on MU removes Rp191,69", () => {
    expect(simulate(9584.553, -2).newValue).toBeCloseTo(9392.86, 2);
  });
  it("implied shares", () => {
    expect(impliedShares(16000, 1, 16000)).toBe(1);
  });
});
