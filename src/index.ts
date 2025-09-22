import express, { Request, Response } from "express";
import { log } from "console";
import cors from "cors";
import { trendRouter } from "./controllers/TrendController";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const corsOptions = {
  origin: "*", // frontend liberado
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/trends", trendRouter)

app.get('/', (req, res) => res.send({ status: 'ok', uptime: process.uptime() }));
app.listen(port, () => console.log(`Server listening on port ${port}`));


