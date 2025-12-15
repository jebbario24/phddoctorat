import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  studyLevel: string;
  field: string;
  language: string;
  thesisTitle: string;
  topic: string;
  researchQuestions: string[];
  objectives: string[];
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const [data, setData] = useState<OnboardingData>({
    studyLevel: "",
    field: "",
    language: "english",
    thesisTitle: "",
    topic: "",
    researchQuestions: [""],
    objectives: [""],
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/onboarding/complete", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "Your thesis has been set up successfully." });
      navigate("/dashboard");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete setup. Please try again.", variant: "destructive" });
    },
  });

  const addResearchQuestion = () => {
    setData({ ...data, researchQuestions: [...data.researchQuestions, ""] });
  };

  const updateResearchQuestion = (index: number, value: string) => {
    const updated = [...data.researchQuestions];
    updated[index] = value;
    setData({ ...data, researchQuestions: updated });
  };

  const addObjective = () => {
    setData({ ...data, objectives: [...data.objectives, ""] });
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...data.objectives];
    updated[index] = value;
    setData({ ...data, objectives: updated });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.studyLevel && data.field;
      case 2:
        return data.thesisTitle.trim().length > 0;
      case 3:
        return data.researchQuestions.some((q) => q.trim().length > 0);
      case 4:
        return data.objectives.some((o) => o.trim().length > 0);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-semibold">ThesisFlow</span>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Define your thesis"}
              {step === 3 && "Research questions"}
              {step === 4 && "Set your objectives"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Help us personalize your experience"}
              {step === 2 && "What will your thesis be about?"}
              {step === 3 && "What questions will your research answer?"}
              {step === 4 && "What do you aim to achieve?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studyLevel">Study Level</Label>
                  <Select
                    value={data.studyLevel}
                    onValueChange={(value) => setData({ ...data, studyLevel: value })}
                  >
                    <SelectTrigger data-testid="select-study-level">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD / Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Select
                    value={data.field}
                    onValueChange={(value) => setData({ ...data, field: value })}
                  >
                    <SelectTrigger data-testid="select-field">
                      <SelectValue placeholder="Select your field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sciences">Natural Sciences</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="medicine">Medicine & Health</SelectItem>
                      <SelectItem value="social">Social Sciences</SelectItem>
                      <SelectItem value="humanities">Humanities</SelectItem>
                      <SelectItem value="business">Business & Economics</SelectItem>
                      <SelectItem value="arts">Arts & Design</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="law">Law</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Thesis Language</Label>
                  <Select
                    value={data.language}
                    onValueChange={(value) => setData({ ...data, language: value })}
                  >
                    <SelectTrigger data-testid="select-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="portuguese">Portuguese</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="thesisTitle">Thesis Title</Label>
                  <Input
                    id="thesisTitle"
                    placeholder="Enter your thesis title"
                    value={data.thesisTitle}
                    onChange={(e) => setData({ ...data, thesisTitle: e.target.value })}
                    data-testid="input-thesis-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic Description</Label>
                  <Textarea
                    id="topic"
                    placeholder="Briefly describe your thesis topic..."
                    value={data.topic}
                    onChange={(e) => setData({ ...data, topic: e.target.value })}
                    rows={4}
                    data-testid="textarea-topic"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add the main questions your research will address.
                </p>
                {data.researchQuestions.map((question, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-muted-foreground mt-2 text-sm">{index + 1}.</span>
                    <Textarea
                      placeholder="Enter a research question..."
                      value={question}
                      onChange={(e) => updateResearchQuestion(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid={`textarea-research-question-${index}`}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addResearchQuestion}
                  className="w-full"
                  data-testid="button-add-question"
                >
                  Add Another Question
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define the objectives you aim to achieve with your thesis.
                </p>
                {data.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <CheckCircle className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                    <Textarea
                      placeholder="Enter an objective..."
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid={`textarea-objective-${index}`}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addObjective}
                  className="w-full"
                  data-testid="button-add-objective"
                >
                  Add Another Objective
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || completeMutation.isPending}
            data-testid="button-next"
          >
            {completeMutation.isPending ? "Setting up..." : step === totalSteps ? "Complete Setup" : "Continue"}
            {!completeMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
