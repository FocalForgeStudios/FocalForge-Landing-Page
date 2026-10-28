require('dotenv').config();
const express = require('express');
const crypto = require('node:crypto');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { z } = require('zod');

const app = express();
const port = Number(process.env.PORT || 8787);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '24kb', strict: true }));
app.use('/api/inquiries', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false }));

const projectSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  title: z.string().trim().min(2).max(180),
  category: z.enum(['visual','digital','brand']),
  summary: z.string().trim().min(10).max(2000),
  problem: z.string().trim().max(3000).optional().default(''),
  execution: z.string().trim().max(3000).optional().default(''),
  deliverables: z.string().trim().max(2000).optional().default(''),
  image_url: z.string().trim().max(2000).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(10000).optional().default(100)
}).strict();
const pricingSchema = z.object({
  track: z.enum(['visual','software','hybrid']),
  item_key: z.string().trim().regex(/^[a-z0-9_-]+$/).max(40),
  label: z.string().trim().min(2).max(180),
  min_cost: z.number().int().min(0).max(1000000000),
  max_cost: z.number().int().min(0).max(1000000000),
  published: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(10000).optional().default(100)
}).strict().refine(value => value.max_cost >= value.min_cost, { message: 'max_cost must be greater than or equal to min_cost' });
function requireAdmin(req, res, next) {
  const expected = process.env.CMS_ADMIN_TOKEN || '';
  const supplied = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!expected) return res.status(503).json({ error: 'CMS admin token is not configured.' });
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Unauthorized.' });
  return next();
}

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  service: z.enum(['Visual media', 'Software & web', 'Hybrid overhaul', 'Brand & design', 'Not sure yet']),
  brief: z.string().trim().min(10).max(5000),
  estimate: z.string().trim().max(200).optional().default(''),
  source: z.string().trim().max(100).optional().default('website')
}).strict();

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (_error) {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.get('/api/projects', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, slug, title, category, summary, image_url, tags, featured, sort_order FROM projects WHERE published = TRUE ORDER BY featured DESC, sort_order ASC, created_at DESC'
    );
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ projects: rows });
  } catch (error) { next(error); }
});

app.get('/api/pricing', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT track, item_key, label, min_cost, max_cost FROM pricing_catalog WHERE published = TRUE ORDER BY track, sort_order'
    );
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ pricing: rows });
  } catch (error) { next(error); }
});

app.post('/api/admin/projects', requireAdmin, async (req, res, next) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid project record.', issues: parsed.error.issues });
  const p = parsed.data;
  try {
    const { rows } = await pool.query(
      `INSERT INTO projects (slug,title,category,summary,problem,execution,deliverables,image_url,tags,featured,published,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
       problem=EXCLUDED.problem, execution=EXCLUDED.execution, deliverables=EXCLUDED.deliverables,
       image_url=EXCLUDED.image_url, tags=EXCLUDED.tags, featured=EXCLUDED.featured, published=EXCLUDED.published,
       sort_order=EXCLUDED.sort_order, updated_at=now()
       RETURNING id,slug,title,published,updated_at`,
      [p.slug,p.title,p.category,p.summary,p.problem,p.execution,p.deliverables,p.image_url,p.tags,p.featured,p.published,p.sort_order]
    );
    res.status(200).json({ project: rows[0] });
  } catch (error) { next(error); }
});

app.post('/api/admin/pricing', requireAdmin, async (req, res, next) => {
  const parsed = pricingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid pricing record.', issues: parsed.error.issues });
  const p = parsed.data;
  try {
    const { rows } = await pool.query(
      `INSERT INTO pricing_catalog (track,item_key,label,min_cost,max_cost,published,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (track,item_key) DO UPDATE SET label=EXCLUDED.label,min_cost=EXCLUDED.min_cost,
       max_cost=EXCLUDED.max_cost,published=EXCLUDED.published,sort_order=EXCLUDED.sort_order,updated_at=now()
       RETURNING track,item_key,label,min_cost,max_cost,published,updated_at`,
      [p.track,p.item_key,p.label,p.min_cost,p.max_cost,p.published,p.sort_order]
    );
    res.status(200).json({ pricing: rows[0] });
  } catch (error) { next(error); }
});

app.post('/api/inquiries', async (req, res, next) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the enquiry fields.', issues: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
  }
  const input = parsed.data;
  try {
    const { rows } = await pool.query(
      'INSERT INTO inquiries (name, email, service, brief, estimate, source, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at',
      [input.name, input.email, input.service, input.brief, input.estimate, input.source, 'new']
    );
    const lead = rows[0];
    // Webhook is best-effort after persistence. A webhook outage must not lose the inquiry.
    if (process.env.WEBHOOK_URL) {
      const payload = { event: 'inquiry.created', id: lead.id, createdAt: lead.created_at, name: input.name, email: input.email, service: input.service };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const headers = { 'content-type': 'application/json' };
        if (process.env.WEBHOOK_SECRET) headers['x-focal-forge-secret'] = process.env.WEBHOOK_SECRET;
        const response = await fetch(process.env.WEBHOOK_URL, { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) console.error('Inquiry webhook returned status', response.status);
      } catch (webhookError) {
        console.error('Inquiry saved; webhook delivery failed:', webhookError.message);
      }
    }
    return res.status(201).json({ ok: true, inquiryId: lead.id, createdAt: lead.created_at });
  } catch (error) { next(error); }
});

app.use((err, _req, res, _next) => {
  if (err.message === 'Origin is not allowed by CORS') return res.status(403).json({ error: 'Origin is not allowed.' });
  console.error('API error:', err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again or contact the studio directly.' });
});

const server = app.listen(port, () => console.log('Focal Forge API listening on port ' + port));
async function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
