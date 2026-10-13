import { expect, test } from "@playwright/test";

const email = process.env.E2E_COMMERCE_EMAIL;
const password = process.env.E2E_COMMERCE_PASSWORD;

test.describe("INCASSA Comércio — sessão autenticada", () => {
  test.skip(!email || !password, "Defina E2E_COMMERCE_EMAIL e E2E_COMMERCE_PASSWORD com uma conta exclusiva de testes.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.getByRole("button", { name: /accedi/i }).click();
    await expect(page).toHaveURL(/\/sistemas$/, { timeout: 15_000 });
    await page.goto("/comercio");
  });

  test("abre o painel e as rotas operacionais autorizadas", async ({ page }) => {
    await expect(page.getByText(/visão geral da sua operação de revenda/i)).toBeVisible();

    for (const route of ["produtos", "vendas", "entradas", "financeiro", "gestao/dre", "plano"]) {
      await page.goto(`/comercio/${route}`);
      await expect(page).not.toHaveURL(/\/login$/);
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("exibe o ciclo da assinatura no plano", async ({ page }) => {
    await page.goto("/comercio/plano");
    await expect(page.getByRole("heading", { name: /situação da assinatura/i })).toBeVisible();
    await expect(page.getByText(/sincronizada automaticamente com a stripe/i)).toBeVisible();
  });
});
