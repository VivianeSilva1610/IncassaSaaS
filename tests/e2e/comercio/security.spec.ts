import { expect, test } from "@playwright/test";

const protectedPages = [
  "/comercio",
  "/comercio/vendas",
  "/comercio/vendas/nova",
  "/comercio/produtos",
  "/comercio/entradas",
  "/comercio/pedidos-compra",
  "/comercio/clientes",
  "/comercio/caixa",
  "/comercio/financeiro",
  "/comercio/gestao",
  "/comercio/gestao/dre",
  "/comercio/fiscal",
  "/comercio/fiscal/emissoes",
  "/comercio/equipe",
  "/comercio/plano",
  "/comercio/operacoes",
];

test.describe("INCASSA Comércio — proteção sem sessão", () => {
  for (const path of protectedPages) {
    test(`${path} exige autenticação`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { name: /accedi/i })).toBeVisible();
    });
  }

  test("checkout principal rejeita chamada anônima", async ({ request }) => {
    const response = await request.post("/api/subscribe-comercio", { maxRedirects: 0 });
    expect(response.status()).toBe(401);
  });

  for (const endpoint of ["/api/comercio/addon-checkout", "/api/comercio/billing-portal", "/api/comercio/abas/heartbeat"]) {
    test(`${endpoint} não executa sem sessão`, async ({ request }) => {
      const response = await request.post(endpoint, { data: {}, maxRedirects: 0 });
      expect([302, 303, 307, 308, 401, 403]).toContain(response.status());
    });
  }

  test("exportação do backup exige sessão", async ({ request }) => {
    const response = await request.get("/api/comercio/export-backup-completo", { maxRedirects: 0 });
    expect([302, 303, 307, 308, 401, 403]).toContain(response.status());
  });

  test("saúde operacional não expõe dados sem autenticação", async ({ request }) => {
    const response = await request.get("/api/comercio/health", { maxRedirects: 0 });
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
