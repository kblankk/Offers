import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { config } from "./config";
import { createLogger } from "./logger";

const log = createLogger("browser");

let browser: Browser | null = null;
let context: BrowserContext | null = null;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function getContext(): Promise<BrowserContext> {
  if (context) return context;
  log.info(`Iniciando Chromium (headless=${config.headless})`);
  browser = await chromium.launch({
    headless: config.headless,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  context = await browser.newContext({
    userAgent: UA,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  return context;
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const ctx = await getContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  try {
    return await fn(page);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function closeBrowser(): Promise<void> {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  context = null;
  browser = null;
  log.info("Chromium encerrado");
}
