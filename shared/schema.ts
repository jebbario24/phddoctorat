import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  studyLevel: varchar("study_level"), // 'masters' | 'phd'
  field: varchar("field"),
  language: varchar("language"),
  password: text("password"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Theses table
export const theses = pgTable("theses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  topic: text("topic"),
  language: varchar("language").default("english"),
  researchQuestions: text("research_questions").array(),
  objectives: text("objectives").array(),
  status: varchar("status").default("active"), // 'active' | 'completed' | 'archived'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chapters table
export const chapters = pgTable("chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  content: text("content").default(""),
  wordCount: integer("word_count").default(0),
  targetWordCount: integer("target_word_count"),
  orderIndex: integer("order_index").notNull(),
  status: varchar("status").default("draft"), // 'draft' | 'under_review' | 'revised' | 'final'
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table (Kanban items)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id").references(() => chapters.id, { onDelete: "cascade" }),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("todo"), // 'todo' | 'in_progress' | 'review' | 'done'
  priority: varchar("priority").default("medium"), // 'low' | 'medium' | 'high'
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Milestones table
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  completed: boolean("completed").default(false),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  paragraphIndex: integer("paragraph_index"), // For inline comments
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// References table
export const references = pgTable("references", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  authors: text("authors").array(),
  year: integer("year"),
  source: varchar("source"), // Journal, Book, Website, etc.
  url: varchar("url"),
  doi: varchar("doi"),
  citationStyle: varchar("citation_style").default("apa"), // 'apa' | 'mla' | 'chicago'
  formattedCitation: text("formatted_citation"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shared Access table for supervisor collaboration
export const sharedAccess = pgTable("shared_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  permissionLevel: varchar("permission_level").default("read"), // 'read' | 'comment'
  accepted: boolean("accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Documents table for RAG
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  content: text("content").notNull(), // Extracted text
  filename: varchar("filename").notNull(),
  mimeType: varchar("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  theses: many(theses),
  comments: many(comments),
}));

export const thesesRelations = relations(theses, ({ one, many }) => ({
  user: one(users, {
    fields: [theses.userId],
    references: [users.id],
  }),
  chapters: many(chapters),
  tasks: many(tasks),
  milestones: many(milestones),
  references: many(references),
  sharedAccess: many(sharedAccess),
  documents: many(documents),
}));

// ...

export const sharedAccessRelations = relations(sharedAccess, ({ one }) => ({
  thesis: one(theses, {
    fields: [sharedAccess.thesisId],
    references: [theses.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  thesis: one(theses, {
    fields: [documents.thesisId],
    references: [theses.id],
  }),
}));

// Insert schemas
// ...

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

// ...



export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  thesis: one(theses, {
    fields: [chapters.thesisId],
    references: [theses.id],
  }),
  tasks: many(tasks),
  comments: many(comments),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  thesis: one(theses, {
    fields: [tasks.thesisId],
    references: [theses.id],
  }),
  chapter: one(chapters, {
    fields: [tasks.chapterId],
    references: [chapters.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  thesis: one(theses, {
    fields: [milestones.thesisId],
    references: [theses.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const referencesRelations = relations(references, ({ one }) => ({
  thesis: one(theses, {
    fields: [references.thesisId],
    references: [theses.id],
  }),
}));



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThesisSchema = createInsertSchema(theses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferenceSchema = createInsertSchema(references).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSharedAccessSchema = createInsertSchema(sharedAccess).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type InsertThesis = z.infer<typeof insertThesisSchema>;
export type Thesis = typeof theses.$inferSelect;

export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chapters.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertReference = z.infer<typeof insertReferenceSchema>;
export type Reference = typeof references.$inferSelect;

export type InsertSharedAccess = z.infer<typeof insertSharedAccessSchema>;
export type SharedAccess = typeof sharedAccess.$inferSelect;
