const statusNode = document.querySelector("#status");
const savePageButton = document.querySelector("#save-page");
const saveSelectionButton = document.querySelector("#save-selection");

savePageButton?.addEventListener("click", () => {
  void capture("page");
});

saveSelectionButton?.addEventListener("click", () => {
  void capture("selection");
});

async function capture(kind) {
  setStatus("Saving");
  const response = await chrome.runtime.sendMessage({
    kind,
    type: "LINKATLAS_CAPTURE",
  });
  if (response?.ok === true) {
    setStatus(response.status === "duplicate" ? "Duplicate" : "Saved");
    return;
  }
  setStatus(response?.errorCode === "APP_UNAVAILABLE" ? "App unavailable" : "Failed");
}

function setStatus(value) {
  if (statusNode !== null) {
    statusNode.textContent = value;
  }
}
