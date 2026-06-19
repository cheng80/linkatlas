import type { DocumentRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { createIngestUrlHandler } from "./ingest-ipc.js";

const repository: DocumentRepository = {
  getDocumentSnapshot: () => null,
  saveDocumentSnapshot: () => undefined,
};

describe("createIngestUrlHandler", () => {
  it("returns a stable user-facing error for invalid URLs", async () => {
    const handler = createIngestUrlHandler({ allowedHosts: [], documentRepository: repository });

    await expect(handler({ url: "file:///tmp/nope" })).resolves.toEqual({
      errorCode: "UNSUPPORTED_PROTOCOL",
      message: "http 또는 https URL만 저장할 수 있습니다.",
      ok: false,
    });
  });
});
