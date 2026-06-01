// YouTube tutorial video recorder for Nidham system walkthrough.
//
// Uses Playwright to log into Nidham and record a separate video for
// each major page. Videos are saved as .webm to the desktop folder.
//
// Prerequisites:
//   1. Copy scripts/.env.local.example → .env.local and fill in:
//        NIDHAM_EMAIL, NIDHAM_PASSWORD, NIDHAM_BASE_URL
//   2. npx playwright install chromium   (one-time)
//
// Run:
//   npx tsx scripts/record-video-walkthrough.ts
//
// Output:
//   ~/Desktop/نظام_HR_يوتيوب/videos/{name}.webm

import os from "os";
import { chromium, type Browser, type Page } from "playwright";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL =
  process.env.NIDHAM_BASE_URL?.replace(/\/$/, "") ??
  "https://nidhamhr.com";
const EMAIL: string = process.env.NIDHAM_EMAIL ?? "";
const PASSWORD: string = process.env.NIDHAM_PASSWORD ?? "";

if (!EMAIL || !PASSWORD) {
  console.error("Missing NIDHAM_EMAIL or NIDHAM_PASSWORD in .env.local");
  process.exit(1);
}

const DESKTOP = path.join(
  os.homedir(),
  "OneDrive",
  "سطح المكتب",
  "نظام_HR_يوتيوب",
  "فيديوهات_شرح",
);

interface PageDef {
  name: string;
  path: string;
  description: string;
  actions?: (page: Page) => Promise<void>;
}

const PAGES: PageDef[] = [
  {
    name: "01-لمحة-عامة",
    path: "/dashboard",
    description: "نظرة عامة على لوحة التحكم — Dashboard",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "02-الموظفين",
    path: "/dashboard/employees",
    description: "قائمة الموظفين — إدارة بيانات الموظفين",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "03-استيراد-بالذكاء-الاصطناعي",
    path: "/dashboard/employees/import",
    description: "رفع بيانات الموظفين بالـ AI من PDF",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "04-الحضور-GPS",
    path: "/dashboard/attendance",
    description: "سجل الحضور والانصراف بالـ GPS",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "05-المرتبات",
    path: "/dashboard/payroll",
    description: "حساب المرتبات والتأمينات والضرائب",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "06-طلبات-الموظفين",
    path: "/dashboard/requests",
    description: "إدارة طلبات الإجازات والسلف والاستئذان",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "07-CRM",
    path: "/dashboard/customers",
    description: "CRM وإدارة العملاء مع Pipeline",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "08-الوظائف-والتوظيف",
    path: "/dashboard/jobs",
    description: "إدارة الوظائف والتوظيف الذكي",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "09-استوديو-التسويق",
    path: "/dashboard/marketing",
    description: "استوديو التسويق بالذكاء الاصطناعي",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "10-المساعد-الذكي",
    path: "/dashboard/ai",
    description: "المساعد الذكي AI — أسئلة وأجوبة عن النظام والقانون",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
  {
    name: "11-التقارير",
    path: "/dashboard/reports/bridge",
    description: "تقارير وتحليلات Bridge Analytics",
    actions: async (page) => {
      await page.waitForTimeout(2000);
    },
  },
];

async function login(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard/**", { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Save storage state for reuse
  await ctx.storageState({ path: "scripts/storageState.json" });
  await ctx.close();
  return page;
}

async function main() {
  await fs.mkdir(DESKTOP, { recursive: true });
  console.log(`Saving videos to: ${DESKTOP}`);

  const browser = await chromium.launch({ headless: true });

  // First login to get session
  console.log("\n🔑 Logging in...");
  const loginPage = await login(browser);
  await loginPage.context().close();

  console.log(`✅ Logged in successfully\n`);

  for (const def of PAGES) {
    console.log(`\n🎥 Recording: ${def.name} — ${def.description}`);

    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      storageState: "scripts/storageState.json",
      recordVideo: {
        dir: DESKTOP,
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await ctx.newPage();

    try {
      console.log(`   → Navigating to ${def.path}`);
      await page.goto(`${BASE_URL}${def.path}`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });

      // Wait for content to settle
      await page.waitForTimeout(3000);

      // Scroll through the page to show all content
      console.log(`   → Scrolling through content...`);
      let prevHeight = 0;
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(600);
        const h = await page.evaluate(() => document.documentElement.scrollTop);
        if (h === prevHeight) break;
        prevHeight = h;
      }

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);

      // Run page-specific actions if any
      if (def.actions) {
        await def.actions(page);
      }

      console.log(`   ✅ Done recording ${def.name}`);
      await ctx.close();
    } catch (err) {
      console.error(`   ❌ Failed: ${def.path} — ${err}`);
      await ctx.close();
    }
  }

  await browser.close();

  // List the output files
  const files = await fs.readdir(DESKTOP);
  const videoFiles = files.filter((f) => f.endsWith(".webm"));
  console.log(`\n✨ Done! ${videoFiles.length} videos recorded:`);
  for (const f of videoFiles.sort()) {
    const stat = await fs.stat(path.join(DESKTOP, f));
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`  📹 ${f}  (${sizeMB} MB)`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
