import { describe, expect, it } from "vitest";

import { AppInfoSchema, ContractParseError, parseAppInfo, parseContract } from "./index.js";

describe("app info contract", () => {
  it("parses a valid app info payload", () => {
    const payload: unknown = { name: "LinkAtlas", version: "0.0.0" };

    const parsed = parseAppInfo(payload);

    expect(parsed).toEqual({ name: "LinkAtlas", version: "0.0.0" });
  });

  it("rejects malformed unknown payload with a stable error code", () => {
    const payload: unknown = { name: "Other", version: "" };

    expect(() => parseContract(AppInfoSchema, payload)).toThrow(ContractParseError);
    expect(() => parseContract(AppInfoSchema, payload)).toThrow(
      "Contract payload did not match the expected schema.",
    );
  });
});
