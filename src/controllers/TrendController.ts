import { Router, Request, Response } from 'express';
import puppeteer, { Browser } from "puppeteer";
import client, { connectRedis } from '../redis/client';


let browser: Browser | null = null;

interface Trend {
  id: string | null;
  title: string | null;
  link: string | null;
  data_volume: string | null;
  duration: string | null;
  keywords: string[] | null;
}

export const trendRouter = Router();

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer"
      ],
      headless: true,
    });
  }
  return browser;
}

trendRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query;
    const client = await connectRedis();

    const cacheKey = `trends:category:${categoria ?? 0}`;
    const cached = await client.get(cacheKey);

    console.log("passou aqui");

    if (cached) {
      console.log("chegouo (cache)");
      return res.json(JSON.parse(cached));
    }

    console.log("passou aqui 2 (sem cache)");

    // 🚀 Só abre Puppeteer se não tiver cache
    const browser = await getBrowser();
    const url = `https://trends.google.com.br/trending?geo=BR&category=${categoria}`;

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    page.on("console", msg => console.log("PAGE LOG:", msg.text()));

    await page.waitForSelector("tr.enOdEe-wZVHld-xMbwt");

    const data: Trend[] = await page.$$eval("tr.enOdEe-wZVHld-xMbwt", rows =>
      rows.map(row => {
        const div = row.querySelector("td:nth-of-type(5) > div:first-of-type");

        return {
          id: row.getAttribute("data-row-id"),
          title:
            row.querySelector("td:nth-of-type(2) > div:first-of-type")?.textContent?.trim() || null,
          link: row.querySelector("a")?.getAttribute("href") || null,
          data_volume:
            row.querySelector("td:nth-of-type(3) > div:first-of-type")?.textContent?.trim() || null,
          duration:
            row.querySelector("td:nth-of-type(4) > div:first-of-type")?.textContent?.trim() || null,
          keywords: div
            ? Array.from(div.querySelectorAll("span"))
                .map(span => span.innerText.trim())
                .filter(
                  t =>
                    t.length > 0 &&
                    !t.includes("Termo de pesquisa") &&
                    !t.includes("query_stats") &&
                    !t.includes("Explorar")
                )
            : []
        };
      })
    );

    await client.setEx(cacheKey, 600, JSON.stringify(data));

    await page.close(); // fecha só a página, mantém browser vivo

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});
