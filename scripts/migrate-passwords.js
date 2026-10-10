import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MEMBERS_FILE = path.join(ROOT_DIR, 'data', 'members.json');
const BACKUP_FILE = path.join(ROOT_DIR, 'data', 'members.backup.json');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function runMigration() {
  if (!fs.existsSync(MEMBERS_FILE)) {
    console.log('[MIGRATION] File members.json tidak ditemukan, lewati.');
    return;
  }

  const rawData = fs.readFileSync(MEMBERS_FILE, 'utf8');
  let members = [];
  try {
    members = JSON.parse(rawData);
  } catch (err) {
    console.error('[MIGRATION ERROR] Format members.json rusak:', err.message);
    process.exit(1);
  }

  // 1. Buat backup ke data/members.backup.json
  fs.writeFileSync(BACKUP_FILE, rawData, 'utf8');
  console.log(`[MIGRATION] Backup berhasil disimpan ke: ${BACKUP_FILE}`);

  // 2. Hash password lama yang belum berupa format salt:hash
  let migratedCount = 0;
  members.forEach(member => {
    const rawPass = member.password;
    // Format hash ditandai dengan pemisah salt:hash (panjang salt 32 hex, hash 128 hex)
    const isAlreadyHashed = typeof rawPass === 'string' && rawPass.includes(':') && rawPass.split(':')[0].length === 32;

    if (!isAlreadyHashed) {
      const plaintext = (rawPass && rawPass.trim()) || 'admin1234';
      member.password = hashPassword(plaintext);
      migratedCount++;
    }
  });

  // 3. Simpan kembali data yang telah di-hash
  fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf8');
  console.log(`[MIGRATION SELESAI] Total member: ${members.length}, Password di-hash: ${migratedCount}`);
}

runMigration();
