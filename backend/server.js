require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const pool = require('./db');
const auth = require('./auth_system');
const { transformText } = require('./rewrite_engine');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/auth/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const hashedPassword = await bcrypt.hash(value.password, 10);

  try {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [value.name, value.email, hashedPassword, 'user']
    );
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [value.email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.is_banned) return res.status(403).json({ message: 'User is banned' });

  const ok = await bcrypt.compare(value.password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

app.post('/api/rewrite', auth(), async (req, res) => {
  const { text, mode, language, preserveKeywords = [], title = '' } = req.body;
  if (!text || text.length < 10) {
    return res.status(400).json({ message: 'Please provide at least 10 characters' });
  }

  const result = transformText({ text, mode, language, keywords: preserveKeywords });
  const generatedTitle = title || text.split(' ').slice(0, 6).join(' ');
  const hashtags = generatedTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => `#${w}`);

  await pool.query(
    `INSERT INTO rewrites (user_id, source_text, rewritten_text, mode, language, similarity_score, plagiarism_safe_score, generated_title, hashtags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      text,
      result.output,
      mode || 'standard',
      language || 'en',
      result.similarity,
      result.plagiarismSafeScore,
      generatedTitle,
      hashtags.join(' '),
    ]
  );

  res.json({ ...result, generatedTitle, hashtags });
});

app.post('/api/rewrite/upload', auth(), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  let text = '';
  const fileBuffer = fs.readFileSync(req.file.path);

  if (ext === '.txt') text = fileBuffer.toString('utf8');
  else if (ext === '.docx') text = (await mammoth.extractRawText({ buffer: fileBuffer })).value;
  else if (ext === '.pdf') text = (await pdfParse(fileBuffer)).text;
  else return res.status(400).json({ message: 'Unsupported format' });

  const result = transformText({ text, mode: req.body.mode, language: req.body.language });
  res.json({ extractedText: text, ...result });
});

app.get('/api/dashboard/history', auth(), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, mode, language, generated_title, hashtags, created_at FROM rewrites WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

app.get('/api/admin/stats', auth('admin'), async (_, res) => {
  const [[users]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
  const [[rewrites]] = await pool.query('SELECT COUNT(*) AS totalRewrites FROM rewrites');
  const [[banned]] = await pool.query('SELECT COUNT(*) AS bannedUsers FROM users WHERE is_banned = 1');
  res.json({ ...users, ...rewrites, ...banned });
});

app.post('/api/admin/users/:id/ban', auth('admin'), async (req, res) => {
  await pool.query('UPDATE users SET is_banned = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'User banned' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
