import fs from "fs";
import axios from "axios";
import pdf from "pdf-parse";
import mongoose from "mongoose";
import Trademark from "../models/Trademark.js";
import connectDB from "../config/db.js";

const pdfUrl = "PASTE_JOURNAL_PDF_LINK_HERE";

async function importData() {
  await connectDB();

  const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });

  const data = await pdf(response.data);

  const text = data.text;

  const regex = /(\d{7})\s+([A-Z0-9 ]+)\s+Class\s+(\d+)/g;

  let match;

  const trademarks = [];

  while ((match = regex.exec(text)) !== null) {
    trademarks.push({
      application_number: match[1],
      brand_name: match[2],
      class: Number(match[3]),
      status: "Filed"
    });
  }

  await Trademark.insertMany(trademarks);

  console.log("Import completed");
}

importData();



// node scripts/importTrademarks.js