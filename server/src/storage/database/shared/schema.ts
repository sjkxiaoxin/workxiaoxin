import { pgTable, serial, timestamp, varchar, boolean, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统表（禁止删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 100 }).notNull(),
		avatar: varchar("avatar", { length: 500 }),
		openid: varchar("openid", { length: 100 }).unique(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("users_openid_idx").on(table.openid),
	]
);

// 任务表
export const tasks = pgTable(
	"tasks",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		title: varchar("title", { length: 200 }).notNull(),
		description: text("description"),
		status: varchar("status", { length: 20 }).notNull().default("todo"),
		assignee_id: varchar("assignee_id", { length: 36 }).notNull().references(() => users.id),
		creator_id: varchar("creator_id", { length: 36 }).notNull().references(() => users.id),
		deadline: timestamp("deadline", { withTimezone: true }),
		is_urgent: boolean("is_urgent").default(false).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("tasks_assignee_id_idx").on(table.assignee_id),
		index("tasks_creator_id_idx").on(table.creator_id),
		index("tasks_status_idx").on(table.status),
		index("tasks_deadline_idx").on(table.deadline),
		index("tasks_created_at_idx").on(table.created_at),
	]
);

// 评论表
export const comments = pgTable(
	"comments",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		task_id: varchar("task_id", { length: 36 }).notNull().references(() => tasks.id, { onDelete: "cascade" }),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		content: text("content").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("comments_task_id_idx").on(table.task_id),
		index("comments_user_id_idx").on(table.user_id),
		index("comments_created_at_idx").on(table.created_at),
	]
);

// 任务历史表
export const taskHistory = pgTable(
	"task_history",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		task_id: varchar("task_id", { length: 36 }).notNull().references(() => tasks.id, { onDelete: "cascade" }),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		action: varchar("action", { length: 200 }).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("task_history_task_id_idx").on(table.task_id),
		index("task_history_user_id_idx").on(table.user_id),
		index("task_history_created_at_idx").on(table.created_at),
	]
);

// 小队表
export const teams = pgTable(
	"teams",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 100 }).notNull(),
		creator_id: varchar("creator_id", { length: 36 }).notNull().references(() => users.id),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("teams_creator_id_idx").on(table.creator_id),
		index("teams_created_at_idx").on(table.created_at),
	]
);

// 小队成员表
export const teamMembers = pgTable(
	"team_members",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		team_id: varchar("team_id", { length: 36 }).notNull().references(() => teams.id, { onDelete: "cascade" }),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
		role: varchar("role", { length: 20 }).notNull().default("member"), // owner 或 member
		joined_at: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("team_members_team_id_idx").on(table.team_id),
		index("team_members_user_id_idx").on(table.user_id),
		index("team_members_role_idx").on(table.role),
	]
);