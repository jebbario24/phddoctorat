import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { z } from "zod";
import multer from "multer";
import pdf from "pdf-parse";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Validation schemas
const onboardingSchema = z.object({
  studyLevel: z.string().min(1),
  field: z.string().min(1),
  language: z.string().optional(),
  thesisTitle: z.string().min(1, "Thesis title is required"),
  topic: z.string().optional(),
  researchQuestions: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
});

const milestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetDate: z.string().optional(),
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
  targetDate: z.string().nullable().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  chapterId: z.string().optional(),
  dueDate: z.string().optional(),
});

const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
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
  action: z.enum(["outline", "academic", "summarize", "structure"]),
  chapterTitle: z.string(),
  content: z.string().optional(),
  prompt: z.string(),
});

const referenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.array(z.string()).optional(),
  year: z.number().nullable().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  doi: z.string().optional(),
  notes: z.string().optional(),
  citationStyle: z.enum(["apa", "mla", "chicago"]).optional(),
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
});

const shareSchema = z.object({
  email: z.string().email("Valid email required"),
  permissionLevel: z.enum(["read", "comment"]).optional(),
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
      const { studyLevel, field, language, thesisTitle, topic, researchQuestions, objectives } = parsed.data;

      // Update user profile
      await storage.updateUser(userId, {
        studyLevel,
        field,
        language,
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

      const { title, authors, year, source, url, doi, notes, citationStyle } = parsed.data;

      const reference = await storage.createReference({
        thesisId: thesis.id,
        title,
        authors,
        year,
        source,
        url,
        doi,
        notes,
        citationStyle,
      });

      res.json(reference);
    } catch (error) {
      console.error("Error creating reference:", error);
      res.status(500).json({ message: "Failed to create reference" });
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

      const { title, topic } = parsed.data;
      const updated = await storage.updateThesis(thesis.id, { title, topic });

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

  app.post("/api/documents/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).send("No file uploaded");

      const userId = req.user.id;
      const thesis = await storage.getThesisByUserId(userId);
      if (!thesis) return res.status(400).send("No thesis found");

      let content = "";
      if (req.file.mimetype === "application/pdf") {
        const data = await pdf(req.file.buffer);
        content = data.text;
      } else {
        content = req.file.buffer.toString("utf-8");
      }

      // Limit content size just in case, though DB text can invoke TOAST
      // But we generally want full text for AI.

      const doc = await storage.createDocument({
        thesisId: thesis.id,
        userId,
        title: req.body.title || req.file.originalname,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        content
      });
      res.json(doc);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send("Upload failed");
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

  return httpServer;
}
