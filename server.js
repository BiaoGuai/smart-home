// 零依赖后端：Node 内置模块 + JSON 持久化
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'data.json');

const SEED_PRODUCTS = [
  {id:'l1',room:'living',name:'智能开关Pro 双开 Mesh2.0',brand:'小米',eco:'米家生态',desc:'单火/零火兼容，电量统计，接入米家',price:132,icon:'💡',tag:'热卖'},
  {id:'l2',room:'living',name:'灵犀4.0 全光谱吸顶灯 C400',brand:'Yeelight易来',eco:'米家生态',desc:'48W全光谱护眼，客厅卧室通用',price:304,icon:'💡',tag:'推荐'},
  {id:'l3',room:'living',name:'智能窗帘2（电机+3米轨道）',brand:'米家',eco:'米家生态',desc:'语音/远程/定时，承重60kg静音',price:765,icon:'🪟',tag:'推荐'},
  {id:'l4',room:'living',name:'C6c 500万云台摄像头',brand:'萤石',eco:'米家生态',desc:'AI人形宠物检测，360°云台',price:209,icon:'📷',tag:'新品'},
  {id:'l5',room:'living',name:'小爱音箱 Pro',brand:'小米',eco:'米家生态',desc:'红外遥控传统家电，蓝牙Mesh网关',price:269,icon:'🔊',tag:'热卖'},
  {id:'l6',room:'living',name:'空调伴侣2',brand:'米家',eco:'米家生态',desc:'传统空调变智能，睡后调温+电量统计',price:79,icon:'🌡️',tag:''},
  {id:'l7',room:'living',name:'人在传感器（毫米波雷达）',brand:'小米',eco:'米家生态',desc:'静态人体感知，130°广角，3年续航',price:99,icon:'📡',tag:''},
  {id:'l8',room:'living',name:'中枢网关',brand:'小米',eco:'米家生态',desc:'断网本地联动，多设备稳定不卡顿',price:349,icon:'🌐',tag:''},
  {id:'b1',room:'bedroom',name:'灵犀4.0 全光谱吸顶灯 C400',brand:'Yeelight易来',eco:'米家生态',desc:'48W全光谱护眼，无极调光调色',price:304,icon:'💡',tag:'推荐'},
  {id:'b2',room:'bedroom',name:'智能窗帘2（电机+轨道）',brand:'米家',eco:'米家生态',desc:'静音电机，晨起自动拉开',price:765,icon:'🪟',tag:'热卖'},
  {id:'b3',room:'bedroom',name:'智能开关（零火版）',brand:'小米',eco:'米家生态',desc:'替换传统开关，床头双控',price:119,icon:'🔘',tag:''},
  {id:'b4',room:'bedroom',name:'空调伴侣2',brand:'米家',eco:'米家生态',desc:'睡眠曲线自动调温，电量统计',price:79,icon:'🌡️',tag:''},
  {id:'b5',room:'bedroom',name:'床头灯2',brand:'米家',eco:'米家生态',desc:'1600万色，2700-6500K，通体柔光',price:179,icon:'🛋️',tag:'新品'},
  {id:'b6',room:'bedroom',name:'门窗传感器2',brand:'小米',eco:'米家生态',desc:'WiFi+蓝牙双模直连，光照判断',price:49,icon:'🔔',tag:''},
  {id:'b7',room:'bedroom',name:'人体传感器2S',brand:'小米',eco:'米家生态',desc:'高灵敏度，升级光照传感器，3年续航',price:69,icon:'📡',tag:''},
  {id:'s1',room:'second_bedroom',name:'灵犀4.0 全光谱吸顶灯 C400',brand:'Yeelight易来',eco:'米家生态',desc:'全光谱护眼，冷暖双色',price:304,icon:'💡',tag:''},
  {id:'s2',room:'second_bedroom',name:'智能窗帘2（电机+轨道）',brand:'米家',eco:'米家生态',desc:'静音电机，定时开合',price:765,icon:'🪟',tag:''},
  {id:'s3',room:'second_bedroom',name:'智能开关（零火版）',brand:'小米',eco:'米家生态',desc:'Zigbee稳定可靠，场景联动',price:119,icon:'🔘',tag:''},
  {id:'s4',room:'second_bedroom',name:'空调伴侣2',brand:'米家',eco:'米家生态',desc:'远程开关空调，节能省电',price:79,icon:'🌡️',tag:''},
  {id:'s5',room:'second_bedroom',name:'门窗传感器2',brand:'小米',eco:'米家生态',desc:'开合状态实时通知',price:49,icon:'🔔',tag:''},
  {id:'k1',room:'kitchen',name:'智能天然气卫士',brand:'小米',eco:'米家生态',desc:'霍尼韦尔联合，70dB声光报警+远程推送',price:179,icon:'⚠️',tag:'必装'},
  {id:'k2',room:'kitchen',name:'烟感卫士2',brand:'小米',eco:'米家生态',desc:'火灾烟雾报警，远程提醒，智能联动',price:148,icon:'🔥',tag:'必装'},
  {id:'k3',room:'kitchen',name:'智能开关（零火版）',brand:'小米',eco:'米家生态',desc:'控制厨房主灯和辅助灯',price:119,icon:'🔘',tag:''},
  {id:'k4',room:'kitchen',name:'智能插座3',brand:'米家',eco:'米家生态',desc:'远程断电，定时关闭电器',price:59,icon:'🔌',tag:''},
  {id:'k5',room:'kitchen',name:'温湿度计2',brand:'米家',eco:'米家生态',desc:'联动空调/加湿器，自动调节',price:30,icon:'🌡️',tag:''},
  {id:'br1',room:'bathroom',name:'智能浴霸（2400W）',brand:'米家',eco:'米家生态',desc:'取暖/换气/照明一体，语音控温',price:402,icon:'♨️',tag:'推荐'},
  {id:'br2',room:'bathroom',name:'人在传感器（毫米波雷达）',brand:'小米',eco:'米家生态',desc:'人来自动亮灯，人走延时关',price:99,icon:'📡',tag:''},
  {id:'br3',room:'bathroom',name:'智能开关（零火版）',brand:'小米',eco:'米家生态',desc:'防水面板，浴霸/灯独立控制',price:119,icon:'🔘',tag:''},
  {id:'br4',room:'bathroom',name:'门窗传感器2',brand:'小米',eco:'米家生态',desc:'卫生间门开合监测',price:49,icon:'🔔',tag:''},
  {id:'bl1',room:'balcony',name:'智能晾衣机2',brand:'米家',eco:'米家生态',desc:'超薄隐形，94个晾晒位，遥控升降',price:881,icon:'👕',tag:'推荐'},
  {id:'bl2',room:'balcony',name:'智能窗帘2（电机+轨道）',brand:'米家',eco:'米家生态',desc:'遮阳帘自动开合，防晒节能',price:765,icon:'🪟',tag:''},
  {id:'bl3',room:'balcony',name:'门窗传感器2',brand:'小米',eco:'米家生态',desc:'阳台门开合监测',price:49,icon:'🔔',tag:''},
  {id:'bl4',room:'balcony',name:'智能插座3',brand:'米家',eco:'米家生态',desc:'定时控制阳台电器',price:59,icon:'🔌',tag:''},
  {id:'st1',room:'study',name:'台灯2 Lite',brand:'米家',eco:'米家生态',desc:'Ra90高显色，三轴灵活布光',price:71,icon:'💡',tag:'推荐'},
  {id:'st2',room:'study',name:'台灯2（60cm长灯头）',brand:'米家',eco:'米家生态',desc:'前向投光，R9达90，减少眩光',price:199,icon:'🪫',tag:''},
  {id:'st3',room:'study',name:'灵犀4.0 全光谱吸顶灯 C400',brand:'Yeelight易来',eco:'米家生态',desc:'全光谱护眼，阅读模式',price:304,icon:'💡',tag:''},
  {id:'st4',room:'study',name:'空调伴侣2',brand:'米家',eco:'米家生态',desc:'恒温工作环境',price:79,icon:'🌡️',tag:''},
  {id:'st5',room:'study',name:'智能插座3',brand:'米家',eco:'米家生态',desc:'电脑/打印机用电管理',price:59,icon:'🔌',tag:''},
  {id:'e1',room:'entrance',name:'智能门锁2',brand:'小米',eco:'米家生态',desc:'指纹/密码/NFC，C级锁芯，自动上锁',price:999,icon:'🔐',tag:'推荐'},
  {id:'e2',room:'entrance',name:'智能门锁 E30',brand:'小米',eco:'米家生态',desc:'3.5寸彩屏，9种开锁，AI猫眼',price:799,icon:'🔔',tag:'热卖'},
  {id:'e3',room:'entrance',name:'门窗传感器2',brand:'小米',eco:'米家生态',desc:'大门开合监测',price:49,icon:'🔔',tag:''},
  {id:'e4',room:'entrance',name:'人在传感器（毫米波雷达）',brand:'小米',eco:'米家生态',desc:'人来亮灯，延时关闭',price:99,icon:'📡',tag:''},
  {id:'e5',room:'entrance',name:'智能开关（单开）',brand:'小米',eco:'米家生态',desc:'玄关灯智能控制',price:69,icon:'🔘',tag:''},
  {id:'l9',room:'living',name:'P20 Max 扫拖机器人',brand:'石头',eco:'米家生态',desc:'0缠绕系统，升降底盘，扫拖一体',price:3599,icon:'🤖',tag:'热卖'},
  {id:'l10',room:'living',name:'净化加湿器3 Pro',brand:'米家',eco:'米家生态',desc:'2000mL/h加湿+422m³/h净化一体',price:1999,icon:'💨',tag:'推荐'},
  {id:'l11',room:'living',name:'智能氛围灯带',brand:'米家',eco:'米家生态',desc:'1600万色，音乐律动，App控制',price:159,icon:'🎨',tag:'新品'},
  {id:'b8',room:'bedroom',name:'无雾加湿器3',brand:'米家',eco:'米家生态',desc:'600mL/h，银离子抗菌，静音运行',price:399,icon:'💧',tag:''},
  {id:'b9',room:'bedroom',name:'智能香薰机',brand:'米家',eco:'米家生态',desc:'App控制出香，定时关闭',price:229,icon:'🌸',tag:''},
  {id:'e6',room:'entrance',name:'智能门铃4',brand:'小米',eco:'米家生态',desc:'300万双摄，2K画质，移动侦测',price:279,icon:'🔔',tag:'热卖'},
  {id:'e7',room:'entrance',name:'智能猫眼2',brand:'小米',eco:'米家生态',desc:'可视对讲，远程监控，红外夜视',price:569,icon:'👁️',tag:''},
];

const SEED_BRANDS = ['小米','米家','Yeelight易来','萤石','石头'];
const SEED_ECOS = ['米家生态','华为生态','天猫精灵','Apple HomeKit'];
const SEED_ROOMS = [
  {key:'living',name:'客厅',icon:'🛋️'},
  {key:'bedroom',name:'主卧',icon:'🛏️'},
  {key:'second_bedroom',name:'次卧',icon:'🛌'},
  {key:'kitchen',name:'厨房',icon:'🍳'},
  {key:'bathroom',name:'卫生间',icon:'🚿'},
  {key:'balcony',name:'阳台',icon:'🌿'},
  {key:'study',name:'书房',icon:'📚'},
  {key:'entrance',name:'玄关',icon:'🚪'},
];

const SEED_PLANS = [
  {id:'plan_a', name:'A方案 · 经济实用', desc:'核心空间基础智能，性价比之选', icon:'💰', products:['l2','l1','b1','b3','k1','e1']},
  {id:'plan_b', name:'B方案 · 智能安防', desc:'全屋安全防护，居家更安心', icon:'🛡️', products:['e1','l4','k1','k2','e3','b6']},
  {id:'plan_c', name:'C方案 · 全屋豪华', desc:'八大空间全覆盖，一步到位', icon:'👑', products:['l2','l3','l4','l5','b1','b2','k1','br1','bl1','e1','e2']},
  {id:'plan_d', name:'D方案 · 懒人清洁', desc:'扫地机器人+净化，解放双手', icon:'🤖', products:['l9','l10','st5','k4']},
  {id:'plan_e', name:'E方案 · 健康空气', desc:'净化加湿香薰，呼吸更安心', icon:'💨', products:['l10','b8','b9','k5']},
  {id:'plan_f', name:'F方案 · 智能卫浴', desc:'浴霸+感应，卫生间智能化', icon:'♨️', products:['br1','br2','br3','br4']},
];

const SEED_ARTICLES = [
  {id:'a1', title:'什么是全屋智能？入门必读', cover:'🏠', summary:'从零开始了解全屋智能的核心概念、设备分类与搭建顺序，避免踩坑。', content:'全屋智能，是指通过统一平台把家中的灯光、窗帘、门锁、安防传感器、家电等设备接入网络，实现远程控制、语音控制与场景联动。\n\n一套完整的全屋智能通常包含四类设备：控制类（智能开关、网关）、安防类（门锁、摄像头、燃气/烟感传感器）、舒适类（窗帘电机、空调伴侣、浴霸）和环境类（温湿度计、人在传感器）。\n\n搭建顺序建议：先选生态（米家、华为、HomeKit 等），再装网关，最后逐房间配设备。装修前预留零线，能大幅提升智能开关的稳定性。'},
  {id:'a2', title:'智能开关选单火还是零火？', cover:'🔘', summary:'装修前一定要看：单火版和零火版的区别，选错了会很麻烦。', content:'智能开关分单火版和零火版，核心区别在于安装时是否需要零线。\n\n零火版需要底盒里有零线，运行更稳定、不会出现"鬼火"（灯具微亮），支持功率也更大，是装修时首推的方案。\n\n单火版无需零线，适合老房改造或已装修完、底盒没零线的情况。它的缺点是部分小功率灯具可能出现微亮或闪烁。\n\n结论：正在装修、能预留零线，选零火版；已装修没零线，才选单火版。'},
  {id:'a3', title:'家庭安防：燃气和烟感传感器', cover:'⚠️', summary:'为什么燃气泄漏报警器和烟雾报警器，是每家每户都应该装的安防设备。', content:'燃气泄漏和火灾是家庭最常见的安全隐患。智能燃气卫士能探测天然气泄漏，发出 70 分贝以上的声光报警，并推送手机通知，部分还支持联动电磁阀自动切断气源。\n\n烟雾报警器（烟感）采用光电式探测，火灾初期就能报警，配合高分贝本地报警和远程提醒，为逃生争取时间。\n\n这两类设备价格都不高，一两百元就能买到正规品牌，却能在关键时刻救命，建议厨房各装一个。'},
  {id:'a4', title:'扫地机器人怎么选？', cover:'🤖', summary:'吸力、导航、自清洁三大核心，一文看懂扫地机器人选购要点。', content:'选购扫地机器人，重点看三件事：吸力、导航避障和自清洁能力。\n\n吸力决定清洁力度，日常家庭 4000Pa 以上就够用，有宠物或地毯可选更高吸力机型。导航决定它会不会撞墙、会不会被电线卡住，优先选激光导航或 AI 视觉避障。\n\n自清洁是近两年的分水岭：带自动集尘、自动洗拖布、自动上下水的高端机型，几乎不用手动清理；预算有限选基础款，但需手动清理尘盒和拖布。\n\n预算建议：2000 元内选性价比机型，3000-5000 元选带自清洁的中高端，一步到位。'},
  {id:'a5', title:'全屋智能预算怎么规划', cover:'💰', summary:'从几千到几万，三档预算教你合理分配智能家居投入。', content:'全屋智能的花费跨度很大，关键在于明确需求，避免为用不上的功能买单。\n\n基础档（2000-5000 元）：智能网关、小爱音箱、几个智能开关和门窗/人体传感器，实现基础灯光控制和安防提醒。\n\n舒适档（8000-20000 元）：在基础档上加智能门锁、摄像头、窗帘电机、空调伴侣，实现回家自动开灯、窗帘自动开合等场景。\n\n高配档（20000 元以上）：全屋传感器、中控屏、智能浴霸、晾衣架、扫地机器人、空气净化等，追求无感智能体验。\n\n原则：先选生态，再装网关，最后逐房间配设备；装修前预留零线能省下不少麻烦。'},
  {id:'a6', title:'智能门锁选购指南', cover:'🔐', summary:'C级锁芯、识别方式、续航，买智能门锁前必看的三件事。', content:'智能门锁的安全性，首先看锁芯等级：主流品牌全系采用直插式 C 级锁芯，这是底线。\n\n识别方式上，指纹识别最常用，识别速度 0.5 秒左右；老人小孩指纹磨损可选人脸识别或掌静脉识别；基础款价格更低，中高端功能更全。\n\n续航方面，多数型号用 5000mAh 锂电池，续航 4-5 个月，没电时可用 Type-C 应急供电，不用担心被锁门外。\n\n安装一般免费送装一体，保修期多为 3 年，下单前确认是否支持自家门型。'},
];

function hashPassword(password, salt) { return crypto.scryptSync(password, salt, 64).toString('hex'); }
function genSalt() { return crypto.randomBytes(16).toString('hex'); }
function genToken() { return crypto.randomBytes(32).toString('hex'); }
function genId() { return Date.now().toString(36) + crypto.randomBytes(4).toString('hex'); }

const NICK_RE = /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initDB() {
  const adminSalt = genSalt();
  const admin = { id:'admin', email:'admin@admin.com', passwordHash:hashPassword('admin123', adminSalt), salt:adminSalt, nickname:'超级管理员', role:'admin', status:'active', createdAt:new Date().toISOString() };
  const db = {
    users:[admin],
    products:SEED_PRODUCTS.map(p=>({...p,status:'on',createdAt:new Date().toISOString()})),
    brands:SEED_BRANDS,
    ecos:SEED_ECOS,
    rooms:SEED_ROOMS,
    plans:SEED_PLANS,
    userPlans:[],
    articles:SEED_ARTICLES,
    tokens:{},
    selections:{}
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  return db;
}
function load() {
  try {
    const d = JSON.parse(fs.readFileSync(DB_PATH,'utf8'));
    if (!d.userPlans) d.userPlans = [];
    if (!d.brands) d.brands = SEED_BRANDS;
    if (!d.ecos) d.ecos = SEED_ECOS;
    if (!d.rooms) d.rooms = SEED_ROOMS;
    if (!d.plans) d.plans = SEED_PLANS;
    if (!d.articles) d.articles = SEED_ARTICLES;
    if (!d.selections) d.selections = {};
    // 迁移旧格式 selections: {room: [id]} -> {room: {id: count}}
    Object.keys(d.selections).forEach(uid => {
      const rm = d.selections[uid];
      Object.keys(rm).forEach(room => {
        if (Array.isArray(rm[room])) {
          const obj = {};
          rm[room].forEach(id => { obj[id] = 1; });
          rm[room] = obj;
        }
      });
    });
    return d;
  } catch { return initDB(); }
}
let db = load();
function save() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function json(res, code, obj) {
  res.writeHead(code, {'Content-Type':'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, Authorization', 'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'});
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) reject(new Error('body too large')); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on('error', reject);
  });
}
function getAuthUser(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const userId = db.tokens[token];
  if (!userId) return null;
  return db.users.find(u => u.id === userId) || null;
}
function publicUser(u) {
  return { id:u.id, email:u.email, nickname:u.nickname, role:u.role, status:u.status, createdAt:u.createdAt };
}

async function handleAPI(req, res, pathname, method) {
  if (method === 'POST' && pathname === '/api/check-email') {
    const { email } = await readBody(req);
    if (!email || !EMAIL_RE.test(email)) return json(res, 200, {exists:false});
    return json(res, 200, {exists: db.users.some(u => u.email === email)});
  }

  if (method === 'POST' && pathname === '/api/register') {
    const { email, password, nickname } = await readBody(req);
    if (!email || !password) return json(res, 400, {error:'邮箱和密码不能为空'});
    if (!EMAIL_RE.test(email)) return json(res, 400, {error:'邮箱格式不正确'});
    if (password.length < 6) return json(res, 400, {error:'密码至少6位'});
    if (db.users.some(u => u.email === email)) return json(res, 409, {error:'该邮箱已注册'});
    const nick = (nickname||'').trim() || email.split('@')[0];
    if (!NICK_RE.test(nick)) return json(res, 400, {error:'昵称需 2-16 位，仅支持中英文、数字、下划线'});
    const salt = genSalt();
    const user = { id:genId(), email, passwordHash:hashPassword(password, salt), salt, nickname:nick, role:'user', status:'active', createdAt:new Date().toISOString() };
    db.users.push(user); save();
    const token = genToken(); db.tokens[token] = user.id; save();
    return json(res, 200, {token, user:publicUser(user)});
  }

  if (method === 'POST' && pathname === '/api/login') {
    const { email, password } = await readBody(req);
    const user = db.users.find(u => u.email === email);
    if (!user || hashPassword(password||'', user.salt) !== user.passwordHash) return json(res, 401, {error:'邮箱或密码错误'});
    if (user.status !== 'active') return json(res, 403, {error:'账号已被停用，请联系管理员'});
    const token = genToken(); db.tokens[token] = user.id; save();
    return json(res, 200, {token, user:publicUser(user)});
  }

  if (method === 'POST' && pathname === '/api/forgot-password') {
    const { email } = await readBody(req);
    if (!email || !EMAIL_RE.test(email)) return json(res, 400, {error:'请输入正确的邮箱'});
    const user = db.users.find(u => u.email === email);
    if (!user) return json(res, 404, {error:'该邮箱未注册'});
    if (user.role === 'admin') return json(res, 403, {error:'管理员账号不支持此方式重置'});
    user.salt = genSalt();
    user.passwordHash = hashPassword('000000', user.salt);
    Object.keys(db.tokens).forEach(t => { if (db.tokens[t] === user.id) delete db.tokens[t]; });
    save();
    return json(res, 200, {ok:true, message:'密码已重置为 000000，请使用新密码登录'});
  }

  if (method === 'POST' && pathname === '/api/admin/login') {
    const { email, password } = await readBody(req);
    const user = db.users.find(u => u.email === email);
    if (!user || user.role !== 'admin' || hashPassword(password||'', user.salt) !== user.passwordHash) return json(res, 401, {error:'管理员账号或密码错误'});
    const token = genToken(); db.tokens[token] = user.id; save();
    return json(res, 200, {token, user:publicUser(user)});
  }

  if (method === 'GET' && pathname === '/api/products') return json(res, 200, {products: db.products});
  if (method === 'GET' && pathname === '/api/brands') return json(res, 200, {brands: db.brands});
  if (method === 'GET' && pathname === '/api/ecos') return json(res, 200, {ecos: db.ecos});
  if (method === 'GET' && pathname === '/api/rooms') return json(res, 200, {rooms: db.rooms.map(r => ({...r, count: db.products.filter(p=>p.room===r.key).length}))});
  if (method === 'GET' && pathname === '/api/plans') {
    const plans = db.plans.map(p => ({ id:p.id, name:p.name, desc:p.desc, icon:p.icon, products:(p.products||[]).map(pid=>db.products.find(x=>x.id===pid)).filter(Boolean) }));
    return json(res, 200, {plans});
  }
  if (method === 'GET' && pathname === '/api/articles') return json(res, 200, {articles: db.articles});

  const user = getAuthUser(req);
  if (!user) return json(res, 401, {error:'未登录或登录已过期'});

  if (method === 'GET' && pathname === '/api/me') return json(res, 200, {user:publicUser(user)});
  if (method === 'GET' && pathname === '/api/selections') return json(res, 200, {selections: db.selections[user.id] || {}});
  if (method === 'POST' && pathname === '/api/selections') {
    const { room_key, items } = await readBody(req);
    if (!room_key || typeof items !== 'object' || items === null) return json(res, 400, {error:'参数不完整'});
    if (!db.selections[user.id]) db.selections[user.id] = {};
    db.selections[user.id][room_key] = items;
    save();
    return json(res, 200, {ok:true});
  }

  if (method === 'GET' && pathname === '/api/user-plans') {
    const plans = db.userPlans.filter(p => p.userId === user.id).map(p => ({ id:p.id, name:p.name, desc:p.desc, icon:p.icon, createdAt:p.createdAt, products:(p.products||[]).map(pid=>db.products.find(x=>x.id===pid)).filter(Boolean) })).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
    return json(res, 200, {plans});
  }
  if (method === 'POST' && pathname === '/api/user-plans') {
    const b = await readBody(req);
    if (!b.name) return json(res, 400, {error:'方案名称必填'});
    const plan = { id:genId(), userId:user.id, name:b.name, desc:b.desc||'', icon:b.icon||'📋', products:Array.isArray(b.products)?b.products:[], createdAt:new Date().toISOString() };
    db.userPlans.push(plan); save();
    return json(res, 200, {ok:true, plan});
  }
  if (method === 'PUT' && pathname.startsWith('/api/user-plans/')) {
    const pid = pathname.split('/api/user-plans/')[1];
    const p = db.userPlans.find(x => x.id === pid && x.userId === user.id);
    if (!p) return json(res, 404, {error:'方案不存在'});
    const b = await readBody(req);
    if (b.name !== undefined) p.name = b.name;
    if (b.desc !== undefined) p.desc = b.desc;
    if (b.icon !== undefined) p.icon = b.icon;
    if (b.products !== undefined) p.products = b.products;
    save(); return json(res, 200, {ok:true});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/user-plans/')) {
    const pid = pathname.split('/api/user-plans/')[1];
    db.userPlans = db.userPlans.filter(x => !(x.id === pid && x.userId === user.id));
    save(); return json(res, 200, {ok:true});
  }

  // ---- 房间管理（登录用户即可） ----
  if (method === 'POST' && pathname === '/api/rooms') {
    const b = await readBody(req);
    const name = (b.name||'').trim();
    if (!name) return json(res, 400, {error:'房间名称不能为空'});
    const key = 'room_' + genId();
    db.rooms.push({key, name, icon: b.icon || '🏠'}); save(); return json(res, 200, {ok:true});
  }
  if (method === 'PUT' && pathname.startsWith('/api/rooms/')) {
    const key = decodeURIComponent(pathname.split('/api/rooms/')[1]);
    const r = db.rooms.find(x => x.key === key);
    if (!r) return json(res, 404, {error:'房间不存在'});
    const b = await readBody(req);
    if (b.name !== undefined) r.name = b.name;
    if (b.icon !== undefined) r.icon = b.icon;
    save(); return json(res, 200, {ok:true});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/rooms/')) {
    const key = decodeURIComponent(pathname.split('/api/rooms/')[1]);
    const used = db.products.filter(p => p.room === key).length;
    if (used > 0) return json(res, 400, {error:`该房间下还有 ${used} 个商品，无法删除`});
    db.rooms = db.rooms.filter(r => r.key !== key); save(); return json(res, 200, {ok:true});
  }

  if (user.role !== 'admin') return json(res, 403, {error:'无权限'});

  if (method === 'GET' && pathname === '/api/admin/stats') {
    const activeUsers = db.users.filter(u => u.role !== 'admin' && u.status === 'active').length;
    const disabledUsers = db.users.filter(u => u.role !== 'admin' && u.status === 'disabled').length;
    const onProducts = db.products.filter(p => p.status === 'on').length;
    let totalSelections = 0;
    Object.values(db.selections).forEach(rm => { Object.values(rm).forEach(items => { Object.values(items).forEach(c => totalSelections += c); }); });
    return json(res, 200, { stats: {
      totalUsers: db.users.filter(u => u.role !== 'admin').length, activeUsers, disabledUsers,
      totalProducts: db.products.length, onProducts, offProducts: db.products.filter(p => p.status !== 'on').length,
      brandCount: db.brands.length, ecoCount: db.ecos.length, roomCount: db.rooms.length, planCount: db.plans.length, articleCount: db.articles.length,
      totalSelections,
      recentUsers: db.users.filter(u=>u.role!=='admin').sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(publicUser)
    }});
  }

  if (method === 'GET' && pathname === '/api/admin/users') {
    const list = db.users.filter(u => u.role !== 'admin').sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(u => ({...publicUser(u), selectionCount: Object.values(db.selections[u.id]||{}).reduce((s,items)=>s+Object.values(items).reduce((x,c)=>x+c,0),0)}));
    return json(res, 200, {users: list});
  }
  const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/(\w+)$/);
  if (userMatch && method === 'POST') {
    const [, targetId, action] = userMatch;
    const target = db.users.find(u => u.id === targetId);
    if (!target) return json(res, 404, {error:'用户不存在'});
    const body = await readBody(req);
    if (action === 'disable') { target.status = 'disabled'; save(); return json(res, 200, {ok:true}); }
    if (action === 'enable') { target.status = 'active'; save(); return json(res, 200, {ok:true}); }
    if (action === 'reset-password') { const np = body.newPassword || '123456'; if (np.length < 6) return json(res, 400, {error:'密码至少6位'}); target.salt = genSalt(); target.passwordHash = hashPassword(np, target.salt); Object.keys(db.tokens).forEach(t => { if (db.tokens[t] === target.id) delete db.tokens[t]; }); save(); return json(res, 200, {ok:true}); }
    if (action === 'change-password') { const np = body.newPassword; if (!np || np.length < 6) return json(res, 400, {error:'新密码至少6位'}); target.salt = genSalt(); target.passwordHash = hashPassword(np, target.salt); Object.keys(db.tokens).forEach(t => { if (db.tokens[t] === target.id) delete db.tokens[t]; }); save(); return json(res, 200, {ok:true}); }
    return json(res, 404, {error:'未知操作'});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/admin/users/')) {
    const targetId = pathname.split('/').pop();
    db.users = db.users.filter(u => u.id !== targetId);
    delete db.selections[targetId];
    db.userPlans = db.userPlans.filter(p => p.userId !== targetId);
    Object.keys(db.tokens).forEach(t => { if (db.tokens[t] === targetId) delete db.tokens[t]; });
    save(); return json(res, 200, {ok:true});
  }

  if (method === 'GET' && pathname === '/api/admin/products') return json(res, 200, {products: db.products});
  if (method === 'POST' && pathname === '/api/admin/products') {
    const b = await readBody(req);
    if (!b.name || !b.room || b.price == null) return json(res, 400, {error:'商品名称、所属房间、价格必填'});
    const product = { id:genId(), room:b.room, name:b.name, brand:b.brand||'自营', eco:b.eco||db.ecos[0]||'', desc:b.desc||'', price:Number(b.price)||0, icon:b.icon||'📦', tag:b.tag||'', status:b.status||'on', createdAt:new Date().toISOString() };
    db.products.push(product); save();
    return json(res, 200, {ok:true, product});
  }
  const productMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)(\/(\w+))?$/);
  if (productMatch && method === 'PUT') {
    const [, pid] = productMatch;
    const p = db.products.find(x => x.id === pid);
    if (!p) return json(res, 404, {error:'商品不存在'});
    const b = await readBody(req);
    if (b.name !== undefined) p.name = b.name;
    if (b.room !== undefined) p.room = b.room;
    if (b.brand !== undefined) p.brand = b.brand;
    if (b.eco !== undefined) p.eco = b.eco;
    if (b.desc !== undefined) p.desc = b.desc;
    if (b.price !== undefined) p.price = Number(b.price)||0;
    if (b.icon !== undefined) p.icon = b.icon;
    if (b.tag !== undefined) p.tag = b.tag;
    save(); return json(res, 200, {ok:true, product:p});
  }
  if (productMatch && method === 'POST') {
    const [, pid, , action] = productMatch;
    const p = db.products.find(x => x.id === pid);
    if (!p) return json(res, 404, {error:'商品不存在'});
    if (action === 'toggle') { p.status = p.status === 'on' ? 'off' : 'on'; save(); return json(res, 200, {ok:true, product:p}); }
    return json(res, 404, {error:'未知操作'});
  }
  if (productMatch && method === 'DELETE') {
    const [, pid] = productMatch;
    db.products = db.products.filter(x => x.id !== pid);
    save(); return json(res, 200, {ok:true});
  }

  if (method === 'GET' && pathname === '/api/admin/brands') {
    return json(res, 200, {brands: db.brands.map(name => ({name, count: db.products.filter(p=>p.brand===name).length}))});
  }
  if (method === 'POST' && pathname === '/api/admin/brands') {
    const b = await readBody(req); const name = (b.name||'').trim();
    if (!name) return json(res, 400, {error:'品牌名不能为空'});
    if (db.brands.includes(name)) return json(res, 409, {error:'品牌已存在'});
    db.brands.push(name); save(); return json(res, 200, {ok:true});
  }
  if (method === 'PUT' && pathname.startsWith('/api/admin/brands/')) {
    const oldName = decodeURIComponent(pathname.split('/api/admin/brands/')[1]);
    const b = await readBody(req); const newName = (b.name||'').trim();
    if (!newName) return json(res, 400, {error:'品牌名不能为空'});
    if (!db.brands.includes(oldName)) return json(res, 404, {error:'品牌不存在'});
    if (oldName !== newName && db.brands.includes(newName)) return json(res, 409, {error:'新品牌名已存在'});
    db.brands[db.brands.indexOf(oldName)] = newName;
    db.products.forEach(p => { if (p.brand === oldName) p.brand = newName; });
    save(); return json(res, 200, {ok:true});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/admin/brands/')) {
    const name = decodeURIComponent(pathname.split('/api/admin/brands/')[1]);
    const used = db.products.filter(p => p.brand === name).length;
    if (used > 0) return json(res, 400, {error:`该品牌下还有 ${used} 个商品，无法删除`});
    db.brands = db.brands.filter(b => b !== name); save(); return json(res, 200, {ok:true});
  }

  if (method === 'GET' && pathname === '/api/admin/ecos') {
    return json(res, 200, {ecos: db.ecos.map(name => ({name, count: db.products.filter(p=>p.eco===name).length}))});
  }
  if (method === 'POST' && pathname === '/api/admin/ecos') {
    const b = await readBody(req); const name = (b.name||'').trim();
    if (!name) return json(res, 400, {error:'生态名称不能为空'});
    if (db.ecos.includes(name)) return json(res, 409, {error:'生态已存在'});
    db.ecos.push(name); save(); return json(res, 200, {ok:true});
  }
  if (method === 'PUT' && pathname.startsWith('/api/admin/ecos/')) {
    const oldName = decodeURIComponent(pathname.split('/api/admin/ecos/')[1]);
    const b = await readBody(req); const newName = (b.name||'').trim();
    if (!newName) return json(res, 400, {error:'生态名称不能为空'});
    if (!db.ecos.includes(oldName)) return json(res, 404, {error:'生态不存在'});
    if (oldName !== newName && db.ecos.includes(newName)) return json(res, 409, {error:'新生态名已存在'});
    db.ecos[db.ecos.indexOf(oldName)] = newName;
    db.products.forEach(p => { if (p.eco === oldName) p.eco = newName; });
    save(); return json(res, 200, {ok:true});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/admin/ecos/')) {
    const name = decodeURIComponent(pathname.split('/api/admin/ecos/')[1]);
    const used = db.products.filter(p => p.eco === name).length;
    if (used > 0) return json(res, 400, {error:`该生态下还有 ${used} 个商品，无法删除`});
    db.ecos = db.ecos.filter(b => b !== name); save(); return json(res, 200, {ok:true});
  }

  if (method === 'GET' && pathname === '/api/admin/plans') {
    const plans = db.plans.map(p => ({ id:p.id, name:p.name, desc:p.desc, icon:p.icon, products:(p.products||[]).map(pid=>db.products.find(x=>x.id===pid)).filter(Boolean) }));
    return json(res, 200, {plans});
  }
  if (method === 'POST' && pathname === '/api/admin/plans') {
    const b = await readBody(req);
    if (!b.name) return json(res, 400, {error:'方案名称必填'});
    const plan = { id:genId(), name:b.name, desc:b.desc||'', icon:b.icon||'📋', products:Array.isArray(b.products)?b.products:[] };
    db.plans.push(plan); save(); return json(res, 200, {ok:true, plan});
  }
  if (method === 'PUT' && pathname.startsWith('/api/admin/plans/')) {
    const pid = pathname.split('/api/admin/plans/')[1];
    const p = db.plans.find(x => x.id === pid);
    if (!p) return json(res, 404, {error:'方案不存在'});
    const b = await readBody(req);
    if (b.name !== undefined) p.name = b.name;
    if (b.desc !== undefined) p.desc = b.desc;
    if (b.icon !== undefined) p.icon = b.icon;
    if (b.products !== undefined) p.products = b.products;
    save(); return json(res, 200, {ok:true});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/admin/plans/')) {
    const pid = pathname.split('/api/admin/plans/')[1];
    db.plans = db.plans.filter(x => x.id !== pid);
    save(); return json(res, 200, {ok:true});
  }

  if (method === 'GET' && pathname === '/api/admin/articles') return json(res, 200, {articles: db.articles});
  if (method === 'POST' && pathname === '/api/admin/articles') {
    const b = await readBody(req);
    if (!b.title) return json(res, 400, {error:'标题必填'});
    const article = { id:genId(), title:b.title, cover:b.cover||'📄', summary:b.summary||'', content:b.content||'', createdAt:new Date().toISOString() };
    db.articles.unshift(article); save(); return json(res, 200, {ok:true, article});
  }
  if (method === 'PUT' && pathname.startsWith('/api/admin/articles/')) {
    const aid = pathname.split('/api/admin/articles/')[1];
    const a = db.articles.find(x => x.id === aid);
    if (!a) return json(res, 404, {error:'文章不存在'});
    const b = await readBody(req);
    if (b.title !== undefined) a.title = b.title;
    if (b.cover !== undefined) a.cover = b.cover;
    if (b.summary !== undefined) a.summary = b.summary;
    if (b.content !== undefined) a.content = b.content;
    save(); return json(res, 200, {ok:true});
  }
  if (method === 'DELETE' && pathname.startsWith('/api/admin/articles/')) {
    const aid = pathname.split('/api/admin/articles/')[1];
    db.articles = db.articles.filter(x => x.id !== aid);
    save(); return json(res, 200, {ok:true});
  }

  return json(res, 404, {error:'接口不存在'});
}

const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(PUBLIC_DIR, filePath);
  if (!fullPath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(fullPath, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'}); return res.end('<h1>404 Not Found</h1>'); }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'}); return res.end(); }
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  if (pathname.startsWith('/api/')) {
    try { await handleAPI(req, res, pathname, req.method); }
    catch (e) { json(res, 500, {error:'服务器错误: ' + e.message}); }
  } else {
    serveStatic(req, res, pathname);
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  全屋智能选品服务已启动  http://localhost:' + PORT);
  console.log('  管理员: admin@admin.com / admin123');
  console.log('');
});
