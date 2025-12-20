import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Thesis, Chapter, Task, Milestone } from "@shared/schema";
import { useTranslation } from "@/hooks/useTranslation";

interface DashboardData {
  thesis: Thesis | null;
  chapters: Chapter[];
  tasks: Task[];
  milestones: Milestone[];
  stats: {
    totalWords: number;
    completedChapters: number;
    totalChapters: number;
    pendingTasks: number;
    upcomingDeadlines: number;
  };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "final":
        return t.statusFinal;
      case "revised":
        return t.statusRevised;
      case "under_review":
        return t.statusUnderReview;
      default:
        return t.statusDraft;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const thesis = data?.thesis;
  const chapters = data?.chapters || [];
  const tasks = data?.tasks || [];
  const milestones = data?.milestones || [];
  const stats = data?.stats || {
    totalWords: 0,
    completedChapters: 0,
    totalChapters: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
  };

  const progress = stats.totalChapters > 0
    ? Math.round((stats.completedChapters / stats.totalChapters) * 100)
    : 0;

  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 5);
  const upcomingMilestones = milestones.filter((m) => !m.completed).slice(0, 3);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold" data-testid="text-dashboard-title">
          {thesis?.title || t.yourThesis}
        </h1>
        <p className="text-muted-foreground">
          {t.dashboardDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-word-count">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.wordCount}</p>
                <p className="text-2xl font-bold" data-testid="text-word-count">
                  {stats.totalWords.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-chapters">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.chapters}</p>
                <p className="text-2xl font-bold" data-testid="text-chapters">
                  {stats.completedChapters}/{stats.totalChapters}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.pendingTasks}</p>
                <p className="text-2xl font-bold" data-testid="text-pending-tasks">
                  {stats.pendingTasks}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-progress">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.progress}</p>
                <p className="text-2xl font-bold" data-testid="text-progress">
                  {progress}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-1.5" data-testid="progress-bar" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t.chapters}</CardTitle>
              <CardDescription>{t.areaThesisStructure}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/editor" data-testid="link-view-all-chapters">
                {t.viewAll} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {chapters.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t.noChaptersDashboard}</p>
                <Button asChild>
                  <Link href="/editor" data-testid="button-create-chapter">{t.createFirstChapter}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.slice(0, 5).map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{chapter.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {chapter.wordCount?.toLocaleString() || 0} {t.words}
                      </p>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(chapter.status || "draft")}>
                      {getStatusLabel(chapter.status || "draft")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t.navTasks}</CardTitle>
              <CardDescription>{t.thingsToDo}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks" data-testid="link-view-all-tasks">
                {t.viewAll} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t.allCaughtUp}</p>
                <Button asChild>
                  <Link href="/tasks" data-testid="button-add-task">{t.addTask}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 rounded border-2 flex-shrink-0 ${task.priority === "high"
                          ? "border-destructive"
                          : task.priority === "medium"
                            ? "border-yellow-500"
                            : "border-muted-foreground"
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{t.milestones}</CardTitle>
            <CardDescription>{t.keyThesisStages}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/planner" data-testid="link-view-planner">
              {t.viewPlanner} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingMilestones.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">{t.noMilestonesSet}</p>
              <Button asChild>
                <Link href="/planner" data-testid="button-setup-milestones">{t.setUpMilestones}</Link>
              </Button>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-2">
              {upcomingMilestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex-shrink-0 w-64 p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium truncate">{milestone.name}</span>
                  </div>
                  {milestone.targetDate && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(milestone.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
