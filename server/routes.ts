import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { z } from "zod";
import multer from "multer";
import pdf from "pdf-parse";

import {
  insertResearchEntrySchema,
  journalEntrySchema,
  insertFlashcardSchema,
} from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Validation schemas
const onboardingSchema = z.object({
  studyLevel: z.string().min(1),
  field: z.string().min(1),
  language: z.string().optional(),
  interfaceLanguage: z.string().optional(),
  thesisTitle: z.string().min(1, "Thesis title is required"),
  topic: z.string().optional(),
  researchQuestions: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  targetDate: z.string().optional(),
});

const milestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetDate: z.coerce.date().optional(),
});

const milestonesInitializeSchema = z.object({
  milestones: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    })
  ),
});

const milestoneUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  targetDate: z.coerce.date().nullable().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  chapterId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  completed: z.boolean().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

const chapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetWordCount: z.number().optional(),
});

const chapterUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  wordCount: z.number().optional(),
  status: z.enum(["draft", "under_review", "revised", "final"]).optional(),
});

const aiAssistSchema = z.object({
  action: z.enum(["outline", "academic", "summarize", "structure", "humanize", "ghostwrite"]),
  chapterTitle: z.string(),
  content: z.string().optional(),
  prompt: z.string(),
});

// ...





const referenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.array(z.string()).optional(),
  year: z.number().nullable().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  doi: z.string().optional(),
  notes: z.string().optional(),
  citationStyle: z.enum(["apa", "mla", "chicago"]).optional(),
  tags: z.array(z.string()).optional(),
  matrixData: z.record(z.string()).optional(),
});

const referenceUpdateSchema = z.object({
  title: z.string().optional(),
  authors: z.array(z.string()).optional(),
  year: z.number().nullable().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  doi: z.string().optional(),
  notes: z.string().optional(),
  citationStyle: z.enum(["apa", "mla", "chicago"]).optional(),
  tags: z.array(z.string()).optional(),
  matrixData: z.record(z.string()).optional(),
});

const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  studyLevel: z.string().optional(),
  field: z.string().optional(),
});

const thesisUpdateSchema = z.object({
  title: z.string().optional(),
  topic: z.string().optional(),
  matrixColumns: z.array(z.string()).optional(),
});

const shareSchema = z.object({
  email: z.string().email("Valid email required"),
  permissionLevel: z.enum(["read", "comment"]).optional(),
});

const journalEntrySchema = z.object({
  content: z.string().min(1, "Content is required"),
  type: z.enum(["thought", "meeting", "experiment", "reading"]).default("thought"),
  tags: z.array(z.string()).optional(),
  date: z.string().optional(), // ISO string from frontend
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Onboarding
  app.post("/api/onboarding/complete", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = onboardingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const { studyLevel, field, language, interfaceLanguage, thesisTitle, topic, researchQuestions, objectives, targetDate } = parsed.data;

      // Update user profile
      await storage.updateUser(userId, {
        studyLevel,
        field,
        language,
        interfaceLanguage,
        onboardingCompleted: true,
      });

      // Create thesis
      await storage.createThesis({
        userId,
        title: thesisTitle,
        topic,
        language,
        researchQuestions: researchQuestions?.filter((q: string) => q.trim()),
        objectives: objectives?.filter((o: string) => o.trim()),
        status: "active",
        degreeType: studyLevel,
        targetCompletionDate: targetDate ? new Date(targetDate) : null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Dashboard
  app.get("/api/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.json({
          thesis: null,
          chapters: [],
          tasks: [],
          milestones: [],
          stats: {
            totalWords: 0,
            completedChapters: 0,
            totalChapters: 0,
            pendingTasks: 0,
            upcomingDeadlines: 0,
          },
        });
      }

      const chapters = await storage.getChaptersByThesisId(thesis.id);
      const tasks = await storage.getTasksByThesisId(thesis.id);
      const milestones = await storage.getMilestonesByThesisId(thesis.id);

      const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
      const completedChapters = chapters.filter((c) => c.status === "final").length;
      const pendingTasks = tasks.filter((t) => !t.completed).length;

      res.json({
        thesis,
        chapters,
        tasks,
        milestones,
        stats: {
          totalWords,
          completedChapters,
          totalChapters: chapters.length,
          pendingTasks,
          upcomingDeadlines: milestones.filter((m) => !m.completed).length,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  // Planner
  app.get("/api/planner", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.json({ thesis: null, milestones: [] });
      }

      const milestones = await storage.getMilestonesByThesisId(thesis.id);
      res.json({ thesis, milestones });
    } catch (error) {
      console.error("Error fetching planner:", error);
      res.status(500).json({ message: "Failed to fetch planner" });
    }
  });

  // Milestones
  app.post("/api/milestones", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = milestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const existingMilestones = await storage.getMilestonesByThesisId(thesis.id);
      const { name, description, targetDate } = parsed.data;

      const milestone = await storage.createMilestone({
        thesisId: thesis.id,
        name,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        orderIndex: existingMilestones.length,
      });

      res.json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  app.post("/api/milestones/initialize", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = milestonesInitializeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const { milestones: templateMilestones } = parsed.data;

      for (let i = 0; i < templateMilestones.length; i++) {
        await storage.createMilestone({
          thesisId: thesis.id,
          name: templateMilestones[i].name,
          description: templateMilestones[i].description,
          orderIndex: i,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error initializing milestones:", error);
      res.status(500).json({ message: "Failed to initialize milestones" });
    }
  });

  app.patch("/api/milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = milestoneUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { id } = req.params;
      const { completed, ...data } = parsed.data;

      const milestone = await storage.updateMilestone(id, {
        ...data,
        completed,
        completedDate: completed ? new Date() : null,
      });

      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.json({ tasks: [], chapters: [] });
      }

      const tasks = await storage.getTasksByThesisId(thesis.id);
      const chapters = await storage.getChaptersByThesisId(thesis.id);
      res.json({ tasks, chapters });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = taskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const { title, description, priority, chapterId, dueDate } = parsed.data;

      const task = await storage.createTask({
        thesisId: thesis.id,
        chapterId: chapterId || null,
        title,
        description,
        priority,
        status: "todo",
        dueDate: dueDate ? new Date(dueDate) : null,
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = taskUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { id } = req.params;
      const data = parsed.data;

      const task = await storage.updateTask(id, data);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTask(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Editor
  app.get("/api/editor", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.json({ thesis: null, chapters: [] });
      }

      const chapters = await storage.getChaptersByThesisId(thesis.id);
      res.json({ thesis, chapters });
    } catch (error) {
      console.error("Error fetching editor data:", error);
      res.status(500).json({ message: "Failed to fetch editor data" });
    }
  });

  // Chapters
  app.post("/api/chapters", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = chapterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const existingChapters = await storage.getChaptersByThesisId(thesis.id);
      const { title, targetWordCount } = parsed.data;

      const chapter = await storage.createChapter({
        thesisId: thesis.id,
        title,
        targetWordCount: targetWordCount || null,
        orderIndex: existingChapters.length,
        status: "draft",
      });

      res.json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(500).json({ message: "Failed to create chapter" });
    }
  });

  app.patch("/api/chapters/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = chapterUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { id } = req.params;
      const data = parsed.data;

      const chapter = await storage.updateChapter(id, data);
      res.json(chapter);
    } catch (error) {
      console.error("Error updating chapter:", error);
      res.status(500).json({ message: "Failed to update chapter" });
    }
  });

  app.delete("/api/chapters/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChapter(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ message: "Failed to delete chapter" });
    }
  });

  // AI Assist
  app.post("/api/ai/assist", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = aiAssistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      if (!openai) {
        return res.json({ response: "AI assistance is not configured. Please add your OpenAI API key." });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);
      let context = "";

      if (thesis) {
        const docs = await storage.getDocumentsByThesisId(thesis.id);
        if (docs.length > 0) {
          // Limit content length to avoid context overflow, simple RAG for now
          const docContent = docs.map((d, i) => `[${i + 1}] ${d.title} (Filename: ${d.filename}):\n${d.content.substring(0, 1500)}...`).join("\n\n");
          context = `\n\nREFERENCE DOCUMENTS:\n${docContent} \n\nINSTRUCTIONS FOR USING REFERENCES: \n - Use the information from the documents above to answer the user request.\n - Cite the documents using the format (N) where N is the reference number, e.g. (1).\n - If you use information from a document, you MUST cite it.\n - At the end of your response, list the references you used.`;
        }
      }

      const { action, chapterTitle, content, prompt } = parsed.data;

      let systemPrompt = "You are an academic writing assistant helping PhD and Master's students with their thesis. ";

      switch (action) {
        case "outline":
          systemPrompt += "Generate a detailed outline for the chapter. Include main sections, subsections, and key points to cover. Format as a structured outline.";
          break;
        case "academic":
          systemPrompt += "Rewrite the provided text in a formal academic tone. Maintain the original meaning while improving clarity, precision, and scholarly language.";
          break;
        case "summarize":
          systemPrompt += "Summarize the content into 3-5 concise bullet points that capture the key ideas.";
          break;
        case "structure":
          systemPrompt += "Suggest the best structure for this section. Recommend how to organize the content, what subheadings to use, and how to improve the flow.";
          break;
        case "humanize":
          systemPrompt += "Rewrite the text to sound more human and less 'AI-generated'. \n" +
            "Strategies to use:\n" +
            "1. Vary sentence length significantly (mix short, medium, and long sentences).\n" +
            "2. Use more natural transitions instead of 'In conclusion', 'Furthermore', 'Moreover'.\n" +
            "3. Occasionally use rhetorical questions or more conversational academic phrasing where appropriate.\n" +
            "4. Ensure the perplexity and burstiness of the text is high to bypass AI detectors.\n" +
            "5. Keep the academic rigor but make the flow less robotic.";
          break;
        case "ghostwrite":
          systemPrompt += "You are an expert academic ghostwriter. Your task is to write a comprehensive, high-quality draft for this chapter.\n" +
            "Instructions:\n" +
            "1. Structure the chapter logically (e.g., Introduction, Core Arguments, Evidence/Analysis, Conclusion).\n" +
            "2. Write in a formal, scholarly tone appropriate for a thesis.\n" +
            "3. Ensure the content is substantive, well-reasoned, and flows naturally.\n" +
            "4. Target a length of approximately 800-1000 words (comprehensive overview).\n" +
            "5. Do NOT use placeholders like [Insert citation]. Make up plausible generic examples or generalized statements if specific data is missing.";
          break;
        default:
          systemPrompt += "Provide helpful suggestions to improve the academic writing.";
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt + context },
          {
            role: "user",
            content: `Chapter: ${chapterTitle} \n\nContent: \n${content || "(empty)"} \n\nRequest: ${prompt} `,
          },
        ],
        max_completion_tokens: 2048,
      });

      res.json({ response: response.choices[0].message.content });
    } catch (error) {
      console.error("Error with AI assist:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  // References
  app.get("/api/references", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.json({ references: [] });
      }

      const references = await storage.getReferencesByThesisId(thesis.id);
      res.json({ references });
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ message: "Failed to fetch references" });
    }
  });

  app.post("/api/references", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = referenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const { title, authors, year, source, url, doi, notes, citationStyle, tags, matrixData } = parsed.data;

      const reference = await storage.createReference({
        thesisId: thesis.id,
        title,
        authors: authors || [],
        year: year || null,
        source: source || null,
        url: url || null,
        doi: doi || null,
        notes: notes || null,
        citationStyle: citationStyle || "apa",
        tags: tags || [],
        matrixData: matrixData || {},
      });

      res.json(reference);
    } catch (error) {
      console.error("Error creating reference:", error);
      res.status(500).json({ message: "Failed to create reference" });
    }
  });

  app.patch("/api/references/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = referenceUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { id } = req.params;
      const data = parsed.data;

      const reference = await storage.updateReference(id, data);
      res.json(reference);
    } catch (error) {
      console.error("Error updating reference:", error);
      res.status(500).json({ message: "Failed to update reference" });
    }
  });

  app.delete("/api/references/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReference(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting reference:", error);
      res.status(500).json({ message: "Failed to delete reference" });
    }
  });

  // Settings
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const thesis = await storage.getThesisByUserId(userId);

      let sharedAccess: any[] = [];
      if (thesis) {
        sharedAccess = await storage.getSharedAccessByThesisId(thesis.id);
      }

      res.json({ user, thesis, sharedAccess });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings/profile", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const { firstName, lastName, studyLevel, field } = parsed.data;

      const user = await storage.updateUser(userId, {
        firstName,
        lastName,
        studyLevel,
        field,
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/settings/thesis", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = thesisUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const { title, topic, matrixColumns } = parsed.data;
      const updated = await storage.updateThesis(thesis.id, { title, topic, matrixColumns });

      res.json(updated);
    } catch (error) {
      console.error("Error updating thesis:", error);
      res.status(500).json({ message: "Failed to update thesis" });
    }
  });

  app.post("/api/settings/share", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = shareSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const { email, permissionLevel } = parsed.data;
      const token = randomUUID();

      const access = await storage.createSharedAccess({
        thesisId: thesis.id,
        email,
        token,
        permissionLevel,
      });

      res.json(access);
    } catch (error) {
      console.error("Error creating share:", error);
      res.status(500).json({ message: "Failed to create share link" });
    }
  });

  app.delete("/api/settings/share/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSharedAccess(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking access:", error);
      res.status(500).json({ message: "Failed to revoke access" });
    }
  });

  // Documents
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);
      if (!thesis) return res.json([]);
      const docs = await storage.getDocumentsByThesisId(thesis.id);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // Increased to 50MB for large theses
  });

  app.post("/api/documents/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      console.log("Upload request received");
      if (!req.file) {
        console.log("No file in request");
        return res.status(400).send("No file uploaded");
      }

      console.log(`File info: ${req.file.originalname}, ${req.file.mimetype}, ${req.file.size} bytes`);

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);
      if (!thesis) {
        console.log("No thesis found for user " + userId);
        return res.status(400).send("No thesis found");
      }

      let content = "";
      try {
        if (req.file.mimetype === "application/pdf") {
          console.log("Parsing PDF...");
          const data = await pdf(req.file.buffer);
          content = data.text;
          console.log("PDF parsed successfully, length: " + content.length);
        } else if (req.file.mimetype === "text/plain") {
          console.log("Reading text file...");
          content = req.file.buffer.toString("utf-8");
        } else {
          return res.status(400).json({ message: "Unsupported file type. Please upload a PDF or Text file." });
        }
      } catch (parseError) {
        console.error("Error parsing file content:", parseError);
        return res.status(400).json({ message: "Failed to parse file content. The file might be corrupted or too complex." });
      }

      // Sanitize content for Postgres (remove null bytes)
      content = content.replace(/\u0000/g, ' ');

      console.log("Saving document to DB...");
      const doc = await storage.createDocument({
        thesisId: thesis.id,
        userId,
        title: req.body.title || req.file.originalname,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        content
      });
      console.log("Document saved with ID: " + doc.id);
      res.json(doc);
    } catch (error) {
      console.error("Upload route critical error:", error);
      res.status(500).send("Upload failed internal error");
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDocument(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).send("Delete failed");
    }
  });

  // Research Journal
  app.get("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const entries = await storage.getResearchEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      // Assuming an import statement exists elsewhere in the file for these schemas
      // For example: import { insertResearchEntrySchema, journalEntrySchema, insertFlashcardSchema } from "../shared/schema";
      const parsed = journalEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.id;
      const { content, type, tags, date } = parsed.data;

      const entry = await storage.createResearchEntry(userId, {
        content,
        type: type || "thought",
        tags: tags || [],
        date: date ? new Date(date) : new Date(),
      });

      res.json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.patch("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsed = journalEntrySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const updateData: any = { ...parsed.data };
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const updated = await storage.updateResearchEntry(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteResearchEntry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Flashcards (Defense Prep)
  app.post("/api/ai/generate-flashcards", isAuthenticated, async (req: any, res) => {
    try {
      const { amount = 5, category = "general" } = req.body;
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      const chapters = await storage.getChaptersByThesisId(thesis.id);

      // Construct context from thesis chapters
      const thesisContext = chapters
        .filter(c => c.content)
        .map(c => `Chapter: ${c.title}\n${c.content?.substring(0, 1000)}...`)
        .join("\n\n");

      if (!thesisContext) {
        return res.status(400).json({ message: "No content found in thesis chapters to generate flashcards." });
      }

      if (!openai) {
        return res.json({ message: "AI is not configured." });
      }

      const systemPrompt = `You are a strict PhD defense committee member. 
      Generate ${amount} challenging defense questions based on the provided thesis content.
      Focus on the category: ${category}.
      
      Return the output as a JSON array of objects with 'front' (the question) and 'back' (the answer/key points).
      Example: [{"front": "What is the limitation of...", "back": "The study is limited by..."}]`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: thesisContext },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content || "{\"cards\": []}");
      const cards = result.cards || result.flashcards || result;

      // Save generated cards
      const savedCards = [];
      for (const card of Array.isArray(cards) ? cards : []) {
        const saved = await storage.createFlashcard({
          thesisId: thesis.id,
          front: card.front,
          back: card.back,
          category,
        });
        savedCards.push(saved);
      }

      res.json(savedCards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });

  app.get("/api/flashcards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);
      if (!thesis) return res.json([]);
      const cards = await storage.getFlashcards(thesis.id);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcards", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertFlashcardSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);
      if (!thesis) return res.status(400).json({ message: "No thesis found" });

      const card = await storage.createFlashcard({
        ...parsed.data,
        thesisId: thesis.id,
      });
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to create flashcard" });
    }
  });

  app.patch("/api/flashcards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { masteryLevel } = req.body;
      const card = await storage.updateFlashcardMastery(id, masteryLevel);
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFlashcard(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard" });
    }
  });

  // Methodology Wizard
  app.post("/api/ai/generate-methodology", isAuthenticated, async (req: any, res) => {
    try {
      const { methodologyType, specificMethodology } = req.body;
      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);

      if (!thesis) {
        return res.status(400).json({ message: "No thesis found" });
      }

      // 1. Update Thesis with selection
      await storage.updateThesis(thesis.id, {
        methodologyType,
        specificMethodology,
      });

      // 2. Find or Create Methodology Chapter
      let chapters = await storage.getChaptersByThesisId(thesis.id);
      let methodChapter = chapters.find(c => c.title.toLowerCase().includes("methodology") || c.title.toLowerCase().includes("method"));

      if (!methodChapter) {
        methodChapter = await storage.createChapter({
          thesisId: thesis.id,
          title: "Methodology",
          orderIndex: 3, // Assuming typical order
          content: "",
          status: "draft",
        });
      }

      if (!openai) {
        return res.json({ message: "AI is not configured. Methodology preferences saved.", chapterId: methodChapter.id });
      }

      // 3. Generate Content
      const systemPrompt = `You are a strict research methodologist.
      The student has chosen a ${methodologyType} approach, specifically: ${specificMethodology}.
      
      Generate a comprehensive outline for the Methodology chapter.
      Include these sections:
      1. Research Design (Justify the ${specificMethodology} approach)
      2. Participants / Sample
      3. Instruments / Data Collection Sources
      4. Procedure
      5. Data Analysis Plan
      6. Ethics
      
      Output valid HTML content suitable for a WYSIWYG editor. Use <h2> and <h3> tags.`;

      const userContext = `Thesis Title: ${thesis.title}\nTopic: ${thesis.topic}\nResearch Questions: ${thesis.researchQuestions?.join("\n")}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
      });

      const generatedContent = response.choices[0].message.content || "";

      // 4. Update Chapter Content
      await storage.updateChapter(methodChapter.id, {
        content: generatedContent,
      });

      res.json({ success: true, chapterId: methodChapter.id });

    } catch (error) {
      console.error("Error generating methodology:", error);
      res.status(500).json({ message: "Failed to generate methodology" });
    }
  });

  return httpServer;
}
