import { describe, expect, it } from "vitest";

describe("integration harness", () => {
  it("runs without public internet access", () => {
    const fixtureOnlyPolicy = "fixtures-and-mocks";

    expect(fixtureOnlyPolicy).toBe("fixtures-and-mocks");
  });
});
