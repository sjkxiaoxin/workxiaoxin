-- 飞任务 - 数据库建表 SQL
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  creator_id TEXT REFERENCES users(id),
  assignee_id TEXT REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 任务评论表
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 小队表
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  creator_id TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 小队成员表
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 6. 插入测试用户
INSERT INTO users (id, name) VALUES 
  ('user-001', '张三'),
  ('user-002', '测试用户二'),
  ('user-003', '测试用户三')
ON CONFLICT (id) DO NOTHING;
