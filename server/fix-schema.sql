-- 修复数据库表结构，使其与后端代码一致

-- 1. 给 tasks 表添加缺失的字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- 2. 将 due_date 的数据迁移到 deadline（如果有数据的话）
UPDATE tasks SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL;

-- 3. 删除旧的 due_date 列（可选，保留也不影响）
-- ALTER TABLE tasks DROP COLUMN IF EXISTS due_date;

-- 4. 创建 task_history 表
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 验证
SELECT 'tasks columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position;
