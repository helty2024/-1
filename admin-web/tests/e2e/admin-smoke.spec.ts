import { expect, test } from "@playwright/test";

const username = process.env.E2E_ADMIN_USERNAME ?? "e2e_admin";
const password = process.env.E2E_ADMIN_PASSWORD ?? "E2eAdmin_2026!";

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/leads");
  await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)leads/);
  await expect(
    page.getByRole("heading", { name: "中康参芝管理后台" }),
  ).toBeVisible();
});

test("administrator can open every management module without server errors", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/api/v1/") && response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/login");
  await page.getByPlaceholder("请输入管理员账号").fill(username);
  await page.getByPlaceholder("请输入密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".admin-header h1")).toHaveText("工作台");

  const modules = [
    ["/content", "首页内容"],
    ["/product-content", "产品页内容"],
    ["/strength-content", "实力页内容"],
    ["/cooperation", "合作页内容"],
    ["/products", "产品管理"],
    ["/media", "媒体管理"],
    ["/forms", "表单管理"],
    ["/leads", "客户线索"],
    ["/settings", "账号与权限"],
    ["/audit-logs", "审计日志"],
  ] as const;

  for (const [route, title] of modules) {
    await page.goto(route);
    await expect(page.locator(".admin-header h1")).toHaveText(title);
    await expect(page.locator(".admin-content")).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
  expect(serverErrors).toEqual([]);
});
