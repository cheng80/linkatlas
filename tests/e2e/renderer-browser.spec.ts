import { expect, test } from "@playwright/test";

test("browser dev renderer supports Library navigation with mock preload API", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "LinkAtlas" })).toBeVisible();
  await page.getByRole("link", { name: "Library" }).click();

  await expect(page).toHaveURL(/#library$/u);
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(page.getByText("브라우저 dev 샘플")).toBeVisible();
  await expect(page.getByText("https://www.threads.com/@robin")).toBeVisible();
});
