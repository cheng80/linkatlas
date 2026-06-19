import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ChatRequest,
  ContentBlock,
  GenerateTextRequest,
  GenerateTextResult,
  GenerationProvider,
  StreamSink,
  StructuredRequest,
} from "@linkatlas/domain";
import { AppErrorCode } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";
import type { DocumentAnalysis } from "./document-analysis-schema.js";
import { analyzeDocument } from "./structured-document-analysis.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

describe("analyzeDocument", () => {
  it("runs chunk summary then document reduce with model and prompt metadata", async () => {
    const provider = scriptedProvider([
      { summary: "첫 청크", evidenceBlockIds: ["block_0001"] },
      { summary: "둘째 청크", evidenceBlockIds: ["block_0004"] },
      validAnalysis(["block_0001"], ["block_0004"]),
    ]);

    const result = await analyzeDocument({
      blocks: fixtureBlocks(),
      generationProvider: provider,
      model: "gemma4:12b",
    });

    expect(result).toMatchObject({
      skipped: false,
      metadata: {
        modelName: "gemma4:12b",
        promptName: "document-analysis",
        promptVersion: "v1",
      },
    });
    expect(result.skipped === false ? result.analysis.headline : "").toBe("LinkAtlas 분석");
  });

  it("retries document reduce once when evidence IDs are invalid", async () => {
    const provider = scriptedProvider([
      { summary: "청크", evidenceBlockIds: ["block_0001"] },
      validAnalysis(["block_missing"], ["block_0001"]),
      validAnalysis(["block_0001"], ["block_0001"]),
    ]);

    const result = await analyzeDocument({
      blocks: fixtureBlocks().slice(0, 2),
      generationProvider: provider,
      model: "gemma4:12b",
    });

    expect(result.skipped === false ? result.analysis.keyPoints[0]?.evidenceBlockIds : []).toEqual([
      "block_0001",
    ]);
    expect(provider.prompts.at(-1)).toContain("Correct it once");
  });

  it("fails closed after the single correction retry is exhausted", async () => {
    const provider = scriptedProvider([
      { summary: "청크", evidenceBlockIds: ["block_0001"] },
      validAnalysis(["block_missing"], ["block_0001"]),
      validAnalysis(["block_missing"], ["block_0001"]),
    ]);

    await expect(
      analyzeDocument({
        blocks: fixtureBlocks().slice(0, 2),
        generationProvider: provider,
        model: "gemma4:12b",
      }),
    ).rejects.toMatchObject({ errorCode: AppErrorCode.InvalidInput });
  });

  it("does not overwrite existing user-edited summaries", async () => {
    const provider = scriptedProvider([]);

    await expect(
      analyzeDocument({
        blocks: fixtureBlocks(),
        existingUserEditedSummary: true,
        generationProvider: provider,
        model: "gemma4:12b",
      }),
    ).resolves.toEqual({ skipped: true, reason: "USER_EDITED_SUMMARY" });
  });

  it("treats prompt injection fixture text as untrusted data", async () => {
    const hostileText = await readFile(
      join(currentDirectory, "../../test-fixtures/html/prompt-injection.txt"),
      "utf8",
    );
    const provider = scriptedProvider([
      { summary: "위험 지시 무시", evidenceBlockIds: ["block_0001"] },
      validAnalysis(["block_0001"], ["block_0001"]),
    ]);

    await analyzeDocument({
      blocks: [{ ...firstBlock(), text: hostileText }],
      generationProvider: provider,
      model: "gemma4:12b",
    });

    expect(provider.prompts[0]).toContain("untrusted data");
    expect(provider.prompts[0]).toContain("Ignore previous");
  });
});

function scriptedProvider(outputs: readonly unknown[]): GenerationProvider & {
  readonly prompts: string[];
} {
  const prompts: string[] = [];
  let index = 0;
  return {
    prompts,
    generateStructured: async <T>(request: StructuredRequest<T>): Promise<T> => {
      prompts.push(request.prompt);
      const output = outputs[index];
      index += 1;
      return request.parse(output);
    },
    generateText: async (_request: GenerateTextRequest): Promise<GenerateTextResult> => {
      throw new Error("unused");
    },
    health: async () => ({ message: "ok", ok: true }),
    listModels: async () => [],
    streamChat: async (_request: ChatRequest, _sink: StreamSink): Promise<void> => {
      throw new Error("unused");
    },
  };
}

function fixtureBlocks(): readonly ContentBlock[] {
  return [1, 2, 3, 4].map((number) => ({
    blockType: "paragraph",
    documentVersionId: "docver_test",
    headingPath: [],
    id: `block_000${number}`,
    ordinal: number - 1,
    text: `본문 ${number}`,
  }));
}

function firstBlock(): ContentBlock {
  const block = fixtureBlocks()[0];
  if (block === undefined) {
    throw new Error("missing fixture block");
  }
  return block;
}

function validAnalysis(keyPointEvidence: string[], claimEvidence: string[]): DocumentAnalysis {
  return {
    abstract: "저장된 문서의 핵심 요약입니다.",
    actionItems: [],
    caveats: [],
    claims: [
      {
        confidence: 0.8,
        evidenceBlockIds: claimEvidence,
        stance: "assertion",
        text: "근거가 있는 주장입니다.",
      },
    ],
    contentType: "documentation",
    entities: [],
    headline: "LinkAtlas 분석",
    keyPoints: [{ evidenceBlockIds: keyPointEvidence, text: "핵심 포인트" }],
    language: "ko",
    topics: [
      {
        confidence: 0.9,
        description: "로컬 지식 관리",
        evidenceBlockIds: keyPointEvidence,
        label: "LinkAtlas",
      },
    ],
  };
}
