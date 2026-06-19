import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, expect, test } from "@playwright/test";

test("desktop smoke renders shell through typed preload API", async () => {
  const userDataDirectory = await mkdtemp(join(tmpdir(), "linkatlas-e2e-"));
  const app = await electron.launch({
    args: [join(process.cwd(), "apps/desktop/dist/main/main.js")],
    env: {
      ...process.env,
      LINKATLAS_E2E: "1",
      LINKATLAS_E2E_USER_DATA_DIR: userDataDirectory,
    },
  });

  try {
    const window = await app.firstWindow();

    await expect(window.getByRole("heading", { name: "LinkAtlas" })).toBeVisible();
    await expect(window.getByTestId("app-version")).toHaveText("Version 0.0.0");
    await expect(window.getByRole("button", { name: "URL 저장" })).toBeDisabled();

    await window.getByLabel("URL").fill("http://127.0.0.1:1/private");
    await expect(window.getByRole("button", { name: "URL 저장" })).toBeEnabled();
    await window.getByRole("button", { name: "URL 저장" }).click();
    await expect(window.getByText("로컬 또는 사설 네트워크 URL은 기본 차단됩니다.")).toBeVisible();
    await expect(
      window.getByRole("region", { name: "Recent jobs" }).getByText("실패"),
    ).toBeVisible();
    await expect(
      window.getByRole("region", { name: "Recent jobs" }).getByText("127.0.0.1/private"),
    ).toBeVisible();
    await expect(
      window.getByRole("region", { name: "Recent jobs" }).getByText("http://127.0.0.1:1/private"),
    ).toBeVisible();
    await expect(window.getByText("INVALID_INPUT")).toBeVisible();
    await expect(window.getByRole("button", { name: "재시도" })).toBeEnabled();

    await window.getByRole("link", { name: "Library" }).click();
    await expect(window.getByRole("heading", { name: "Library" })).toBeVisible();
    await expect(window.getByText("아직 저장된 자료가 없습니다.")).toBeVisible();

    const nodeGlobals = await window.evaluate(() => ({
      hasProcess: "process" in globalThis,
      hasRequire: "require" in globalThis,
    }));

    expect(nodeGlobals).toEqual({ hasProcess: false, hasRequire: false });
  } finally {
    await app.close();
    await rm(userDataDirectory, { force: true, recursive: true });
  }
});
