const nativeHostName = "com.linkatlas.native";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "LINKATLAS_CAPTURE") {
    return false;
  }
  void captureActiveTab(message.kind).then(sendResponse);
  return true;
});

async function captureActiveTab(kind) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    return failed("CAPTURE_FAILED", "활성 탭을 찾을 수 없습니다.");
  }
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: readCurrentPage,
    args: [kind],
  });
  const payload = result?.result;
  if (payload === undefined) {
    return failed("CAPTURE_FAILED", "페이지 내용을 읽을 수 없습니다.");
  }
  return await sendNative(payload);
}

function readCurrentPage(kind) {
  const url = window.location.href;
  const title = document.title || url;
  if (kind === "selection") {
    const selectionText = window.getSelection()?.toString().trim() ?? "";
    if (selectionText.length === 0) {
      return {
        errorCode: "CAPTURE_FAILED",
        message: "선택된 텍스트가 없습니다.",
        ok: false,
      };
    }
    return { kind: "selection", selectionText, title, url };
  }
  return {
    html: document.documentElement.outerHTML,
    kind: "page",
    title,
    url,
  };
}

async function sendNative(payload) {
  if (payload.ok === false) {
    return payload;
  }
  return await new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(nativeHostName, payload, (response) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError !== undefined) {
        resolve(
          failed(
            "APP_UNAVAILABLE",
            "LinkAtlas 앱이 실행 중이 아니거나 Native Messaging host가 설치되지 않았습니다.",
          ),
        );
        return;
      }
      resolve(response ?? failed("CAPTURE_FAILED", "LinkAtlas 응답이 비어 있습니다."));
    });
  });
}

function failed(errorCode, message) {
  return { errorCode, message, ok: false };
}
