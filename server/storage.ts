import {
  users,
  theses,
  chapters,
  tasks,
  milestones,
  comments,
  references,
  sharedAccess,
  type User,
  type InsertUser,
  type UpsertUser,
  type Thesis,
  type InsertThesis,
  type Chapter,
  type InsertChapter,
  type Task,
  type InsertTask,
  type Milestone,
  type InsertMilestone,
  type Comment,
  type InsertComment,
  type Reference,
  type InsertReference,
  type SharedAccess,
  type InsertSharedAccess,

  documents,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;

  // Thesis operations
  getThesisByUserId(userId: string): Promise<Thesis | undefined>;
  createThesis(thesis: InsertThesis): Promise<Thesis>;
  updateThesis(id: string, data: Partial<InsertThesis>): Promise<Thesis | undefined>;

  // Chapter operations
  getChaptersByThesisId(thesisId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | undefined>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: string, data: Partial<InsertChapter>): Promise<Chapter | undefined>;
  deleteChapter(id: string): Promise<void>;

  // Task operations
  getTasksByThesisId(thesisId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  // Milestone operations
  getMilestonesByThesisId(thesisId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, data: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<void>;

  // Comment operations
  getCommentsByChapterId(chapterId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, data: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;

  // Reference operations
  getReferencesByThesisId(thesisId: string): Promise<Reference[]>;
  createReference(reference: InsertReference): Promise<Reference>;
  updateReference(id: string, data: Partial<InsertReference>): Promise<Reference | undefined>;
  deleteReference(id: string): Promise<void>;

  // Shared access operations
  getSharedAccessByThesisId(thesisId: string): Promise<SharedAccess[]>;
  getSharedAccessByToken(token: string): Promise<SharedAccess | undefined>;
  createSharedAccess(access: InsertSharedAccess): Promise<SharedAccess>;
  deleteSharedAccess(id: string): Promise<void>;

  // Document operations
  getDocumentsByThesisId(thesisId: string): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Thesis operations
  async getThesisByUserId(userId: string): Promise<Thesis | undefined> {
    const [thesis] = await db.select().from(theses).where(eq(theses.userId, userId));
    return thesis;
  }

  async createThesis(thesis: InsertThesis): Promise<Thesis> {
    const [created] = await db.insert(theses).values(thesis).returning();
    return created;
  }

  async updateThesis(id: string, data: Partial<InsertThesis>): Promise<Thesis | undefined> {
    const [updated] = await db
      .update(theses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(theses.id, id))
      .returning();
    return updated;
  }

  // Chapter operations
  async getChaptersByThesisId(thesisId: string): Promise<Chapter[]> {
    return db
      .select()
      .from(chapters)
      .where(eq(chapters.thesisId, thesisId))
      .orderBy(asc(chapters.orderIndex));
  }

  async getChapter(id: string): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter;
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const [created] = await db.insert(chapters).values(chapter).returning();
    return created;
  }

  async updateChapter(id: string, data: Partial<InsertChapter>): Promise<Chapter | undefined> {
    const [updated] = await db
      .update(chapters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chapters.id, id))
      .returning();
    return updated;
  }

  async deleteChapter(id: string): Promise<void> {
    await db.delete(chapters).where(eq(chapters.id, id));
  }

  // Task operations
  async getTasksByThesisId(thesisId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.thesisId, thesisId))
      .orderBy(asc(tasks.orderIndex));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Milestone operations
  async getMilestonesByThesisId(thesisId: string): Promise<Milestone[]> {
    return db
      .select()
      .from(milestones)
      .where(eq(milestones.thesisId, thesisId))
      .orderBy(asc(milestones.orderIndex));
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [created] = await db.insert(milestones).values(milestone).returning();
    return created;
  }

  async updateMilestone(id: string, data: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const [updated] = await db
      .update(milestones)
      .set(data)
      .where(eq(milestones.id, id))
      .returning();
    return updated;
  }

  async deleteMilestone(id: string): Promise<void> {
    await db.delete(milestones).where(eq(milestones.id, id));
  }

  // Comment operations
  async getCommentsByChapterId(chapterId: string): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.chapterId, chapterId));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async updateComment(id: string, data: Partial<InsertComment>): Promise<Comment | undefined> {
    const [updated] = await db
      .update(comments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updated;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Reference operations
  async getReferencesByThesisId(thesisId: string): Promise<Reference[]> {
    return db.select().from(references).where(eq(references.thesisId, thesisId));
  }

  async createReference(reference: InsertReference): Promise<Reference> {
    const [created] = await db.insert(references).values(reference).returning();
    return created;
  }

  async updateReference(id: string, data: Partial<InsertReference>): Promise<Reference | undefined> {
    const [updated] = await db
      .update(references)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(references.id, id))
      .returning();
    return updated;
  }

  async deleteReference(id: string): Promise<void> {
    await db.delete(references).where(eq(references.id, id));
  }

  // Shared access operations
  async getSharedAccessByThesisId(thesisId: string): Promise<SharedAccess[]> {
    return db.select().from(sharedAccess).where(eq(sharedAccess.thesisId, thesisId));
  }

  async getSharedAccessByToken(token: string): Promise<SharedAccess | undefined> {
    const [access] = await db.select().from(sharedAccess).where(eq(sharedAccess.token, token));
    return access;
  }

  async createSharedAccess(access: InsertSharedAccess): Promise<SharedAccess> {
    const [created] = await db.insert(sharedAccess).values(access).returning();
    return created;
  }

  async deleteSharedAccess(id: string): Promise<void> {
    await db.delete(sharedAccess).where(eq(sharedAccess.id, id));
  }

  // Document operations
  async getDocumentsByThesisId(thesisId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.thesisId, thesisId));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(doc).returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();
