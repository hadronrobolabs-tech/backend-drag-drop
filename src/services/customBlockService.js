/**
 * Custom block store: MySQL-backed. Admin-created blocks; all users see them.
 * Uses mysql2 pool (db/index.js). inputs stored as JSON.
 */
import { getDb } from '../../db/index.js';

function rowToBlock(row) {
  if (!row) return null;
  let inputs = [];
  try {
    inputs = typeof row.inputs === 'string' ? JSON.parse(row.inputs || '[]') : (row.inputs || []);
  } catch (_) {
    inputs = [];
  }
  const fmt = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
    return String(v);
  };
  return {
    id: row.id,
    name: row.name || 'Custom',
    inputs: Array.isArray(inputs) ? inputs.slice(0, 4) : [],
    template: row.template || '',
    createdAt: fmt(row.created_at),
    updatedAt: fmt(row.updated_at),
  };
}

/** Format date as YYYY-MM-DD HH:MM:SS for MySQL DATETIME */
function toDateTimeStr(d) {
  const x = d instanceof Date ? d : new Date();
  return x.toISOString().slice(0, 19).replace('T', ' ');
}

async function nextId() {
  const pool = getDb();
  const [rows] = await pool.query(
    "SELECT id FROM custom_blocks WHERE id LIKE 'cb-%' ORDER BY id DESC LIMIT 1"
  );
  if (!rows || rows.length === 0) return 'cb-1';
  const num = parseInt(String(rows[0].id).replace(/^cb-/, ''), 10) || 0;
  return 'cb-' + (num + 1);
}

export async function listCustomBlocks() {
  const pool = getDb();
  const [rows] = await pool.query('SELECT * FROM custom_blocks ORDER BY updated_at DESC');
  return (rows || []).map(rowToBlock);
}

export async function getCustomBlockById(id) {
  const pool = getDb();
  const [rows] = await pool.query('SELECT * FROM custom_blocks WHERE id = ?', [id]);
  return rowToBlock(rows && rows[0]);
}

export async function createCustomBlock({ name = 'Custom', inputs = [], template = '' } = {}) {
  const pool = getDb();
  const id = await nextId();
  const now = toDateTimeStr(new Date());
  const inputsJson = JSON.stringify(Array.isArray(inputs) ? inputs.slice(0, 4) : []);

  await pool.query(
    'INSERT INTO custom_blocks (id, name, inputs, template, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name || 'Custom', inputsJson, String(template || ''), now, now]
  );

  return getCustomBlockById(id);
}

export async function updateCustomBlock(id, updates) {
  const pool = getDb();
  const existing = await getCustomBlockById(id);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name : existing.name;
  const inputs = updates.inputs !== undefined
    ? JSON.stringify(Array.isArray(updates.inputs) ? updates.inputs.slice(0, 4) : [])
    : JSON.stringify(existing.inputs || []);
  const template = updates.template !== undefined ? String(updates.template) : existing.template;
  const updated_at = toDateTimeStr(new Date());

  await pool.query(
    'UPDATE custom_blocks SET name = ?, inputs = ?, template = ?, updated_at = ? WHERE id = ?',
    [name, inputs, template, updated_at, id]
  );

  return getCustomBlockById(id);
}

export async function deleteCustomBlock(id) {
  const pool = getDb();
  const [result] = await pool.query('DELETE FROM custom_blocks WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
