import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  FileText,
  Plus,
  Save,
  Sparkles,
  BookOpen,
  PenLine,
  ListOrdered,
  MessageSquare,
  Loader2,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chapter, Thesis, Comment } from "@shared/schema";

interface EditorData {
  thesis: Thesis | null;
  chapters: Chapter[];
}

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const aiActions: AIAction[] = [
  {
    id: "outline",
    label: "Generate Outline",
    icon: <ListOrdered className="h-4 w-4" />,
    prompt: "Generate a detailed outline for this chapter",
  },
  {
    id: "academic",
    label: "Rewrite Academic",
    icon: <PenLine className="h-4 w-4" />,
    prompt: "Rewrite the selected text in academic tone",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: <BookOpen className="h-4 w-4" />,
    prompt: "Summarize this content into key bullet points",
  },
  {
    id: "structure",
    label: "Suggest Structure",
    icon: <FileText className="h-4 w-4" />,
    prompt: "Suggest the best structure for this section",
  },
  {
    id: "humanize",
    label: "Humanize (Bypass AI)",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "Rewrite this text to sound more human and bypass AI detectors",
  },
  {
    id: "ghostwrite",
    label: "Ghostwrite Chapter",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "Write a comprehensive draft for this chapter",
  },
];

export default function Editor() {
  const { toast } = useToast();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [newChapter, setNewChapter] = useState({
    title: "",
    targetWordCount: "",
  });

  const { data, isLoading } = useQuery<EditorData>({
    queryKey: ["/api/editor"],
  });

  const chapters = data?.chapters || [];
  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
      setContent(chapters[0].content || "");
    }
  }, [chapters, selectedChapterId]);

  useEffect(() => {
    if (selectedChapter) {
      setContent(selectedChapter.content || "");
    }
  }, [selectedChapter]);

  const createChapterMutation = useMutation({
    mutationFn: async (chapter: { title: string; targetWordCount?: number }) => {
      await apiRequest("POST", "/api/chapters", chapter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsAddingChapter(false);
      setNewChapter({ title: "", targetWordCount: "" });
      toast({ title: "Chapter created", description: "Your new chapter has been added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create chapter.", variant: "destructive" });
    },
  });

  const saveContentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChapterId) return;
      await apiRequest("PATCH", `/api/chapters/${selectedChapterId}`, {
        content,
        wordCount: countWords(content),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Saved", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    },
  });

  const handleAIAction = async (action: AIAction) => {
    if (!selectedChapter) return;
    setIsAILoading(true);
    setIsAISidebarOpen(true);
    setAiResponse("");

    try {
      const response = await apiRequest("POST", "/api/ai/assist", {
        action: action.id,
        chapterTitle: selectedChapter.title,
        content: content || "",
        prompt: action.prompt,
      });
      const data = await response.json();
      setAiResponse(data.response || "No response generated.");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to get AI response. Please try again.";
      setAiResponse(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAILoading(false);
    }
  };

  const countWords = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const handleAddChapter = () => {
    if (newChapter.title.trim()) {
      createChapterMutation.mutate({
        title: newChapter.title,
        targetWordCount: newChapter.targetWordCount
          ? parseInt(newChapter.targetWordCount)
          : undefined,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "final":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "revised":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "under_review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-64 border-r p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 mb-2" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  const wordCount = countWords(content);
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  return (
    <div className="flex h-full">
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Chapters</h2>
            <Dialog open={isAddingChapter} onOpenChange={setIsAddingChapter}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-add-chapter">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Chapter</DialogTitle>
                  <DialogDescription>Create a new chapter for your thesis.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapterTitle">Chapter Title</Label>
                    <Input
                      id="chapterTitle"
                      placeholder="e.g., Introduction"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                      data-testid="input-chapter-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetWordCount">Target Word Count (optional)</Label>
                    <Input
                      id="targetWordCount"
                      type="number"
                      placeholder="e.g., 5000"
                      value={newChapter.targetWordCount}
                      onChange={(e) =>
                        setNewChapter({ ...newChapter, targetWordCount: e.target.value })
                      }
                      data-testid="input-target-word-count"
                    />
                  </div>
                  <Button
                    onClick={handleAddChapter}
                    disabled={!newChapter.title.trim() || createChapterMutation.isPending}
                    className="w-full"
                    data-testid="button-save-chapter"
                  >
                    {createChapterMutation.isPending ? "Creating..." : "Create Chapter"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {totalWords.toLocaleString()} words
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chapters.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No chapters yet. Create your first chapter to start writing.
              </div>
            ) : (
              chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${selectedChapterId === chapter.id
                    ? "bg-sidebar-accent"
                    : "hover:bg-muted/50"
                    }`}
                  data-testid={`button-chapter-${index}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate text-sm">{chapter.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {(chapter.wordCount || 0).toLocaleString()} words
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(chapter.status || "draft")}`}
                    >
                      {chapter.status || "Draft"}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChapter ? (
          <>
            <div className="flex items-center justify-between p-4 border-b gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold truncate" data-testid="text-chapter-title">
                  {selectedChapter.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {wordCount.toLocaleString()} words
                  {selectedChapter.targetWordCount &&
                    ` / ${selectedChapter.targetWordCount.toLocaleString()} target`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Sheet open={isAISidebarOpen} onOpenChange={setIsAISidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" data-testid="button-ai-assist">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Assist
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Writing Assistant
                      </SheetTitle>
                      <SheetDescription>
                        Get AI-powered help with your academic writing.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {aiActions.map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleAIAction(action)}
                            disabled={isAILoading}
                            data-testid={`button-ai-${action.id}`}
                          >
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>AI Response</Label>
                        <div className="min-h-[200px] p-4 rounded-lg bg-muted/50 text-sm">
                          {isAILoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating response...
                            </div>
                          ) : aiResponse ? (
                            <div className="whitespace-pre-wrap">{aiResponse}</div>
                          ) : (
                            <p className="text-muted-foreground">
                              Select an action above to get AI assistance.
                            </p>
                          )}
                        </div>
                      </div>
                      {aiResponse && !isAILoading && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setContent((prev) => prev + "\n\n" + aiResponse);
                            toast({ title: "Inserted", description: "AI response added to your content." });
                          }}
                          data-testid="button-insert-ai-response"
                        >
                          Insert into Editor
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                <Button
                  onClick={() => saveContentMutation.mutate()}
                  disabled={saveContentMutation.isPending}
                  data-testid="button-save"
                >
                  {saveContentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your chapter here..."
                  className="min-h-[500px] text-base leading-relaxed font-serif resize-none border-0 focus-visible:ring-0 p-0"
                  data-testid="textarea-chapter-content"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-medium mb-2">No chapter selected</h2>
              <p className="text-muted-foreground mb-4">
                Select a chapter from the sidebar or create a new one to start writing.
              </p>
              <Button onClick={() => setIsAddingChapter(true)} data-testid="button-create-first-chapter">
                <Plus className="h-4 w-4 mr-2" />
                Create Chapter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
