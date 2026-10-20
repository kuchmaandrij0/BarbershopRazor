import { test, expect } from "@playwright/test";
test("страница, фотографии, навигация и отсутствие горизонтальной прокрутки", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Твой стиль.Наш характер.",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter((i) => i.getAttribute("loading") !== "lazy")
          .every((i) => i.complete && i.naturalWidth > 0),
      ),
    )
    .toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(
      page.getByRole("navigation", { name: "Мобильная навигация" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Мобильная навигация" })
      .getByRole("link", { name: "Услуги" })
      .click();
    await expect(
      page.getByRole("button", { name: "Открыть меню" }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  await page.getByRole("link", { name: /Мужская стрижка/ }).click();
  await expect(page.getByLabel("Услуга", { exact: true })).toHaveValue("0");
  await page.locator("#gallery").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator("#gallery img")
        .evaluateAll((imgs) =>
          imgs.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBeTruthy();
  await page.screenshot({
    path: `test-results/${info.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("валидация, сохранение, повторное открытие и конфликт слота", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#booking").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Сохранить демо-запись" }).click();
  expect(
    await page
      .locator("input[type=date]")
      .evaluate((e) => (e as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  const date = await page.locator("input[type=date]").getAttribute("min");
  await page.getByLabel("Дата", { exact: true }).fill(date!);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByLabel("Твоё имя").fill("Алексей");
  await page.getByLabel("Телефон", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Сохранить демо-запись" }).click();
  await expect(page.locator("#booking").getByRole("alert")).toContainText(
    "от 10 до 15 цифр",
  );
  await page.getByLabel("Телефон", { exact: true }).fill("+380 67 123 45 67");
  await page.getByRole("button", { name: "Сохранить демо-запись" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Демонстрационная запись сохранена. Данные в барбершоп не отправлены",
  );
  await expect(page.getByRole("status")).toContainText("Мужская стрижка");
  await expect(page.getByRole("status")).toContainText("650 ₴ · 60 мин");
  await page.reload();
  await page.getByLabel("Дата", { exact: true }).fill(date!);
  await expect(
    page.getByRole("button", { name: "10:00 — занято", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "10:30 — занято", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "11:00", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Мастер", { exact: true }).selectOption("1");
  await expect(
    page.getByRole("button", { name: "10:00", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("black-razor-bookings-v1") || "[]")
          .length,
    ),
  ).toBe(1);
});
test("ошибка хранилища и уменьшение анимации", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await expect(page.locator("input[type=date]")).toHaveAttribute(
    "min",
    /^\d{4}-\d{2}-\d{2}$/,
  );
  await page
    .getByLabel("Дата", { exact: true })
    .fill((await page.locator("input[type=date]").getAttribute("min"))!);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByLabel("Твоё имя").fill("Демо");
  await page.getByLabel("Телефон", { exact: true }).fill("+380671234567");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.getByRole("button", { name: "Сохранить демо-запись" }).click();
  await expect(page.locator("#booking").getByRole("alert")).toContainText(
    "Не удалось сохранить запись",
  );
  await expect(page.getByRole("status")).toHaveCount(0);
});
