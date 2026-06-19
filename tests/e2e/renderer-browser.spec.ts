import { expect, test } from "@playwright/test";

test("browser dev renderer supports Library navigation with mock preload API", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "LinkAtlas" })).toBeVisible();
  const jobs = page.getByRole("region", { name: "Recent jobs" });
  await expect(jobs.getByText("작업 완료")).toBeVisible();
  await expect(jobs.getByRole("button", { name: "취소" })).toHaveCount(0);
  await expect(jobs.getByRole("button", { name: "재시도" })).toHaveCount(0);

  await page.getByRole("link", { name: "Library" }).click();

  await expect(page).toHaveURL(/#library$/u);
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(page.getByText("브라우저 dev 샘플")).toBeVisible();
  await expect(page.getByText("https://www.threads.com/@robin")).toBeVisible();

  const menuItems = [
    "Inbox",
    "Library",
    "Topics",
    "Collections",
    "Graph",
    "Ask",
    "Settings",
  ] as const;

  for (const item of menuItems) {
    await page.getByRole("link", { name: item }).click();
    await expect(page.getByRole("heading", { name: item })).toBeVisible();
  }
});
