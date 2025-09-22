import express, { Request, Response } from "express";
import { log } from "console";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
const corsOptions = {
  origin: "*", // frontend liberado
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

const PORT = 3000;

interface Trend {
  id: string | null;
  title: string | null;
  link: string | null;
  data_volume: string | null;
  duration: string | null;
  keywords: string[] | null;
}

app.get("/categories", async (req: Request, res: Response) => {
  const categories = [
    { id: 1, categoria: "Autos e Veículos" },
    { id: 2, categoria: "Beleza e Moda" },
    { id: 3, categoria: "Negócios e Finanças" },
    { id: 4, categoria: "Entretenimento" },
    { id: 5, categoria: "Comida e Bebida" },
    { id: 6, categoria: "Jogos" },
    { id: 7, categoria: "Saúde" },
    { id: 8, categoria: "Hobbies e Lazer" },
    { id: 9, categoria: "Empregos e Educação" },
    { id: 10, categoria: "Leis e Governo" },
    { id: 11, categoria: "Outros" },
    { id: 13, categoria: "Animais de Estimação" },
    { id: 14, categoria: "Política" },
    { id: 15, categoria: "Ciência" },
    { id: 16, categoria: "Compras" },
    { id: 17, categoria: "Esportes" },
    { id: 18, categoria: "Tecnologia" },
    { id: 19, categoria: "Viagem e Transporte" },
    { id: 20, categoria: "Clima" },
  ];

  res.json(categories);
});

app.get("/trends", async (req: Request, res: Response) => {
  // Puppeteer launch
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true 
  });
  
  const { categoria } = req.query;
  const url = `https://trends.google.com.br/trending?geo=BR&category=${categoria}`;

  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  await page.waitForSelector("tr.enOdEe-wZVHld-xMbwt");

  const data: Trend[] = await page.$$eval(
    "tr.enOdEe-wZVHld-xMbwt",
    rows =>
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


  await browser.close();
  res.json(data);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on port ${PORT}`);
});


