require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const pool = require("./src/db");
const { requireAdmin } = require("./src/auth");

const app = express();
app.set("trust proxy", 1);
const uploadsDirectory = path.join(__dirname, "uploads");
const imageTypes = {
  "image/jpeg": { extension: "jpg", signature: buffer => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: "png", signature: buffer => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", signature: buffer => buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
  "image/gif": { extension: "gif", signature: buffer => ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)) }
};
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!imageTypes[file.mimetype]) {
      return callback(new Error("Only JPEG, PNG, GIF, and WebP images are supported."));
    }

    callback(null, true);
  }
});

app.use(helmet());
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:4173",
  ...(process.env.CORS_ORIGIN || "").split(",").map(origin => origin.trim()).filter(Boolean)
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(uploadsDirectory, {
  immutable: true,
  maxAge: "1y",
  index: false
}));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (e) {
  console.error("Database connection error:", e);
  res.status(503).json({ ok: false, database: "unavailable", message: "Database connection failed" });
}
});

app.post("/api/admin/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }), async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password are required" });
  try {
    const [rows] = await pool.query("SELECT id, username, password_hash FROM admins WHERE username = ?", [username]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, username: rows[0].username });
  } catch (e) { res.status(500).json({ error: "Login failed" }); }
});

app.get("/api/content", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT content_key, content_value FROM site_content WHERE is_published = 1");
    const content = {};
    rows.forEach(r => { content[r.content_key] = r.content_value; });
    res.json(content);
  } catch (e) { res.status(500).json({ error: "Could not load website content" }); }
});

app.get("/api/admin/content", requireAdmin, async (_req, res) => {
  const [rows] = await pool.query("SELECT id, content_key, content_value, is_published, updated_at FROM site_content ORDER BY content_key");
  res.json(rows);
});

app.put("/api/admin/content/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key || "").trim();
  const value = req.body?.value;
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(key) || value === undefined) return res.status(400).json({ error: "Valid key and value are required" });
  await pool.query(
    "INSERT INTO site_content (content_key, content_value, is_published) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE content_value=VALUES(content_value), is_published=VALUES(is_published)",
    [key, JSON.stringify(value), req.body.is_published === false ? 0 : 1]
  );
  res.json({ ok: true });
});

app.post("/api/admin/uploads", requireAdmin, imageUpload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Choose an image to upload." });
  }

  const imageType = imageTypes[req.file.mimetype];
  if (!imageType.signature(req.file.buffer)) {
    return res.status(400).json({ error: "The uploaded file is not a valid image." });
  }

  const filename = `${randomUUID()}.${imageType.extension}`;

  try {
    await fs.mkdir(uploadsDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadsDirectory, filename), req.file.buffer, { flag: "wx" });
    res.status(201).json({
      url: `${req.protocol}://${req.get("host")}/uploads/${filename}`
    });
  } catch (error) {
    console.error("Image upload failed:", error.message);
    res.status(500).json({ error: "Could not save the uploaded image." });
  }
});

app.get("/api/admin/enquiries", requireAdmin, async (_req, res) => {
  const [rows] = await pool.query("SELECT id, name, email, phone, service, message, status, created_at FROM enquiries ORDER BY created_at DESC LIMIT 500");
  res.json(rows);
});

app.patch("/api/admin/enquiries/:id", requireAdmin, async (req, res) => {
  const allowed = ["new", "contacted", "in_progress", "closed"];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: "Invalid status" });
  await pool.query("UPDATE enquiries SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
  res.json({ ok: true });
});

app.post("/api/enquiries", rateLimit({ windowMs: 60 * 60 * 1000, limit: 8 }), async (req, res) => {
  const { name, email, phone, service, message } = req.body || {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
  const normalizedService = typeof service === "string" ? service.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  if (!normalizedName || !normalizedPhone || !normalizedMessage) {
    return res.status(400).json({ error: "Name, phone and message are required" });
  }
  if (
    normalizedName.length > 120 ||
    normalizedEmail.length > 254 ||
    normalizedPhone.length > 30 ||
    normalizedService.length > 150 ||
    normalizedMessage.length > 3000
  ) {
    return res.status(400).json({ error: "Input is too long" });
  }
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO enquiries (name,email,phone,service,message) VALUES (?,?,?,?,?)",
      [normalizedName, normalizedEmail || null, normalizedPhone, normalizedService || null, normalizedMessage]
    );
    let notificationSent = null;

    if (process.env.SMTP_HOST && process.env.NOTIFY_EMAIL) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.NOTIFY_EMAIL,
          to: process.env.NOTIFY_EMAIL,
          subject: "New manpower service enquiry",
          text: `Name: ${normalizedName}\nEmail: ${normalizedEmail || "-"}\nPhone: ${normalizedPhone}\nService: ${normalizedService || "-"}\nMessage: ${normalizedMessage}`
        });
        notificationSent = true;
      } catch (error) {
        notificationSent = false;
        console.error("Enquiry email notification failed:", error.message);
      }
    }

    res.status(201).json({
      ok: true,
      id: result.insertId,
      notificationSent,
      message: notificationSent === false
        ? "Enquiry saved, but the email notification could not be sent."
        : "Enquiry submitted successfully"
    });
  } catch (e) { res.status(500).json({ error: "Could not submit enquiry" }); }
});

app.use((error, req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return next(error);
  }

  const isMulterError = error instanceof multer.MulterError;
  const status = isMulterError && error.code === "LIMIT_FILE_SIZE"
    ? 413
    : isMulterError || error.message.startsWith("Only JPEG")
      ? 400
      : 500;
  const message = status === 413
    ? "Image must be 5 MB or smaller."
    : status === 400
      ? error.message
      : "The request could not be completed.";

  if (status === 500) {
    console.error("API request failed:", error.message);
  }

  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT || 5001);
app.listen(port, () => console.log(`Manpower API running on http://localhost:${port}`));
