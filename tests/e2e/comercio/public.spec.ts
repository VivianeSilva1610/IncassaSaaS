import { expect, test } from "@playwright/test";

test.describe("INCASSA Comércio — acesso público", () => {
  test("permite escolher o sistema Comércio", async ({ page }) => {
    await page.goto("/escolher-sistema");

    await expect(page.getByRole("heading", { name: /qual operação você quer gerenciar/i })).toBeVisible();
    const commerceCard = page.getByRole("article").filter({ hasText: "INCASSA Comércio" });
    await expect(commerceCard).toContainText("PDV");
    await commerceCard.getByRole("link", { name: /cadastrar comércio/i }).click();

    await expect(page).toHaveURL(/\/cadastro-comercio$/);
    await expect(page.getByRole("heading", { name: /criar conta/i })).toBeVisible();
  });

  test("cadastro exige aceite dos termos e senha mínima", async ({ page }) => {
    await page.goto("/cadastro-comercio");
    const submit = page.getByRole("button", { name: /criar conta comércio/i });

    await expect(submit).toBeDisabled();
    await page.getByRole("textbox", { name: /e-mail/i }).fill("teste-e2e@example.com");
    await page.getByLabel("Senha").fill("12345");
    await page.getByRole("checkbox").check();
    await expect(submit).toBeEnabled();

    await submit.click();
    await expect(page.getByLabel("Senha")).toBeFocused();
    await expect(page).toHaveURL(/\/cadastro-comercio$/);
  });

  test("área do Comércio redireciona visitante para o login", async ({ page }) => {
    await page.goto("/comercio");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /accedi/i })).toBeVisible();
  });

  test("login mantém os campos e ações essenciais acessíveis", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /accedi/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /password dimenticata/i })).toBeVisible();
  });
});
