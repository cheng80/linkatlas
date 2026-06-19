import type { AskStartResultDto, AskStreamEventDto } from "@linkatlas/contracts";
import { ContractParseError, parseAskQuestionRequest } from "@linkatlas/contracts";
import { ipcMain } from "electron";
import { type AskServiceOptions, answerQuestion, askRequestId } from "./ask-service.js";

export type AskIpcOptions = AskServiceOptions;

export const askIpcChannels = {
  event: "linkAtlas:ask:event",
  start: "linkAtlas:ask:start",
} as const;

export function registerAskIpc(options: AskIpcOptions): void {
  ipcMain.handle(askIpcChannels.start, (event, input: unknown) => {
    try {
      const request = parseAskQuestionRequest(input);
      const requestId = askRequestId(request.question);
      void runAsk(options, requestId, request.question, request.limit ?? 8, (streamEvent) => {
        event.sender.send(askIpcChannels.event, streamEvent);
      });
      return { ok: true, requestId } satisfies AskStartResultDto;
    } catch (error: unknown) {
      if (error instanceof ContractParseError) {
        return {
          ok: false,
          message: "질문 입력 형식이 올바르지 않습니다.",
        } satisfies AskStartResultDto;
      }
      throw error;
    }
  });
}

async function runAsk(
  options: AskIpcOptions,
  requestId: `ask_${string}`,
  question: string,
  limit: number,
  send: (event: AskStreamEventDto) => void,
): Promise<void> {
  try {
    const answer = await answerQuestion(
      options,
      { limit, question },
      {
        onStatus: (message) => {
          send({ message, requestId, type: "status" });
        },
        onToken: (text) => {
          send({ requestId, text, type: "token" });
        },
      },
    );
    send({ answer, requestId, type: "done" });
  } catch {
    send({ message: "질문에 답하는 중 오류가 발생했습니다.", requestId, type: "error" });
  }
}
