// 最小诊断版 router.js - 仅测试 rewrites + module load 是否成功
const crypto = require('crypto');

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  return json(res, 200, {
    status: 'router alive',
    nodeVersion: process.version,
    env: {
      SUPABASE_URL_set: !!process.env.SUPABASE_URL,
      SUPABASE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      VERCEL: process.env.VERCEL || null,
      VERCEL_REGION: process.env.VERCEL_REGION || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null
    },
    url: req.url,
    method: req.method,
    time: new Date().toISOString()
  });
};