// Vercel Serverless Function：全屋智能选品完整 API（数据层 = Supabase）
// 对应原 server.js 的全部接口，数据从 data.json 迁移到 Supabase Postgres
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function hashPassword(password, salt) { return crypto.scryptSync(password, salt, 64).toString('hex'); }
function genSalt() { return crypto.randomBytes(16).toString('hex'); }
function genToken() { return crypto.randomBytes(32).toString('hex'); }
function genId() { return Date.now().toString(36) + crypto.randomBytes(4).toString('hex'); }

const NICK_RE = /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) { resolve({}); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
function publicUser(u) {
  return { id: u.id, email: u.email, nickname: u.nickname, role: u.role, status: u.status, createdAt: u.created_at };
}
function mapProduct(p) {
  return { id: p.id, room: p.room, name: p.name, brand: p.brand, eco: p.eco, desc: p.desc, price: Number(p.price), icon: p.icon, tag: p.tag, status: p.status };
}
function mapArticle(a) {
  return { id: a.id, title: a.title, cover: a.cover, summary: a.summary, content: a.content, createdAt: a.created_at };
}
async function getAuthUser(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data } = await supabase.from('tokens').select('user_id').eq('token', token).maybeSingle();
  if (!data) return null;
  const { data: user } = await supabase.from('users').select('*').eq('id', data.user_id).maybeSingle();
  return user || null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.end();
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;
  const method = req.method;

  try {
    // ---------- 公开接口 ----------
    if (method === 'POST' && pathname === '/api/check-email') {
      const { email } = await readBody(req);
      if (!email || !EMAIL_RE.test(email)) return json(res, 200, { exists: false });
      const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      return json(res, 200, { exists: !!data });
    }

    if (method === 'POST' && pathname === '/api/register') {
      const { email, password, nickname } = await readBody(req);
      if (!email || !password) return json(res, 400, { error: '邮箱和密码不能为空' });
      if (!EMAIL_RE.test(email)) return json(res, 400, { error: '邮箱格式不正确' });
      if (password.length < 6) return json(res, 400, { error: '密码至少6位' });
      const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existing) return json(res, 409, { error: '该邮箱已注册' });
      const nick = (nickname || '').trim() || email.split('@')[0];
      if (!NICK_RE.test(nick)) return json(res, 400, { error: '昵称需 2-16 位，仅支持中英文、数字、下划线' });
      const salt = genSalt();
      const user = { id: genId(), email, password_hash: hashPassword(password, salt), salt, nickname: nick, role: 'user', status: 'active' };
      const { error: err } = await supabase.from('users').insert(user);
      if (err) return json(res, 500, { error: err.message });
      const token = genToken();
      await supabase.from('tokens').insert({ token, user_id: user.id });
      return json(res, 200, { token, user: publicUser(user) });
    }

    if (method === 'POST' && pathname === '/api/login') {
      const { email, password } = await readBody(req);
      const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!user || hashPassword(password || '', user.salt) !== user.password_hash) return json(res, 401, { error: '邮箱或密码错误' });
      if (user.status !== 'active') return json(res, 403, { error: '账号已被停用，请联系管理员' });
      const token = genToken();
      await supabase.from('tokens').insert({ token, user_id: user.id });
      return json(res, 200, { token, user: publicUser(user) });
    }

    if (method === 'POST' && pathname === '/api/forgot-password') {
      const { email } = await readBody(req);
      if (!email || !EMAIL_RE.test(email)) return json(res, 400, { error: '请输入正确的邮箱' });
      const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!user) return json(res, 404, { error: '该邮箱未注册' });
      if (user.role === 'admin') return json(res, 403, { error: '管理员账号不支持此方式重置' });
      const salt = genSalt();
      await supabase.from('users').update({ salt, password_hash: hashPassword('000000', salt) }).eq('id', user.id);
      await supabase.from('tokens').delete().eq('user_id', user.id);
      return json(res, 200, { ok: true, message: '密码已重置为 000000，请使用新密码登录' });
    }

    if (method === 'POST' && pathname === '/api/admin/login') {
      const { email, password } = await readBody(req);
      const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!user || user.role !== 'admin' || hashPassword(password || '', user.salt) !== user.password_hash) return json(res, 401, { error: '管理员账号或密码错误' });
      const token = genToken();
      await supabase.from('tokens').insert({ token, user_id: user.id });
      return json(res, 200, { token, user: publicUser(user) });
    }

    if (method === 'GET' && pathname === '/api/products') {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      return json(res, 200, { products: (data || []).map(mapProduct) });
    }
    if (method === 'GET' && pathname === '/api/brands') {
      const { data } = await supabase.from('brands').select('name').order('position');
      return json(res, 200, { brands: (data || []).map(b => b.name) });
    }
    if (method === 'GET' && pathname === '/api/ecos') {
      const { data } = await supabase.from('ecos').select('name').order('position');
      return json(res, 200, { ecos: (data || []).map(b => b.name) });
    }
    if (method === 'GET' && pathname === '/api/rooms') {
      const [r, p] = await Promise.all([
        supabase.from('rooms').select('*'),
        supabase.from('products').select('room')
      ]);
      const counts = {};
      (p.data || []).forEach(x => { counts[x.room] = (counts[x.room] || 0) + 1; });
      return json(res, 200, { rooms: (r.data || []).map(x => ({ key: x.key, name: x.name, icon: x.icon, count: counts[x.key] || 0 })) });
    }
    if (method === 'GET' && pathname === '/api/plans') {
      const [pl, pr] = await Promise.all([
        supabase.from('plans').select('*'),
        supabase.from('products').select('*')
      ]);
      const pmap = {};
      (pr.data || []).forEach(x => { pmap[x.id] = mapProduct(x); });
      const plans = (pl.data || []).map(p => ({ id: p.id, name: p.name, desc: p.desc, icon: p.icon, products: (p.products || []).map(pid => pmap[pid]).filter(Boolean) }));
      return json(res, 200, { plans });
    }
    if (method === 'GET' && pathname === '/api/articles') {
      const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: true });
      return json(res, 200, { articles: (data || []).map(mapArticle) });
    }

    // ---------- 登录用户接口 ----------
    const user = await getAuthUser(req);
    if (!user) return json(res, 401, { error: '未登录或登录已过期' });

    if (method === 'GET' && pathname === '/api/me') return json(res, 200, { user: publicUser(user) });

    if (method === 'GET' && pathname === '/api/selections') {
      const { data } = await supabase.from('selections').select('room_key, items').eq('user_id', user.id);
      const selections = {};
      (data || []).forEach(s => { selections[s.room_key] = s.items || {}; });
      return json(res, 200, { selections });
    }
    if (method === 'POST' && pathname === '/api/selections') {
      const { room_key, items } = await readBody(req);
      if (!room_key || typeof items !== 'object' || items === null) return json(res, 400, { error: '参数不完整' });
      const { error } = await supabase.from('selections').upsert({ user_id: user.id, room_key, items });
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/user-plans') {
      const [pl, pr] = await Promise.all([
        supabase.from('user_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*')
      ]);
      const pmap = {};
      (pr.data || []).forEach(x => { pmap[x.id] = mapProduct(x); });
      const plans = (pl.data || []).map(p => ({ id: p.id, name: p.name, desc: p.desc, icon: p.icon, createdAt: p.created_at, products: (p.products || []).map(pid => pmap[pid]).filter(Boolean) }));
      return json(res, 200, { plans });
    }
    if (method === 'POST' && pathname === '/api/user-plans') {
      const b = await readBody(req);
      if (!b.name) return json(res, 400, { error: '方案名称必填' });
      const plan = { id: genId(), user_id: user.id, name: b.name, desc: b.desc || '', icon: b.icon || '📋', products: Array.isArray(b.products) ? b.products : [] };
      const { error } = await supabase.from('user_plans').insert(plan);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true, plan: { id: plan.id, name: plan.name, desc: plan.desc, icon: plan.icon, createdAt: new Date().toISOString(), products: [] } });
    }
    if (method === 'PUT' && pathname.startsWith('/api/user-plans/')) {
      const pid = pathname.split('/api/user-plans/')[1];
      const b = await readBody(req);
      const patch = {};
      if (b.name !== undefined) patch.name = b.name;
      if (b.desc !== undefined) patch.desc = b.desc;
      if (b.icon !== undefined) patch.icon = b.icon;
      if (b.products !== undefined) patch.products = b.products;
      const { error } = await supabase.from('user_plans').update(patch).eq('id', pid).eq('user_id', user.id);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/user-plans/')) {
      const pid = pathname.split('/api/user-plans/')[1];
      await supabase.from('user_plans').delete().eq('id', pid).eq('user_id', user.id);
      return json(res, 200, { ok: true });
    }

    // 房间管理（登录用户即可）
    if (method === 'POST' && pathname === '/api/rooms') {
      const b = await readBody(req);
      const name = (b.name || '').trim();
      if (!name) return json(res, 400, { error: '房间名称不能为空' });
      const key = 'room_' + genId();
      const { error } = await supabase.from('rooms').insert({ key, name, icon: b.icon || '🏠' });
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'PUT' && pathname.startsWith('/api/rooms/')) {
      const key = decodeURIComponent(pathname.split('/api/rooms/')[1]);
      const b = await readBody(req);
      const patch = {};
      if (b.name !== undefined) patch.name = b.name;
      if (b.icon !== undefined) patch.icon = b.icon;
      const { error } = await supabase.from('rooms').update(patch).eq('key', key);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/rooms/')) {
      const key = decodeURIComponent(pathname.split('/api/rooms/')[1]);
      const { data: used } = await supabase.from('products').select('id', { count: 'exact' }).eq('room', key);
      if (used && used.length > 0) return json(res, 400, { error: `该房间下还有 ${used.length} 个商品，无法删除` });
      await supabase.from('rooms').delete().eq('key', key);
      return json(res, 200, { ok: true });
    }

    if (user.role !== 'admin') return json(res, 403, { error: '无权限' });

    // ---------- 管理员接口 ----------
    if (method === 'GET' && pathname === '/api/admin/stats') {
      const [users, products, brands, ecos, rooms, plans, articles, sels] = await Promise.all([
        supabase.from('users').select('*').neq('role', 'admin'),
        supabase.from('products').select('status'),
        supabase.from('brands').select('name', { count: 'exact', head: true }),
        supabase.from('ecos').select('name', { count: 'exact', head: true }),
        supabase.from('rooms').select('key', { count: 'exact', head: true }),
        supabase.from('plans').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        supabase.from('selections').select('items')
      ]);
      const us = users.data || [];
      let totalSelections = 0;
      (sels.data || []).forEach(s => { Object.values(s.items || {}).forEach(c => totalSelections += c); });
      const stats = {
        totalUsers: us.length,
        activeUsers: us.filter(u => u.status === 'active').length,
        disabledUsers: us.filter(u => u.status === 'disabled').length,
        totalProducts: (products.data || []).length,
        onProducts: (products.data || []).filter(p => p.status === 'on').length,
        offProducts: (products.data || []).filter(p => p.status !== 'on').length,
        brandCount: brands.count || 0,
        ecoCount: ecos.count || 0,
        roomCount: rooms.count || 0,
        planCount: plans.count || 0,
        articleCount: articles.count || 0,
        totalSelections,
        recentUsers: us.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5).map(publicUser)
      };
      return json(res, 200, { stats });
    }

    if (method === 'GET' && pathname === '/api/admin/users') {
      const [users, sels] = await Promise.all([
        supabase.from('users').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
        supabase.from('selections').select('user_id, items')
      ]);
      const cnt = {};
      (sels.data || []).forEach(s => {
        const c = Object.values(s.items || {}).reduce((x, v) => x + v, 0);
        cnt[s.user_id] = (cnt[s.user_id] || 0) + c;
      });
      const list = (users.data || []).map(u => ({ ...publicUser(u), selectionCount: cnt[u.id] || 0 }));
      return json(res, 200, { users: list });
    }
    const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/(\w+)$/);
    if (userMatch && method === 'POST') {
      const [, targetId, action] = userMatch;
      const { data: target } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
      if (!target) return json(res, 404, { error: '用户不存在' });
      const body = await readBody(req);
      if (action === 'disable') { await supabase.from('users').update({ status: 'disabled' }).eq('id', targetId); return json(res, 200, { ok: true }); }
      if (action === 'enable') { await supabase.from('users').update({ status: 'active' }).eq('id', targetId); return json(res, 200, { ok: true }); }
      if (action === 'reset-password' || action === 'change-password') {
        const np = action === 'reset-password' ? (body.newPassword || '123456') : body.newPassword;
        if (!np || np.length < 6) return json(res, 400, { error: '新密码至少6位' });
        const salt = genSalt();
        await supabase.from('users').update({ salt, password_hash: hashPassword(np, salt) }).eq('id', targetId);
        await supabase.from('tokens').delete().eq('user_id', targetId);
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: '未知操作' });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/admin/users/')) {
      const targetId = pathname.split('/').pop();
      await supabase.from('users').delete().eq('id', targetId);
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/admin/products') {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      return json(res, 200, { products: (data || []).map(mapProduct) });
    }
    if (method === 'POST' && pathname === '/api/admin/products') {
      const b = await readBody(req);
      if (!b.name || !b.room || b.price == null) return json(res, 400, { error: '商品名称、所属房间、价格必填' });
      const { data: ecos } = await supabase.from('ecos').select('name').order('position').limit(1);
      const product = { id: genId(), room: b.room, name: b.name, brand: b.brand || '自营', eco: b.eco || (ecos && ecos[0] && ecos[0].name) || '', desc: b.desc || '', price: Number(b.price) || 0, icon: b.icon || '📦', tag: b.tag || '', status: b.status || 'on' };
      const { error } = await supabase.from('products').insert(product);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true, product: mapProduct(product) });
    }
    const productMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)(\/(\w+))?$/);
    if (productMatch && method === 'PUT') {
      const [, pid] = productMatch;
      const b = await readBody(req);
      const patch = {};
      if (b.name !== undefined) patch.name = b.name;
      if (b.room !== undefined) patch.room = b.room;
      if (b.brand !== undefined) patch.brand = b.brand;
      if (b.eco !== undefined) patch.eco = b.eco;
      if (b.desc !== undefined) patch.desc = b.desc;
      if (b.price !== undefined) patch.price = Number(b.price) || 0;
      if (b.icon !== undefined) patch.icon = b.icon;
      if (b.tag !== undefined) patch.tag = b.tag;
      const { error } = await supabase.from('products').update(patch).eq('id', pid);
      if (error) return json(res, 500, { error: error.message });
      const { data: p } = await supabase.from('products').select('*').eq('id', pid).maybeSingle();
      return json(res, 200, { ok: true, product: p ? mapProduct(p) : null });
    }
    if (productMatch && method === 'POST') {
      const [, pid, , action] = productMatch;
      const { data: p } = await supabase.from('products').select('status').eq('id', pid).maybeSingle();
      if (!p) return json(res, 404, { error: '商品不存在' });
      if (action === 'toggle') {
        const ns = p.status === 'on' ? 'off' : 'on';
        await supabase.from('products').update({ status: ns }).eq('id', pid);
        const { data: full } = await supabase.from('products').select('*').eq('id', pid).maybeSingle();
        return json(res, 200, { ok: true, product: full ? mapProduct(full) : null });
      }
      return json(res, 404, { error: '未知操作' });
    }
    if (productMatch && method === 'DELETE') {
      const [, pid] = productMatch;
      await supabase.from('products').delete().eq('id', pid);
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/admin/brands') {
      const [b, p] = await Promise.all([supabase.from('brands').select('name').order('position'), supabase.from('products').select('brand')]);
      const cnt = {};
      (p.data || []).forEach(x => { cnt[x.brand] = (cnt[x.brand] || 0) + 1; });
      return json(res, 200, { brands: (b.data || []).map(x => ({ name: x.name, count: cnt[x.name] || 0 })) });
    }
    if (method === 'POST' && pathname === '/api/admin/brands') {
      const b = await readBody(req); const name = (b.name || '').trim();
      if (!name) return json(res, 400, { error: '品牌名不能为空' });
      const { data: existing } = await supabase.from('brands').select('name').eq('name', name).maybeSingle();
      if (existing) return json(res, 409, { error: '品牌已存在' });
      const { error } = await supabase.from('brands').insert({ name });
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'PUT' && pathname.startsWith('/api/admin/brands/')) {
      const oldName = decodeURIComponent(pathname.split('/api/admin/brands/')[1]);
      const b = await readBody(req); const newName = (b.name || '').trim();
      if (!newName) return json(res, 400, { error: '品牌名不能为空' });
      const { data: existing } = await supabase.from('brands').select('name').eq('name', oldName).maybeSingle();
      if (!existing) return json(res, 404, { error: '品牌不存在' });
      if (oldName !== newName) {
        const { data: dup } = await supabase.from('brands').select('name').eq('name', newName).maybeSingle();
        if (dup) return json(res, 409, { error: '新品牌名已存在' });
        await supabase.from('brands').update({ name: newName }).eq('name', oldName);
        await supabase.from('products').update({ brand: newName }).eq('brand', oldName);
      }
      return json(res, 200, { ok: true });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/admin/brands/')) {
      const name = decodeURIComponent(pathname.split('/api/admin/brands/')[1]);
      const { data: used } = await supabase.from('products').select('id', { count: 'exact' }).eq('brand', name);
      if (used && used.length > 0) return json(res, 400, { error: `该品牌下还有 ${used.length} 个商品，无法删除` });
      await supabase.from('brands').delete().eq('name', name);
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/admin/ecos') {
      const [b, p] = await Promise.all([supabase.from('ecos').select('name').order('position'), supabase.from('products').select('eco')]);
      const cnt = {};
      (p.data || []).forEach(x => { cnt[x.eco] = (cnt[x.eco] || 0) + 1; });
      return json(res, 200, { ecos: (b.data || []).map(x => ({ name: x.name, count: cnt[x.name] || 0 })) });
    }
    if (method === 'POST' && pathname === '/api/admin/ecos') {
      const b = await readBody(req); const name = (b.name || '').trim();
      if (!name) return json(res, 400, { error: '生态名称不能为空' });
      const { data: existing } = await supabase.from('ecos').select('name').eq('name', name).maybeSingle();
      if (existing) return json(res, 409, { error: '生态已存在' });
      const { error } = await supabase.from('ecos').insert({ name });
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'PUT' && pathname.startsWith('/api/admin/ecos/')) {
      const oldName = decodeURIComponent(pathname.split('/api/admin/ecos/')[1]);
      const b = await readBody(req); const newName = (b.name || '').trim();
      if (!newName) return json(res, 400, { error: '生态名称不能为空' });
      const { data: existing } = await supabase.from('ecos').select('name').eq('name', oldName).maybeSingle();
      if (!existing) return json(res, 404, { error: '生态不存在' });
      if (oldName !== newName) {
        const { data: dup } = await supabase.from('ecos').select('name').eq('name', newName).maybeSingle();
        if (dup) return json(res, 409, { error: '新生态名已存在' });
        await supabase.from('ecos').update({ name: newName }).eq('name', oldName);
        await supabase.from('products').update({ eco: newName }).eq('eco', oldName);
      }
      return json(res, 200, { ok: true });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/admin/ecos/')) {
      const name = decodeURIComponent(pathname.split('/api/admin/ecos/')[1]);
      const { data: used } = await supabase.from('products').select('id', { count: 'exact' }).eq('eco', name);
      if (used && used.length > 0) return json(res, 400, { error: `该生态下还有 ${used.length} 个商品，无法删除` });
      await supabase.from('ecos').delete().eq('name', name);
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/admin/plans') {
      const [pl, pr] = await Promise.all([supabase.from('plans').select('*'), supabase.from('products').select('*')]);
      const pmap = {};
      (pr.data || []).forEach(x => { pmap[x.id] = mapProduct(x); });
      const plans = (pl.data || []).map(p => ({ id: p.id, name: p.name, desc: p.desc, icon: p.icon, products: (p.products || []).map(pid => pmap[pid]).filter(Boolean) }));
      return json(res, 200, { plans });
    }
    if (method === 'POST' && pathname === '/api/admin/plans') {
      const b = await readBody(req);
      if (!b.name) return json(res, 400, { error: '方案名称必填' });
      const plan = { id: genId(), name: b.name, desc: b.desc || '', icon: b.icon || '📋', products: Array.isArray(b.products) ? b.products : [] };
      const { error } = await supabase.from('plans').insert(plan);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true, plan: { id: plan.id, name: plan.name, desc: plan.desc, icon: plan.icon, products: [] } });
    }
    if (method === 'PUT' && pathname.startsWith('/api/admin/plans/')) {
      const pid = pathname.split('/api/admin/plans/')[1];
      const b = await readBody(req);
      const patch = {};
      if (b.name !== undefined) patch.name = b.name;
      if (b.desc !== undefined) patch.desc = b.desc;
      if (b.icon !== undefined) patch.icon = b.icon;
      if (b.products !== undefined) patch.products = b.products;
      const { error } = await supabase.from('plans').update(patch).eq('id', pid);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/admin/plans/')) {
      const pid = pathname.split('/api/admin/plans/')[1];
      await supabase.from('plans').delete().eq('id', pid);
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/admin/articles') {
      const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      return json(res, 200, { articles: (data || []).map(mapArticle) });
    }
    if (method === 'POST' && pathname === '/api/admin/articles') {
      const b = await readBody(req);
      if (!b.title) return json(res, 400, { error: '标题必填' });
      const article = { id: genId(), title: b.title, cover: b.cover || '📄', summary: b.summary || '', content: b.content || '' };
      const { error } = await supabase.from('articles').insert(article);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true, article: mapArticle(article) });
    }
    if (method === 'PUT' && pathname.startsWith('/api/admin/articles/')) {
      const aid = pathname.split('/api/admin/articles/')[1];
      const b = await readBody(req);
      const patch = {};
      if (b.title !== undefined) patch.title = b.title;
      if (b.cover !== undefined) patch.cover = b.cover;
      if (b.summary !== undefined) patch.summary = b.summary;
      if (b.content !== undefined) patch.content = b.content;
      const { error } = await supabase.from('articles').update(patch).eq('id', aid);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }
    if (method === 'DELETE' && pathname.startsWith('/api/admin/articles/')) {
      const aid = pathname.split('/api/admin/articles/')[1];
      await supabase.from('articles').delete().eq('id', aid);
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: '接口不存在' });
  } catch (e) {
    return json(res, 500, { error: '服务器错误: ' + e.message });
  }
};
