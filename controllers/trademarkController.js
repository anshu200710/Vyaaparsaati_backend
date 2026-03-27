import Trademark from "../models/Trademark.js";
import axios from "axios";
import puppeteer from "puppeteer";
import { load } from "cheerio";
import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary.js";

// Search trademarks
export const searchTrademarks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        error: 'Search query parameter "q" is required',
      });
    }

    const trademarks = await Trademark.find({
      brand_name: { $regex: q, $options: "i" },
    }).limit(20);

    res.json({
      count: trademarks.length,
      data: trademarks,
    });
  } catch (error) {
    console.error("Error searching trademarks:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get all trademarks (with pagination)
export const getAllTrademarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trademarks = await Trademark.find().skip(skip).limit(limit);

    const total = await Trademark.countDocuments();

    res.json({
      count: trademarks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: trademarks,
    });
  } catch (error) {
    console.error("Error fetching trademarks:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get single trademark by ID
export const getTrademarkById = async (req, res) => {
  try {
    const { id } = req.params;

    const trademark = await Trademark.findById(id);

    if (!trademark) {
      return res.status(404).json({
        error: "Trademark not found",
      });
    }

    res.json(trademark);
  } catch (error) {
    console.error("Error fetching trademark:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Create trademark
export const createTrademark = async (req, res) => {
  try {
    const {
      application_number,
      brand_name,
      owner,
      class: trademarkClass,
      status,
      filed_date,
    } = req.body;

    // Validation
    if (
      !application_number ||
      !brand_name ||
      !owner ||
      !trademarkClass ||
      !status ||
      !filed_date
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Check if trademark already exists
    const existingTrademark = await Trademark.findOne({ application_number });
    if (existingTrademark) {
      return res.status(400).json({
        error: "Trademark with this application number already exists",
      });
    }

    const trademark = new Trademark({
      application_number,
      brand_name,
      owner,
      class: trademarkClass,
      status,
      filed_date,
    });

    await trademark.save();

    res.status(201).json({
      message: "Trademark created successfully",
      data: trademark,
    });
  } catch (error) {
    console.error("Error creating trademark:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Update trademark
export const updateTrademark = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand_name,
      owner,
      class: trademarkClass,
      status,
      filed_date,
    } = req.body;

    const trademark = await Trademark.findById(id);

    if (!trademark) {
      return res.status(404).json({
        error: "Trademark not found",
      });
    }

    // Update fields if provided
    if (brand_name) trademark.brand_name = brand_name;
    if (owner) trademark.owner = owner;
    if (trademarkClass) trademark.class = trademarkClass;
    if (status) trademark.status = status;
    if (filed_date) trademark.filed_date = filed_date;

    await trademark.save();

    res.json({
      message: "Trademark updated successfully",
      data: trademark,
    });
  } catch (error) {
    console.error("Error updating trademark:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Delete trademark
export const deleteTrademark = async (req, res) => {
  try {
    const { id } = req.params;

    const trademark = await Trademark.findByIdAndDelete(id);

    if (!trademark) {
      return res.status(404).json({
        error: "Trademark not found",
      });
    }

    res.json({
      message: "Trademark deleted successfully",
      data: trademark,
    });
  } catch (error) {
    console.error("Error deleting trademark:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Check trademark availability with advanced search
export const checkTrademark = async (req, res) => {
  const { name, class: tmClass } = req.query;

  if (!name || name.trim().length < 2) {
    return res
      .status(400)
      .json({ error: 'Provide at least 2 characters in "name".' });
  }

  const query = name.trim();

  try {
    // First check local DB for matches
    const classFilter = tmClass ? { class: tmClass } : {};
    const dbMatches = await Trademark.find({
      brand_name: { $regex: query, $options: 'i' },
      ...classFilter,
    })
      .limit(50)
      .lean();

    if (dbMatches && dbMatches.length > 0) {
      const results = dbMatches.map(({ _id, __v, ...rest }) => ({ ...rest }));
      return res.json({
        query,
        available: results.length === 0,
        has_exact_match: results.some((r) => r.brand_name.toLowerCase() === query.toLowerCase()),
        count: results.length,
        results,
        source: 'local_db',
      });
    }

    // If no DB matches, fetch from external source (quickcompany) and upsert
    const externalUrl = `https://www.quickcompany.in/trademarks?q=${encodeURIComponent(query)}`;

    let html = '';
    let browser = null;
    let pageScraped = [];

    try {
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent(req.get('User-Agent') || 'Mozilla/5.0');
      await page.setExtraHTTPHeaders({ Accept: 'text/html,application/xhtml+xml' });
      await page.goto(externalUrl, { waitUntil: 'networkidle2', timeout: 15000 });

      // POWER DEBUG: print part of page text to confirm content
      const bodyText = await page.evaluate(() => document.body.innerText || '');
      console.log(bodyText.slice(0, 1000));

      // in-page DOM scraping (robust for JS-rendered sites)
      pageScraped = await page.evaluate((q, c) => {
        const results = [];
        document.querySelectorAll('body *').forEach((el, i) => {
          const text = el.innerText && el.innerText.trim();
          if (text && text.toLowerCase().includes(q.toLowerCase())) {
            results.push({
              application_number: `${q}-${i}`,
              brand_name: text,
              owner: 'Unknown',
              class: c || '',
              status: 'unknown',
              filed_date: '',
            });
          }
        });
        return results.slice(0, 50);
      }, query, tmClass);

      html = await page.content();
    } catch (puppErr) {
      console.warn('[SCRAPE] Puppeteer fetch failed, falling back to axios:', puppErr && puppErr.message ? puppErr.message : puppErr);
      try {
        const externalResp = await axios.get(externalUrl, {
          headers: {
            'User-Agent': req.get('User-Agent') || 'Mozilla/5.0',
            Accept: 'text/html,application/xhtml+xml',
            Referer: `https://www.quickcompany.in/trademarks?q=${encodeURIComponent(query)}`,
          },
          timeout: 15000,
        });
        html = externalResp.data;
      } catch (axErr) {
        throw axErr;
      }
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          /* ignore close errors */
        }
      }
    }

    // Use in-page scraped results if available
    let scraped = Array.isArray(pageScraped) && pageScraped.length ? pageScraped : [];

    if (!scraped.length) {
      const $ = load(html || '');
      console.log('HTML length:', (html || '').length);

      // Attempt structured selectors
      $('.trademark-card, .result-item, .search-result, li').each((i, el) => {
        try {
          const el$ = $(el);
          const brand = el$.find('.brand, .brand-name, .title, h3, h2').first().text().trim();
          const owner = el$.find('.owner, .applicant, .company').first().text().trim();
          const appNo = el$.find('.app-no, .application, .app_number').first().text().trim();
          const cls = el$.find('.class, .tm-class').first().text().trim();
          const status = el$.find('.status').first().text().trim();

          if (brand) {
            scraped.push({
              application_number: appNo || `${query}-${i}`,
              brand_name: brand,
              owner: owner || 'Unknown',
              class: cls || tmClass || '',
              status: status || 'unknown',
              filed_date: '',
              source_query: externalUrl,
            });
          }
        } catch (e) {
          // ignore single item parse errors
        }
      });

      // Generic fallback: links containing query
      if (!scraped.length) {
        $('a').each((i, el) => {
          try {
            const text = $(el).text().trim();
            if (text && text.toLowerCase().includes(query.toLowerCase())) {
              scraped.push({
                application_number: `${query}-a-${i}`,
                brand_name: text,
                owner: 'Unknown',
                class: tmClass || '',
                status: 'unknown',
                filed_date: '',
              });
            }
          } catch (e) {
            // ignore
          }
        });
      }

      // Table fallback
      if (!scraped.length) {
        $('table tr').each((i, row) => {
          const cols = $(row).find('td');
          if (cols.length >= 2) {
            const brand = $(cols[0]).text().trim();
            const owner = $(cols[1]).text().trim();
            if (brand) {
              scraped.push({
                application_number: `${query}-tbl-${i}`,
                brand_name: brand,
                owner: owner || 'Unknown',
                class: tmClass || '',
                status: 'unknown',
                filed_date: '',
                source_query: externalUrl,
              });
            }
          }
        });
      }

      // Debug dump if still empty
      if (!scraped.length) {
        try {
          const debugDir = path.join(process.cwd(), 'scrape_debug');
          if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
          const fileName = `scrape_${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
          const filePath = path.join(debugDir, fileName);
          await fs.promises.writeFile(filePath, html || '', 'utf8');
          console.warn(`[SCRAPE DEBUG] No items parsed for query="${query}". HTML saved to: ${filePath}`);
        } catch (writeErr) {
          console.error('[SCRAPE DEBUG] Failed to write debug HTML:', writeErr);
        }
      }
    }

    // Enrich parsed items (structure fields, upload image to Cloudinary when possible)
    const upserted = [];
    const enrichAndUpsert = async (item) => {
      // parse brand_name into structured fields
      const raw = (item.brand_name || '').toString();
      const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

      const parsed = {
        title: '',
        owner: item.owner || '',
        status: item.status || 'unknown',
        classes: item.class || '',
        classesArray: [],
        summary: '',
        date: '',
        registry_id: '',
      };

      // date: first line that looks like '25 Jun 2001' or '16 Aug 2024'
      for (const ln of lines) {
        const dateMatch = ln.match(/^(\d{1,2}\s+\w+\s+\d{4})/);
        if (dateMatch) {
          parsed.date = dateMatch[1];
          break;
        }
      }

      // registry id
      const idMatch = raw.match(/ID\s*[:\s]?\s*(\d{4,})/i);
      if (idMatch) parsed.registry_id = idMatch[1];

      // status keywords
      const statusKeywords = ['Registered', 'Formalities Chk Pass', 'Abandoned', 'Provisional Refusal Confirmed', 'Refused', 'Removed', 'Withdrawn', 'Objected', 'Protection Granted'];
      for (const kw of statusKeywords) {
        if (raw.toLowerCase().includes(kw.toLowerCase())) {
          parsed.status = kw;
          break;
        }
      }

      // classes
      const clsMatch = raw.match(/\[?Class\s*[:\]]\s*([0-9,\s]+)/i) || raw.match(/Class\s*[:\s]([0-9,\s]+)/i);
      if (clsMatch && clsMatch[1]) {
        parsed.classes = clsMatch[1].trim();
        parsed.classesArray = clsMatch[1].split(',').map((c) => c.trim()).filter(Boolean);
      }

      // title & owner: heuristics
      // pick first short non-date/id line as title
      parsed.title = lines.find((l) => {
        if (!l) return false;
        if (parsed.date && l.includes(parsed.date)) return false;
        if (parsed.registry_id && l.toLowerCase().includes(parsed.registry_id.toLowerCase())) return false;
        // ignore lines that look like counts or UI text
        if (/matches|type|classes|status/i.test(l)) return false;
        return l.length <= 120;
      }) || (lines[0] || item.brand_name || '');

      // owner often appears on next line after title
      const titleIndex = lines.indexOf(parsed.title);
      if (titleIndex >= 0 && lines.length > titleIndex + 1) {
        parsed.owner = lines[titleIndex + 1] || parsed.owner;
      }

      // summary: take up to 2 lines following owner/title
      const summaryStart = Math.max(titleIndex + 1, 0);
      parsed.summary = lines.slice(summaryStart + 1, summaryStart + 4).join(' ');

      // apply parsed back to item
      item.title = parsed.title;
      item.owner = parsed.owner || item.owner || 'Unknown';
      item.status = parsed.status || item.status;
      item.classes = parsed.classes || item.class || '';
      item.classesArray = parsed.classesArray;
      item.summary = parsed.summary || item.summary || '';
      item.filed_date = parsed.date || item.filed_date || '';
      if (parsed.registry_id) item.registry_id = parsed.registry_id;

      // attempt to fetch/upload company image from quickcompany by registry id
      if (parsed.registry_id) {
        const remoteImg = `https://quickcompany.blob.core.windows.net/trademarks/${parsed.registry_id}/image.jpg`;
        try {
          // let cloudinary fetch remote image
          const uploadRes = await cloudinary.uploader.upload(remoteImg, {
            folder: 'trademarks',
            public_id: item.application_number || `tm_${parsed.registry_id}`,
            overwrite: false,
            resource_type: 'image',
          });
          if (uploadRes && uploadRes.secure_url) {
            item.image = uploadRes.secure_url;
          }
        } catch (imgErr) {
          // fallback: no image available or upload failed
          // keep item.image untouched
        }
      }

      // Upsert into DB
      try {
        const filter = { application_number: item.application_number };
        const update = { $set: item };
        const opts = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true };
        const doc = await Trademark.findOneAndUpdate(filter, update, opts).lean();
        if (doc) upserted.push(doc);
      } catch (uErr) {
        console.error('[SCRAPE] Upsert error for', item.application_number, uErr?.message || uErr);
      }
    };

    const slice = (scraped || []).slice(0, 50);
    for (const item of slice) {
      // run enrich & upsert sequentially (keeps logs readable)
      // could be parallelized later
      // ensure brand_name exists
      if (!item.brand_name) item.brand_name = item.name || '';
      // enrich and upsert
      // eslint-disable-next-line no-await-in-loop
      await enrichAndUpsert(item);
    }

    const finalResults = upserted.length > 0 ? upserted : scraped;

    console.log(`[CHECK] query='${query}' source=${pageScraped && pageScraped.length ? 'puppeteer' : scraped.length ? 'cheerio' : 'none'} count=${finalResults.length}`);
    return res.json({
      query,
      available: finalResults.length === 0,
      has_exact_match: finalResults.some((r) => (r.brand_name || '').toLowerCase() === query.toLowerCase()),
      count: finalResults.length,
      results: finalResults,
      source: 'external_scrape',
    });
  } catch (err) {
    console.error('[ERROR] /api/check:', err);
    return res.status(500).json({ error: 'Database query failed: ' + (err.message || String(err)) });
  }
};

// Get trademark statistics
export const getStats = async (req, res) => {
  try {
    const total = await Trademark.countDocuments();
    const statuses = await Trademark.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return res.json({ total_trademarks: total, by_status: statuses });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Health check endpoint
export const getHealth = (req, res) => {
  res.json({ ok: true });
};
