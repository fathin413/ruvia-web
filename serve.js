import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// --- Global Error Handlers (A4) ---
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Simple .env Loader (A1) ---
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (e) {
      console.warn('[ENV] Gagal membaca file .env:', e.message);
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');
const MEMBERS_FILE = path.join(__dirname, 'data', 'members.json');
const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN || '').trim();

// --- B3: Async Queue untuk Menghindari Race Condition File JSON ---
class AsyncQueue {
  constructor() {
    this.queue = Promise.resolve();
  }
  enqueue(task) {
    const res = this.queue.then(() => task());
    this.queue = res.catch(() => {});
    return res;
  }
}
const membersQueue = new AsyncQueue();
const siteDataQueue = new AsyncQueue();

// --- B3: Penulisan Atomik (Tulis .tmp lalu Rename) ---
async function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const tmpFile = `${filePath}.${randomSuffix}.tmp`;
  const jsonStr = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(tmpFile, jsonStr, 'utf-8');
  await fs.promises.rename(tmpFile, filePath);
}

// Helper: baca data member dari file JSON (B3: Lempar error jika JSON rusak, jangan ditimpa [])
function readMembersData() {
  if (!fs.existsSync(MEMBERS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(MEMBERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (parseErr) {
    console.error('[CRITICAL] File members.json rusak atau format JSON tidak valid:', parseErr.message);
    throw new Error('Database members.json corrupt');
  }
}

// --- B4: Batas Ukuran Body Terpusat (readBody) ---
function readBody(req, limit = 100 * 1024) {
  return new Promise((resolve, reject) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    if (!isNaN(contentLength) && contentLength > limit) {
      req.resume();
      const err = new Error('Payload Too Large');
      err.statusCode = 413;
      reject(err);
      return;
    }

    let size = 0;
    const chunks = [];
    let exceeded = false;

    req.on('data', chunk => {
      if (exceeded) return;
      size += chunk.length;
      if (size > limit) {
        exceeded = true;
        req.resume();
        const err = new Error('Payload Too Large');
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (exceeded) return;
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });

    req.on('error', err => {
      if (!exceeded) reject(err);
    });
  });
}

// --- Session Stores & Rate Limiter (A1, B2) ---
const adminSessions = new Map(); // token -> { expires }
const ADMIN_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 jam

const memberSessions = new Map(); // token -> { memberId, expires }
const MEMBER_SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 hari

const loginAttempts = new Map(); // ip -> { count, firstAttempt }
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 menit
const RATE_LIMIT_MAX = 5; // Maksimal 5 percobaan gagal per 15 menit

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

function isRateLimited(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(ip);
    return false;
  }
  return record.count >= RATE_LIMIT_MAX;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || (now - record.firstAttempt > RATE_LIMIT_WINDOW)) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const cookies = {};
  header.split(';').forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k && v) cookies[k.trim()] = decodeURIComponent(v.trim());
  });
  return cookies;
}

function verifyAdminPassword(inputPass) {
  const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';
  const bufInput = Buffer.from(String(inputPass || ''));
  const bufExpected = Buffer.from(String(expectedPass));
  if (bufInput.length !== bufExpected.length) {
    crypto.timingSafeEqual(bufExpected, bufExpected);
    return false;
  }
  return crypto.timingSafeEqual(bufInput, bufExpected);
}

function isAuthenticatedAdmin(req) {
  const cookies = parseCookies(req);
  const token = cookies.ruvia_admin_session || req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expires) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

// --- Password Hashing & Verification (A2) ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, expectedHash] = stored.split(':');
  if (!salt || !expectedHash) return false;
  const calcHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const bufA = Buffer.from(calcHash);
  const bufB = Buffer.from(expectedHash);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- B2: Normalisasi WhatsApp & ID Generation ---
function normalizeWa(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return '62' + digits;
}

function generateMemberId(existingMembers) {
  const existingIds = new Set(existingMembers.map(m => (m.id || '').toUpperCase()));
  let newId;
  do {
    newId = 'RUV-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (existingIds.has(newId));
  return newId;
}

// --- Helper Sanitasi Member Object (A2, B2) ---
function sanitizeMember(m) {
  if (!m) return null;
  const copy = { ...m };
  delete copy.password;
  return copy;
}

function getPublicMemberProfile(m) {
  if (!m) return null;
  return {
    id: m.id,
    fullName: m.fullName,
    whatsapp: m.whatsapp,
    city: m.city || 'Makassar',
    tier: m.tier || 'Ruvia Gold Member'
  };
}

// --- B1: Validasi Input Server untuk Pendaftaran Member ---
function validateMemberRegistration(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Data pendaftaran tidak valid';
  }

  // Nama: Wajib string, 1..100 karakter
  if (typeof payload.fullName !== 'string') {
    return 'Nama lengkap harus berupa teks';
  }
  const name = payload.fullName.trim();
  if (name.length < 1 || name.length > 100) {
    return 'Nama lengkap wajib diisi (maksimal 100 karakter)';
  }

  // WhatsApp: Wajib string, hanya digit, +, -, spasi. Panjang digit 8..16
  if (typeof payload.whatsapp !== 'string') {
    return 'Nomor WhatsApp harus berupa teks';
  }
  const waRaw = payload.whatsapp.trim();
  if (!/^[0-9+\-\s]+$/.test(waRaw)) {
    return 'Nomor WhatsApp hanya boleh mengandung angka, +, -, dan spasi';
  }
  const waDigits = waRaw.replace(/[^0-9]/g, '');
  if (waDigits.length < 8 || waDigits.length > 16) {
    return 'Nomor WhatsApp harus terdiri dari 8 hingga 16 digit angka';
  }

  // Password: Wajib string, 8..100 karakter
  if (typeof payload.password !== 'string') {
    return 'Kata sandi harus berupa teks';
  }
  const pass = payload.password.trim();
  if (pass.length < 8 || pass.length > 100) {
    return 'Kata sandi wajib diisi minimal 8 karakter (maksimal 100 karakter)';
  }

  // Alamat: Opsional string <= 300
  if (payload.address !== undefined && payload.address !== null && payload.address !== '') {
    if (typeof payload.address !== 'string' || payload.address.length > 300) {
      return 'Alamat tidak boleh melebihi 300 karakter';
    }
  }

  // Catatan: Opsional string <= 500
  if (payload.notes !== undefined && payload.notes !== null && payload.notes !== '') {
    if (typeof payload.notes !== 'string' || payload.notes.length > 500) {
      return 'Catatan tidak boleh melebihi 500 karakter';
    }
  }

  // Email: Opsional string <= 100, format valid
  if (payload.email !== undefined && payload.email !== null && payload.email !== '') {
    if (typeof payload.email !== 'string' || payload.email.length > 100) {
      return 'Alamat email tidak boleh melebihi 100 karakter';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email.trim())) {
      return 'Format alamat email tidak valid';
    }
  }

  // Kota: Opsional string <= 100
  if (payload.city !== undefined && payload.city !== null && payload.city !== '') {
    if (typeof payload.city !== 'string' || payload.city.length > 100) {
      return 'Nama kota tidak boleh melebihi 100 karakter';
    }
  }

  // Kategori: Opsional string <= 100
  if (payload.categoryInterest !== undefined && payload.categoryInterest !== null && payload.categoryInterest !== '') {
    if (typeof payload.categoryInterest !== 'string' || payload.categoryInterest.length > 100) {
      return 'Kategori minat tidak boleh melebihi 100 karakter';
    }
  }

  return null;
}

// Helper pengirim respons JSON aman
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    // =========================================================================
    // B5: SECURITY HEADERS & CORS WHITELIST
    // =========================================================================
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const reqOrigin = req.headers.origin;
    if (reqOrigin) {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(reqOrigin);
      const isFileOrigin = reqOrigin === 'null';
      const isSameHost = req.headers.host && reqOrigin.includes(req.headers.host);
      if (isExplicitAllowed || isLocalhost || isFileOrigin || isSameHost) {
        res.setHeader('Access-Control-Allow-Origin', isFileOrigin ? '*' : reqOrigin);
        if (!isFileOrigin) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, x-admin-token, x-member-token, authorization');
      }
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

    // --- Proteksi Malformed URI (A4) ---
    let reqPath;
    try {
      reqPath = decodeURIComponent(parsedUrl.pathname);
    } catch (uriErr) {
      sendJson(res, 400, { error: 'Bad Request: Malformed URI' });
      return;
    }

    // =========================================================================
    // 1. ADMIN AUTHENTICATION API (A1, B4)
    // =========================================================================
    if (reqPath === '/api/admin/login' && req.method === 'POST') {
      const clientIp = getClientIp(req);

      // Cek batas percobaan gagal (Rate Limit 5x per 15 menit)
      if (isRateLimited(clientIp)) {
        sendJson(res, 429, { error: 'Terlalu banyak percobaan login gagal. Silakan coba lagi setelah 15 menit.' });
        return;
      }

      let body;
      try {
        body = await readBody(req, 100 * 1024); // B4: Batas 100 KB
      } catch (err) {
        if (err.statusCode === 413) {
          sendJson(res, 413, { error: 'Payload terlalu besar' });
          return;
        }
        sendJson(res, 400, { error: 'Format data permintaan tidak valid' });
        return;
      }

      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (e) {
        sendJson(res, 400, { error: 'Format JSON tidak valid' });
        return;
      }

      const inputPassword = payload.password;
      if (!verifyAdminPassword(inputPassword)) {
        recordFailedLogin(clientIp);
        sendJson(res, 401, { error: 'Password admin tidak valid' });
        return;
      }

      // Login Admin Berhasil
      resetLoginAttempts(clientIp);
      const token = crypto.randomBytes(32).toString('hex');
      adminSessions.set(token, { expires: Date.now() + ADMIN_SESSION_TTL });

      res.setHeader('Set-Cookie', `ruvia_admin_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
      sendJson(res, 200, { success: true, message: 'Login admin berhasil', token });
      return;
    }

    if (reqPath === '/api/admin/logout' && (req.method === 'POST' || req.method === 'GET')) {
      const cookies = parseCookies(req);
      const token = cookies.ruvia_admin_session || req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));
      if (token && adminSessions.has(token)) {
        adminSessions.delete(token);
      }
      res.setHeader('Set-Cookie', 'ruvia_admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      sendJson(res, 200, { success: true, message: 'Logout berhasil' });
      return;
    }

    if (reqPath === '/api/admin/check' && req.method === 'GET') {
      if (isAuthenticatedAdmin(req)) {
        sendJson(res, 200, { authenticated: true });
      } else {
        sendJson(res, 401, { authenticated: false });
      }
      return;
    }

    // =========================================================================
    // 2. MEMBERSHIP API (A1, A2, B1, B2, B3, B4)
    // =========================================================================
    if (reqPath === '/api/members') {
      // GET: Hanya untuk admin terautentikasi (A1), password dihilangkan (A2)
      if (req.method === 'GET') {
        if (!isAuthenticatedAdmin(req)) {
          sendJson(res, 401, { error: 'Unauthorized: Sesi admin diperlukan untuk melihat daftar member' });
          return;
        }

        try {
          const members = readMembersData();
          const safeMembers = members.map(sanitizeMember);
          sendJson(res, 200, safeMembers);
        } catch (err) {
          console.error('[GET MEMBERS ERROR]', err);
          sendJson(res, 500, { error: 'Gagal membaca data member' });
        }
        return;
      }

      // POST: Pendaftaran member baru (B1, B2, B3, B4)
      if (req.method === 'POST') {
        let body;
        try {
          body = await readBody(req, 100 * 1024); // B4: Batas maksimal 100 KB
        } catch (err) {
          if (err.statusCode === 413) {
            sendJson(res, 413, { error: 'Payload terlalu besar (maksimal 100 KB)' });
            return;
          }
          sendJson(res, 400, { error: 'Gagal membaca data permintaan' });
          return;
        }

        let payload;
        try {
          payload = JSON.parse(body || '{}');
        } catch (e) {
          sendJson(res, 400, { error: 'Format JSON tidak valid' });
          return;
        }

        // B1: Validasi ketat tipe & panjang input
        const validationError = validateMemberRegistration(payload);
        if (validationError) {
          sendJson(res, 400, { error: validationError });
          return;
        }

        // B3: Operasi penulisan dengan antrean promise (mutex)
        try {
          const result = await membersQueue.enqueue(async () => {
            const members = readMembersData(); // Lempar error jika JSON corrupt

            // B2: Normalisasi WA & pencocokan tepat
            const normNewWa = normalizeWa(payload.whatsapp);
            const existing = members.find(m => normalizeWa(m.whatsapp) === normNewWa);
            if (existing) {
              return { status: 409, error: 'Nomor WhatsApp ini sudah terdaftar sebagai member. Silakan masuk melalui tab Login.' };
            }

            // B2: ID acak crypto.randomBytes(4) dengan pengecekan bentrok
            const newId = generateMemberId(members);
            const newMember = {
              id: newId,
              fullName: payload.fullName.trim(),
              whatsapp: payload.whatsapp.trim(),
              password: hashPassword(payload.password.trim()), // Hashing scrypt + salt (A2)
              email: (payload.email || '').trim(),
              birthDate: payload.birthDate || '',
              city: payload.city || 'Makassar',
              address: (payload.address || '').trim(),
              categoryInterest: payload.categoryInterest || 'Sofa & Ruang Tamu',
              notes: (payload.notes || '').trim(),
              tier: 'Ruvia Gold Member',
              status: 'Aktif',
              registeredAt: new Date().toISOString()
            };

            members.unshift(newMember);

            // B3: Penulisan atomik (.tmp + rename)
            await atomicWriteJson(MEMBERS_FILE, members);

            return { status: 201, member: newMember };
          });

          if (result.status === 409) {
            sendJson(res, 409, { error: result.error });
            return;
          }

          // B2: Sesi cookie HttpOnly untuk member
          const memberToken = crypto.randomBytes(32).toString('hex');
          memberSessions.set(memberToken, { memberId: result.member.id, expires: Date.now() + MEMBER_SESSION_TTL });
          res.setHeader('Set-Cookie', `ruvia_member_session=${memberToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);

          sendJson(res, 201, {
            success: true,
            message: 'Pendaftaran akun member berhasil!',
            member: getPublicMemberProfile(result.member)
          });
        } catch (err) {
          console.error('[MEMBER REGISTRATION ERROR]', err);
          sendJson(res, 500, { error: 'Terjadi kesalahan pada server saat memproses pendaftaran' });
        }
        return;
      }

      // DELETE: Hanya untuk admin terautentikasi (A1, B3, B4)
      if (req.method === 'DELETE') {
        if (!isAuthenticatedAdmin(req)) {
          sendJson(res, 401, { error: 'Unauthorized: Sesi admin diperlukan untuk menghapus member' });
          return;
        }

        let body = '';
        try {
          body = await readBody(req, 100 * 1024); // B4: Batas 100 KB
        } catch (err) {
          if (err.statusCode === 413) {
            sendJson(res, 413, { error: 'Payload terlalu besar' });
            return;
          }
        }

        let targetId = parsedUrl.searchParams.get('id');
        if (!targetId && body) {
          try {
            const b = JSON.parse(body);
            targetId = b.id;
          } catch (e) {}
        }

        if (!targetId || typeof targetId !== 'string') {
          sendJson(res, 400, { error: 'ID Member diperlukan' });
          return;
        }

        try {
          const deleteResult = await membersQueue.enqueue(async () => {
            let members = readMembersData();
            const initialLen = members.length;
            members = members.filter(m => m.id !== targetId);

            if (members.length === initialLen) {
              return { notFound: true };
            }

            // B3: Penulisan atomik
            await atomicWriteJson(MEMBERS_FILE, members);
            return { success: true };
          });

          if (deleteResult.notFound) {
            sendJson(res, 404, { error: 'Member tidak ditemukan' });
            return;
          }

          sendJson(res, 200, { success: true, message: 'Member berhasil dihapus' });
        } catch (err) {
          console.error('[DELETE MEMBER ERROR]', err);
          sendJson(res, 500, { error: 'Terjadi kesalahan pada server saat menghapus member' });
        }
        return;
      }
    }

    // --- B2: MEMBER LOGIN (Normalisasi 62xxxx, pencocokan === presisi, cookie HttpOnly) ---
    if (reqPath === '/api/members/login' && req.method === 'POST') {
      let body;
      try {
        body = await readBody(req, 100 * 1024); // B4: Batas 100 KB
      } catch (err) {
        if (err.statusCode === 413) {
          sendJson(res, 413, { error: 'Payload terlalu besar' });
          return;
        }
        sendJson(res, 400, { error: 'Gagal membaca data permintaan' });
        return;
      }

      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (e) {
        sendJson(res, 400, { error: 'Format JSON tidak valid' });
        return;
      }

      if (typeof payload.identifier !== 'string' || typeof payload.password !== 'string') {
        sendJson(res, 400, { error: 'Nomor WhatsApp / ID Member dan kata sandi wajib diisi.' });
        return;
      }

      const identifier = payload.identifier.trim();
      const password = payload.password.trim();

      if (!identifier || !password) {
        sendJson(res, 400, { error: 'Nomor WhatsApp / ID Member dan kata sandi wajib diisi.' });
        return;
      }

      // B2: Identifier digit kurang dari 8 ditolak jika mencoba login via nomor telepon
      const cleanDigits = identifier.replace(/[^0-9]/g, '');
      const isPhoneLike = cleanDigits.length > 0 && !identifier.includes('@') && !identifier.toUpperCase().startsWith('RUV-');
      if (isPhoneLike && cleanDigits.length < 8) {
        sendJson(res, 400, { error: 'Nomor WhatsApp tidak valid (minimal 8 digit angka).' });
        return;
      }

      try {
        const members = readMembersData();
        const normIdentWa = cleanDigits.length >= 8 ? normalizeWa(identifier) : null;
        const upperIdent = identifier.toUpperCase();
        const lowerIdent = identifier.toLowerCase();

        // B2: Pencocokan tepat dengan ===, tidak ada endsWith
        const member = members.find(m => {
          if (normIdentWa && m.whatsapp) {
            const normMemberWa = normalizeWa(m.whatsapp);
            if (normMemberWa && normMemberWa === normIdentWa) {
              return true;
            }
          }
          if (m.id && m.id.toUpperCase() === upperIdent) {
            return true;
          }
          if (m.email && m.email.toLowerCase() === lowerIdent) {
            return true;
          }
          return false;
        });

        if (!member) {
          sendJson(res, 401, { error: 'Akun member tidak ditemukan. Periksa kembali nomor WA, ID Member, atau Email Anda.' });
          return;
        }

        // Verifikasi password tanpa fallback '123456' (A2)
        if (!verifyPassword(password, member.password)) {
          sendJson(res, 401, { error: 'Kata sandi tidak sesuai. Silakan periksa kembali.' });
          return;
        }

        // B2: Sesi cookie HttpOnly untuk member
        const memberToken = crypto.randomBytes(32).toString('hex');
        memberSessions.set(memberToken, { memberId: member.id, expires: Date.now() + MEMBER_SESSION_TTL });
        res.setHeader('Set-Cookie', `ruvia_member_session=${memberToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);

        sendJson(res, 200, {
          success: true,
          message: 'Berhasil masuk ke akun member!',
          member: getPublicMemberProfile(member),
          token: memberToken
        });
      } catch (err) {
        console.error('[MEMBER LOGIN ERROR]', err);
        sendJson(res, 500, { error: 'Terjadi kesalahan pada server saat memproses login' });
      }
      return;
    }

    // --- B2: GET /api/members/me (Cek sesi aktif member dari cookie HttpOnly atau header token) ---
    if (reqPath === '/api/members/me' && req.method === 'GET') {
      const cookies = parseCookies(req);
      const token = cookies.ruvia_member_session || req.headers['x-member-token'] || (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));
      if (!token || !memberSessions.has(token)) {
        sendJson(res, 401, { authenticated: false, error: 'Tidak ada sesi aktif' });
        return;
      }
      const session = memberSessions.get(token);
      if (Date.now() > session.expires) {
        memberSessions.delete(token);
        sendJson(res, 401, { authenticated: false, error: 'Sesi telah kedaluwarsa' });
        return;
      }
      try {
        const members = readMembersData();
        const member = members.find(m => m.id === session.memberId);
        if (!member) {
          sendJson(res, 404, { authenticated: false, error: 'Akun member tidak ditemukan' });
          return;
        }
        sendJson(res, 200, {
          authenticated: true,
          member: getPublicMemberProfile(member)
        });
      } catch (err) {
        console.error('[MEMBERS ME ERROR]', err);
        sendJson(res, 500, { error: 'Gagal memuat profil member' });
      }
      return;
    }

    // --- B2: POST /api/members/logout (Hapus sesi cookie member) ---
    if (reqPath === '/api/members/logout' && (req.method === 'POST' || req.method === 'GET')) {
      const cookies = parseCookies(req);
      const token = cookies.ruvia_member_session || req.headers['x-member-token'] || (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));
      if (token && memberSessions.has(token)) {
        memberSessions.delete(token);
      }
      res.setHeader('Set-Cookie', 'ruvia_member_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      sendJson(res, 200, { success: true, message: 'Logout member berhasil' });
      return;
    }

    // =========================================================================
    // 3. BACKEND CMS DATA API (A1, B3, B4)
    // =========================================================================
    if (reqPath === '/api/data') {
      if (req.method === 'GET') {
        try {
          if (!fs.existsSync(DATA_FILE)) {
            sendJson(res, 404, { error: 'Data file not found' });
            return;
          }
          const data = fs.readFileSync(DATA_FILE, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch (err) {
          console.error('[GET DATA ERROR]', err);
          sendJson(res, 500, { error: 'Gagal membaca data dari server' });
        }
        return;
      }

      if (req.method === 'POST') {
        // Hanya untuk admin terautentikasi (A1)
        if (!isAuthenticatedAdmin(req)) {
          sendJson(res, 401, { error: 'Unauthorized: Sesi admin diperlukan untuk menyimpan perubahan data' });
          return;
        }

        let body;
        try {
          body = await readBody(req, 5 * 1024 * 1024); // B4: Batas maksimal 5 MB untuk site-data
        } catch (err) {
          if (err.statusCode === 413) {
            sendJson(res, 413, { error: 'Payload terlalu besar (maksimal 5 MB)' });
            return;
          }
          sendJson(res, 400, { error: 'Gagal membaca data permintaan' });
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          sendJson(res, 400, { error: 'Format JSON tidak valid' });
          return;
        }

        // B3: Penulisan atomik dengan antrean promise
        try {
          await siteDataQueue.enqueue(async () => {
            await atomicWriteJson(DATA_FILE, parsed);
          });
          sendJson(res, 200, { success: true, message: 'Data backend berhasil disimpan!', timestamp: new Date().toISOString() });
        } catch (err) {
          console.error('[SAVE SITE DATA ERROR]', err);
          sendJson(res, 500, { error: 'Gagal menyimpan data ke server' });
        }
        return;
      }
    }

    // =========================================================================
    // 4. STATIC FILES ROUTING DENGAN WHITELIST KETAT (A3)
    // =========================================================================
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    } else if (reqPath === '/admin') {
      res.writeHead(301, { 'Location': '/admin/' });
      res.end();
      return;
    } else if (reqPath === '/admin/') {
      reqPath = '/admin/index.html';
    } else if (reqPath === '/admin.css') {
      reqPath = '/admin/admin.css';
    } else if (reqPath === '/admin.js') {
      reqPath = '/admin/admin.js';
    }

    const cleanPath = reqPath.split('?')[0];

    // Blokir file tersembunyi (diawali titik seperti .env, .git)
    const hasHiddenSegment = cleanPath.split('/').some(seg => seg.startsWith('.') && seg.length > 1);
    // Blokir folder sensitif (/data/, /scripts/, /node_modules/)
    const isSensitiveDir = cleanPath.startsWith('/data/') || cleanPath.startsWith('/scripts/') || cleanPath.startsWith('/node_modules/');
    // Blokir file kode server dan konfigurasi
    const isSensitiveFile = cleanPath === '/serve.js' || cleanPath === '/package.json' || cleanPath === '/package-lock.json' || cleanPath.startsWith('/.env');

    if (hasHiddenSegment || isSensitiveDir || isSensitiveFile) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    // Normalisasi dan pastikan tidak ada directory traversal keluar dari ROOT
    const normalized = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');
    const resolvedPath = path.resolve(__dirname, '.' + normalized);
    const rootPrefix = __dirname + path.sep;

    if (!resolvedPath.startsWith(rootPrefix) && resolvedPath !== __dirname) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    // Whitelist perizinan file statis publik (A3)
    const relFromRoot = path.relative(__dirname, resolvedPath).replace(/\\/g, '/');
    const isAllowed =
      relFromRoot.endsWith('.html') ||
      relFromRoot.startsWith('assets/') ||
      relFromRoot.startsWith('components/') ||
      relFromRoot.startsWith('admin/') ||
      relFromRoot === 'styles.css' ||
      relFromRoot === 'script.js' ||
      relFromRoot === 'favicon.ico';

    if (!isAllowed) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    let finalFilePath = resolvedPath;
    if (fs.existsSync(finalFilePath) && fs.statSync(finalFilePath).isDirectory()) {
      finalFilePath = path.join(finalFilePath, 'index.html');
    }

    let ext = path.extname(finalFilePath).toLowerCase();
    if (!ext && fs.existsSync(finalFilePath + '.html')) {
      finalFilePath = finalFilePath + '.html';
      ext = '.html';
    }

    fs.readFile(finalFilePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found - Ruvia Furniture');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('500 Internal Server Error');
        }
        return;
      }

      if (ext === '.html') {
        let html = data.toString('utf-8');
        if (html.includes('id="navbar-placeholder"')) {
          const navbarPath = path.join(__dirname, 'components', 'navbar.html');
          if (fs.existsSync(navbarPath)) {
            let navbarHtml = fs.readFileSync(navbarPath, 'utf-8');
            const currentBase = path.basename(finalFilePath);
            navbarHtml = navbarHtml.replace(
              new RegExp(`href=["']${currentBase}["']\\s+class=["']nav-link["']`, 'i'),
              `href="${currentBase}" class="nav-link active"`
            );
            html = html.replace(/<div\s+id=["']navbar-placeholder["']><\/div>/gi, navbarHtml);
          }
        }
        if (html.includes('id="footer-placeholder"')) {
          const footerPath = path.join(__dirname, 'components', 'footer.html');
          if (fs.existsSync(footerPath)) {
            const footerHtml = fs.readFileSync(footerPath, 'utf-8');
            html = html.replace(/<div\s+id=["']footer-placeholder["']><\/div>/gi, footerHtml);
          }
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (fatalErr) {
    console.error('[FATAL SERVER ERROR]', fatalErr);
    if (!res.headersSent) {
      sendJson(res, 500, { error: '500 Internal Server Error' });
    }
  }
});

const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Ruvia server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Admin Dashboard available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/admin`);
});

