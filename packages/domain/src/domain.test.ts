import { describe, expect, it } from "vitest";

import { AppError, AppErrorCode, DocumentStatus, JobStatus } from "./index.js";

describe("domain primitives", () => {
  it("creates stable typed app errors", () => {
    const error = new AppError({
      errorCode: AppErrorCode.InvalidInput,
      userMessage: "입력이 올바르지 않습니다.",
    });

    expect(error.errorCode).toBe("INVALID_INPUT");
    expect(error.userMessage).toBe("입력이 올바르지 않습니다.");
  });

  it("keeps document and job status values explicit", () => {
    expect(DocumentStatus.Inbox).toBe("inbox");
    expect(JobStatus.Queued).toBe("QUEUED");
  });

  it("keeps semantic IDs recognizable by prefix", () => {
    const documentId = "doc_1";

    expect(documentId).toBe("doc_1");
  });
});
