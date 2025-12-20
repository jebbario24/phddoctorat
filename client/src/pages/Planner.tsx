import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Target,
  Clock,
  Flag,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Milestone, Thesis } from "@shared/schema";
import { useTranslation } from "@/hooks/useTranslation";

interface PlannerData {
  thesis: Thesis | null;
  milestones: Milestone[];
}

const defaultMilestones = [
  { name: "Proposal", description: "Complete thesis proposal and get approval" },
  { name: "Literature Review", description: "Complete comprehensive literature review" },
  { name: "Methodology", description: "Finalize research methodology" },
  { name: "Data Collection", description: "Complete data collection phase" },
  { name: "Analysis", description: "Analyze collected data and findings" },
  { name: "Results", description: "Write up results chapter" },
  { name: "Discussion", description: "Complete discussion and conclusions" },
  { name: "Submission", description: "Final thesis submission" },
];

export default function Planner() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    description: "",
    targetDate: "",
  });

  const { data, isLoading } = useQuery<PlannerData>({
    queryKey: ["/api/planner"],
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (milestone: { name: string; description: string; targetDate: string }) => {
      await apiRequest("POST", "/api/milestones", milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsAddingMilestone(false);
      setNewMilestone({ name: "", description: "", targetDate: "" });
      toast({ title: t.milestoneAdded, description: t.milestoneCreatedDesc });
    },
    onError: () => {
      toast({ title: t.error || "Error", description: t.createMilestoneError, variant: "destructive" });
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await apiRequest("PATCH", `/api/milestones/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const initializeMilestonesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/milestones/initialize", { milestones: defaultMilestones });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: t.milestonesCreated, description: t.defaultMilestonesDesc });
    },
    onError: () => {
      toast({ title: t.error || "Error", description: t.createMilestonesError, variant: "destructive" });
    },
  });

  const handleAddMilestone = () => {
    if (newMilestone.name.trim()) {
      createMilestoneMutation.mutate(newMilestone);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const milestones = data?.milestones || [];
  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-planner-title">{t.plannerTitle}</h1>
          <p className="text-muted-foreground">{t.plannerDesc}</p>
        </div>
        <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-milestone">
              <Plus className="h-4 w-4 mr-2" />
              {t.addMilestone}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addMilestoneDialogTitle}</DialogTitle>
              <DialogDescription>
                {t.addMilestoneDialogDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.milestoneName}</Label>
                <Input
                  id="name"
                  placeholder={t.milestonePlaceholder}
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  data-testid="input-milestone-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.milestoneDescription}</Label>
                <Input
                  id="description"
                  placeholder={t.descriptionPlaceholder}
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  data-testid="input-milestone-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">{t.targetDate}</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newMilestone.targetDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  data-testid="input-milestone-date"
                />
              </div>
              <Button
                onClick={handleAddMilestone}
                disabled={!newMilestone.name.trim() || createMilestoneMutation.isPending}
                className="w-full"
                data-testid="button-save-milestone"
              >
                {createMilestoneMutation.isPending ? t.adding : t.addMilestone}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t.overallProgress}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-3" />
            <span className="text-lg font-semibold" data-testid="text-overall-progress">{progress}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount} {t.milestonesCompleted} {milestones.length} {t.milestonesCompletedSuffix}
          </p>
        </CardContent>
      </Card>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noMilestonesYet}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t.noMilestonesDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => initializeMilestonesMutation.mutate()}
                disabled={initializeMilestonesMutation.isPending}
                data-testid="button-use-template"
              >
                <Flag className="h-4 w-4 mr-2" />
                {initializeMilestonesMutation.isPending ? t.creatingMilestones : t.useDefaultTemplate}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingMilestone(true)}>
                {t.createCustom}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative pl-14">
                <button
                  onClick={() =>
                    toggleMilestoneMutation.mutate({
                      id: milestone.id,
                      completed: !milestone.completed,
                    })
                  }
                  className={`absolute left-0 top-0 h-12 w-12 rounded-full border-4 flex items-center justify-center transition-colors ${milestone.completed
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted hover:border-primary"
                    }`}
                  data-testid={`button-toggle-milestone-${index}`}
                >
                  {milestone.completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <Card className={milestone.completed ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3
                          className={`font-medium ${milestone.completed ? "line-through" : ""}`}
                          data-testid={`text-milestone-name-${index}`}
                        >
                          {milestone.name}
                        </h3>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        )}
                      </div>
                      {milestone.targetDate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(milestone.targetDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
