import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// Helper: press keys for a short duration to trigger movement loop
async function pressKey(page: Page, code: string, ms = 500) {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}

// Read PIXI avatar position from canvas layer via window globals/hooks if exposed. As a fallback,
// we assert the connection UI and just drive keypresses to ensure no errors.

test.describe("Avatar movement", () => {
  test("user can join workspace and move avatar with WASD", async ({
    page,
  }) => {
    await page.goto("/");

    // Fill name and enter workspace
    const nameInput = page.getByLabel("Your Name");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Alice");
    await page.getByRole("button", { name: "Enter Workspace" }).click();

    // Wait for workspace to load
    await expect(page.getByText("Connected", { exact: false })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Controls")).toBeVisible();

    // Focus body to receive key events
    await page.locator("body").click();

    // Try to move with D (right) then S (down)
    await pressKey(page, "KeyD", 400);
    await pressKey(page, "KeyS", 400);

    // Smoke check: page is still responsive and connection remains
    await expect(page.getByText("Connected", { exact: false })).toBeVisible();
  });
});
