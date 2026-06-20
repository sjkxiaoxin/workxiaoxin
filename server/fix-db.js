// 修复数据库表结构脚本
// 用法: node fix-db.js
// 在 server 目录下运行

const { Client } = require('pg');

// 尝试多种连接格式
const CONNECTION_STRINGS = [
  // 格式1: 直接连接 (需要 db. 前缀)
  'postgresql://postgres:Sjk193384332.@db.cxlslzuhrvfdwxnsovir.supabase.co:5432/postgres',
  // 格式2: 旧格式 (不带 db.)
  'postgresql://postgres:Sjk193384332.@cxlslzuhrvfdwxnsovir.supabase.co:5432/postgres',
];

const FIX_SQL = [
  ['添加 deadline 字段', 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE'],
  ['添加 is_urgent 字段', 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false'],
  ['迁移 due_date 数据', 'UPDATE tasks SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL'],
  ['创建 task_history 表', `CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user_id TEXT REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`],
];

async function tryConnect(connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  return client;
}

async function runFixes(client) {
  for (const [label, sql] of FIX_SQL) {
    console.log(`${label}...`);
    await client.query(sql);
    console.log('   ✅ 完成');
  }

  // 验证
  console.log('\n--- 验证 tasks 表字段 ---');
  const res = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position"
  );
  res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  console.log('\n✅ 数据库修复完成!');
}

async function main() {
  let client = null;

  for (let i = 0; i < CONNECTION_STRINGS.length; i++) {
    const connStr = CONNECTION_STRINGS[i];
    const label = i === 0 ? '直接连接 (db.前缀)' : '旧格式 (无db.)';
    console.log(`\n尝试方式${i + 1}: ${label}`);
    console.log(`  ${connStr.replace(/Sjk[^@]+/, '****')}`);

    try {
      client = await tryConnect(connStr);
      console.log('✅ 连接成功!\n');
      break;
    } catch (err) {
      console.log(`❌ 失败: ${err.message || err.code || '未知错误'} (code: ${err.code || 'N/A'})`);
      client = null;
    }
  }

  if (!client) {
    console.error('\n❌ 所有连接方式都失败了！');
    console.error('\n请使用方案二：通过 Render 后端执行修复');
    console.error('  curl -X POST https://workxiaoxin.onrender.com/api/fix-db');
    process.exit(1);
  }

  try {
    await runFixes(client);
  } catch (err) {
    console.error('❌ 执行修复失败:', err.message);
    console.error('错误代码:', err.code || 'N/A');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
