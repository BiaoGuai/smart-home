-- =============================================================
-- 全屋智能选品 · Supabase 建表 + 初始数据
-- 用法：在 Supabase Dashboard → SQL Editor 里整段粘贴执行一次
-- =============================================================

-- ---------- 建表 ----------
create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  salt text not null,
  nickname text not null,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  room text not null,
  name text not null,
  brand text default '自营',
  eco text default '',
  "desc" text default '',
  price numeric default 0,
  icon text default '📦',
  tag text default '',
  status text default 'on',
  created_at timestamptz not null default now()
);

create table if not exists brands (
  name text primary key,
  position serial
);

create table if not exists ecos (
  name text primary key,
  position serial
);

create table if not exists rooms (
  key text primary key,
  name text,
  icon text
);

create table if not exists plans (
  id text primary key,
  name text not null,
  "desc" text default '',
  icon text default '📋',
  products jsonb default '[]'
);

create table if not exists user_plans (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  "desc" text default '',
  icon text default '📋',
  products jsonb default '[]',
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id text primary key,
  title text not null,
  cover text default '📄',
  summary text default '',
  content text default '',
  created_at timestamptz not null default now()
);

create table if not exists tokens (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists selections (
  user_id text not null references users(id) on delete cascade,
  room_key text not null,
  items jsonb default '{}',
  primary key (user_id, room_key)
);

create index if not exists idx_products_room on products(room);
create index if not exists idx_user_plans_user on user_plans(user_id);
create index if not exists idx_tokens_user on tokens(user_id);

-- ---------- 初始数据 ----------

-- 管理员账号：admin@admin.com / admin123
insert into users (id, email, password_hash, salt, nickname, role, status) values
('admin', 'admin@admin.com', '5a35dc5288571d68ce35c2d3bdf6c67e42c2cbe3a431fb92944a7b04e31e21f6b4288564a6d72bc2e59161f2c0a80f4d3220dd2c2666cb03a188604f5523424f', '45aeef7df4abdc3c256d843a019f275f', '超级管理员', 'admin', 'active')
on conflict (id) do nothing;

-- 品牌
insert into brands (name) values
('小米'),('米家'),('Yeelight易来'),('萤石'),('石头')
on conflict (name) do nothing;

-- 生态
insert into ecos (name) values
('米家生态'),('华为生态'),('天猫精灵'),('Apple HomeKit')
on conflict (name) do nothing;

-- 房间
insert into rooms (key, name, icon) values
('living','客厅','🛋️'),('bedroom','主卧','🛏️'),('second_bedroom','次卧','🛌'),
('kitchen','厨房','🍳'),('bathroom','卫生间','🚿'),('balcony','阳台','🌿'),
('study','书房','📚'),('entrance','玄关','🚪')
on conflict (key) do nothing;

-- 商品（50 款，京东自营真实商品）
insert into products (id, room, name, brand, eco, "desc", price, icon, tag, status) values
('l1','living','智能开关Pro 双开 Mesh2.0','小米','米家生态','单火/零火兼容，电量统计，接入米家',132,'💡','热卖','on'),
('l2','living','灵犀4.0 全光谱吸顶灯 C400','Yeelight易来','米家生态','48W全光谱护眼，客厅卧室通用',304,'💡','推荐','on'),
('l3','living','智能窗帘2（电机+3米轨道）','米家','米家生态','语音/远程/定时，承重60kg静音',765,'🪟','推荐','on'),
('l4','living','C6c 500万云台摄像头','萤石','米家生态','AI人形宠物检测，360°云台',209,'📷','新品','on'),
('l5','living','小爱音箱 Pro','小米','米家生态','红外遥控传统家电，蓝牙Mesh网关',269,'🔊','热卖','on'),
('l6','living','空调伴侣2','米家','米家生态','传统空调变智能，睡后调温+电量统计',79,'🌡️','','on'),
('l7','living','人在传感器（毫米波雷达）','小米','米家生态','静态人体感知，130°广角，3年续航',99,'📡','','on'),
('l8','living','中枢网关','小米','米家生态','断网本地联动，多设备稳定不卡顿',349,'🌐','','on'),
('b1','bedroom','灵犀4.0 全光谱吸顶灯 C400','Yeelight易来','米家生态','48W全光谱护眼，无极调光调色',304,'💡','推荐','on'),
('b2','bedroom','智能窗帘2（电机+轨道）','米家','米家生态','静音电机，晨起自动拉开',765,'🪟','热卖','on'),
('b3','bedroom','智能开关（零火版）','小米','米家生态','替换传统开关，床头双控',119,'🔘','','on'),
('b4','bedroom','空调伴侣2','米家','米家生态','睡眠曲线自动调温，电量统计',79,'🌡️','','on'),
('b5','bedroom','床头灯2','米家','米家生态','1600万色，2700-6500K，通体柔光',179,'🛋️','新品','on'),
('b6','bedroom','门窗传感器2','小米','米家生态','WiFi+蓝牙双模直连，光照判断',49,'🔔','','on'),
('b7','bedroom','人体传感器2S','小米','米家生态','高灵敏度，升级光照传感器，3年续航',69,'📡','','on'),
('s1','second_bedroom','灵犀4.0 全光谱吸顶灯 C400','Yeelight易来','米家生态','全光谱护眼，冷暖双色',304,'💡','','on'),
('s2','second_bedroom','智能窗帘2（电机+轨道）','米家','米家生态','静音电机，定时开合',765,'🪟','','on'),
('s3','second_bedroom','智能开关（零火版）','小米','米家生态','Zigbee稳定可靠，场景联动',119,'🔘','','on'),
('s4','second_bedroom','空调伴侣2','米家','米家生态','远程开关空调，节能省电',79,'🌡️','','on'),
('s5','second_bedroom','门窗传感器2','小米','米家生态','开合状态实时通知',49,'🔔','','on'),
('k1','kitchen','智能天然气卫士','小米','米家生态','霍尼韦尔联合，70dB声光报警+远程推送',179,'⚠️','必装','on'),
('k2','kitchen','烟感卫士2','小米','米家生态','火灾烟雾报警，远程提醒，智能联动',148,'🔥','必装','on'),
('k3','kitchen','智能开关（零火版）','小米','米家生态','控制厨房主灯和辅助灯',119,'🔘','','on'),
('k4','kitchen','智能插座3','米家','米家生态','远程断电，定时关闭电器',59,'🔌','','on'),
('k5','kitchen','温湿度计2','米家','米家生态','联动空调/加湿器，自动调节',30,'🌡️','','on'),
('br1','bathroom','智能浴霸（2400W）','米家','米家生态','取暖/换气/照明一体，语音控温',402,'♨️','推荐','on'),
('br2','bathroom','人在传感器（毫米波雷达）','小米','米家生态','人来自动亮灯，人走延时关',99,'📡','','on'),
('br3','bathroom','智能开关（零火版）','小米','米家生态','防水面板，浴霸/灯独立控制',119,'🔘','','on'),
('br4','bathroom','门窗传感器2','小米','米家生态','卫生间门开合监测',49,'🔔','','on'),
('bl1','balcony','智能晾衣机2','米家','米家生态','超薄隐形，94个晾晒位，遥控升降',881,'👕','推荐','on'),
('bl2','balcony','智能窗帘2（电机+轨道）','米家','米家生态','遮阳帘自动开合，防晒节能',765,'🪟','','on'),
('bl3','balcony','门窗传感器2','小米','米家生态','阳台门开合监测',49,'🔔','','on'),
('bl4','balcony','智能插座3','米家','米家生态','定时控制阳台电器',59,'🔌','','on'),
('st1','study','台灯2 Lite','米家','米家生态','Ra90高显色，三轴灵活布光',71,'💡','推荐','on'),
('st2','study','台灯2（60cm长灯头）','米家','米家生态','前向投光，R9达90，减少眩光',199,'🪫','','on'),
('st3','study','灵犀4.0 全光谱吸顶灯 C400','Yeelight易来','米家生态','全光谱护眼，阅读模式',304,'💡','','on'),
('st4','study','空调伴侣2','米家','米家生态','恒温工作环境',79,'🌡️','','on'),
('st5','study','智能插座3','米家','米家生态','电脑/打印机用电管理',59,'🔌','','on'),
('e1','entrance','智能门锁2','小米','米家生态','指纹/密码/NFC，C级锁芯，自动上锁',999,'🔐','推荐','on'),
('e2','entrance','智能门锁 E30','小米','米家生态','3.5寸彩屏，9种开锁，AI猫眼',799,'🔔','热卖','on'),
('e3','entrance','门窗传感器2','小米','米家生态','大门开合监测',49,'🔔','','on'),
('e4','entrance','人在传感器（毫米波雷达）','小米','米家生态','人来亮灯，延时关闭',99,'📡','','on'),
('e5','entrance','智能开关（单开）','小米','米家生态','玄关灯智能控制',69,'🔘','','on'),
('l9','living','P20 Max 扫拖机器人','石头','米家生态','0缠绕系统，升降底盘，扫拖一体',3599,'🤖','热卖','on'),
('l10','living','净化加湿器3 Pro','米家','米家生态','2000mL/h加湿+422m³/h净化一体',1999,'💨','推荐','on'),
('l11','living','智能氛围灯带','米家','米家生态','1600万色，音乐律动，App控制',159,'🎨','新品','on'),
('b8','bedroom','无雾加湿器3','米家','米家生态','600mL/h，银离子抗菌，静音运行',399,'💧','','on'),
('b9','bedroom','智能香薰机','米家','米家生态','App控制出香，定时关闭',229,'🌸','','on'),
('e6','entrance','智能门铃4','小米','米家生态','300万双摄，2K画质，移动侦测',279,'🔔','热卖','on'),
('e7','entrance','智能猫眼2','小米','米家生态','可视对讲，远程监控，红外夜视',569,'👁️','','on')
on conflict (id) do nothing;

-- 官方方案
insert into plans (id, name, "desc", icon, products) values
('plan_a','A方案 · 经济实用','核心空间基础智能，性价比之选','💰','["l2","l1","b1","b3","k1","e1"]'),
('plan_b','B方案 · 智能安防','全屋安全防护，居家更安心','🛡️','["e1","l4","k1","k2","e3","b6"]'),
('plan_c','C方案 · 全屋豪华','八大空间全覆盖，一步到位','👑','["l2","l3","l4","l5","b1","b2","k1","br1","bl1","e1","e2"]'),
('plan_d','D方案 · 懒人清洁','扫地机器人+净化，解放双手','🤖','["l9","l10","st5","k4"]'),
('plan_e','E方案 · 健康空气','净化加湿香薰，呼吸更安心','💨','["l10","b8","b9","k5"]'),
('plan_f','F方案 · 智能卫浴','浴霸+感应，卫生间智能化','♨️','["br1","br2","br3","br4"]')
on conflict (id) do nothing;

-- 科普文章
insert into articles (id, title, cover, summary, content) values
('a1','什么是全屋智能？入门必读','🏠','从零开始了解全屋智能的核心概念、设备分类与搭建顺序，避免踩坑。','全屋智能，是指通过统一平台把家中的灯光、窗帘、门锁、安防传感器、家电等设备接入网络，实现远程控制、语音控制与场景联动。\n\n一套完整的全屋智能通常包含四类设备：控制类（智能开关、网关）、安防类（门锁、摄像头、燃气/烟感传感器）、舒适类（窗帘电机、空调伴侣、浴霸）和环境类（温湿度计、人在传感器）。\n\n搭建顺序建议：先选生态（米家、华为、HomeKit 等），再装网关，最后逐房间配设备。装修前预留零线，能大幅提升智能开关的稳定性。'),
('a2','智能开关选单火还是零火？','🔘','装修前一定要看：单火版和零火版的区别，选错了会很麻烦。','智能开关分单火版和零火版，核心区别在于安装时是否需要零线。\n\n零火版需要底盒里有零线，运行更稳定、不会出现"鬼火"（灯具微亮），支持功率也更大，是装修时首推的方案。\n\n单火版无需零线，适合老房改造或已装修完、底盒没零线的情况。它的缺点是部分小功率灯具可能出现微亮或闪烁。\n\n结论：正在装修、能预留零线，选零火版；已装修没零线，才选单火版。'),
('a3','家庭安防：燃气和烟感传感器','⚠️','为什么燃气泄漏报警器和烟雾报警器，是每家每户都应该装的安防设备。','燃气泄漏和火灾是家庭最常见的安全隐患。智能燃气卫士能探测天然气泄漏，发出 70 分贝以上的声光报警，并推送手机通知，部分还支持联动电磁阀自动切断气源。\n\n烟雾报警器（烟感）采用光电式探测，火灾初期就能报警，配合高分贝本地报警和远程提醒，为逃生争取时间。\n\n这两类设备价格都不高，一两百元就能买到正规品牌，却能在关键时刻救命，建议厨房各装一个。'),
('a4','扫地机器人怎么选？','🤖','吸力、导航、自清洁三大核心，一文看懂扫地机器人选购要点。','选购扫地机器人，重点看三件事：吸力、导航避障和自清洁能力。\n\n吸力决定清洁力度，日常家庭 4000Pa 以上就够用，有宠物或地毯可选更高吸力机型。导航决定它会不会撞墙、会不会被电线卡住，优先选激光导航或 AI 视觉避障。\n\n自清洁是近两年的分水岭：带自动集尘、自动洗拖布、自动上下水的高端机型，几乎不用手动清理；预算有限选基础款，但需手动清理尘盒和拖布。\n\n预算建议：2000 元内选性价比机型，3000-5000 元选带自清洁的中高端，一步到位。'),
('a5','全屋智能预算怎么规划','💰','从几千到几万，三档预算教你合理分配智能家居投入。','全屋智能的花费跨度很大，关键在于明确需求，避免为用不上的功能买单。\n\n基础档（2000-5000 元）：智能网关、小爱音箱、几个智能开关和门窗/人体传感器，实现基础灯光控制和安防提醒。\n\n舒适档（8000-20000 元）：在基础档上加智能门锁、摄像头、窗帘电机、空调伴侣，实现回家自动开灯、窗帘自动开合等场景。\n\n高配档（20000 元以上）：全屋传感器、中控屏、智能浴霸、晾衣架、扫地机器人、空气净化等，追求无感智能体验。\n\n原则：先选生态，再装网关，最后逐房间配设备；装修前预留零线能省下不少麻烦。'),
('a6','智能门锁选购指南','🔐','C级锁芯、识别方式、续航，买智能门锁前必看的三件事。','智能门锁的安全性，首先看锁芯等级：主流品牌全系采用直插式 C 级锁芯，这是底线。\n\n识别方式上，指纹识别最常用，识别速度 0.5 秒左右；老人小孩指纹磨损可选人脸识别或掌静脉识别；基础款价格更低，中高端功能更全。\n\n续航方面，多数型号用 5000mAh 锂电池，续航 4-5 个月，没电时可用 Type-C 应急供电，不用担心被锁门外。\n\n安装一般免费送装一体，保修期多为 3 年，下单前确认是否支持自家门型。')
on conflict (id) do nothing;

-- 完成
select 'schema + seed 已初始化完成' as status;
