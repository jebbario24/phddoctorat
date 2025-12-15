import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  FileText,
  MessageSquare,
  Target,
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "AI Writing Assistant",
      description: "Generate outlines, rewrite paragraphs, and get suggestions in academic tone.",
    },
    {
      icon: Calendar,
      title: "Thesis Planner",
      description: "Visual timeline with milestones from proposal to submission.",
    },
    {
      icon: FileText,
      title: "Reference Manager",
      description: "Organize citations in APA, MLA, or Chicago style with easy export.",
    },
    {
      icon: Users,
      title: "Supervisor Collaboration",
      description: "Share your thesis and receive inline comments from advisors.",
    },
    {
      icon: Target,
      title: "Progress Tracking",
      description: "Monitor completion percentages and stay on top of deadlines.",
    },
    {
      icon: CheckCircle,
      title: "Task Management",
      description: "Kanban board to organize work by chapter and priority.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Set Up Your Thesis",
      description: "Define your topic, research questions, and objectives through our guided wizard.",
    },
    {
      number: "02",
      title: "Plan Your Timeline",
      description: "Create milestones and deadlines with our visual planner.",
    },
    {
      number: "03",
      title: "Write with AI",
      description: "Use AI assistance to draft, refine, and structure your chapters.",
    },
    {
      number: "04",
      title: "Collaborate & Submit",
      description: "Get feedback from supervisors and track your progress to completion.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2" data-testid="logo-thesisflow">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">ThesisFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild data-testid="link-login">
              <a href="/api/login">Log In</a>
            </Button>
            <Button asChild data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Powered Academic Writing</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
                Your Thesis Journey,{" "}
                <span className="text-primary">Simplified</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The all-in-one platform for PhD and Master's students. Plan your milestones, 
                write with AI assistance, and collaborate with supervisors—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2" asChild data-testid="button-start-free">
                  <a href="/api/login">
                    Start Your Thesis Free
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Trusted by students at 100+ universities worldwide
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From planning to submission, ThesisFlow provides the tools academic writers need.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes and stay organized throughout your thesis journey.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-border" />
                  )}
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-semibold mb-4">
                  Focus on Writing, Not Managing
                </h2>
                <p className="text-muted-foreground mb-6">
                  Thesis writing is hard enough. Don't let scattered files, missed deadlines, 
                  and isolation slow you down. ThesisFlow centralizes everything so you can 
                  focus on what matters most—your research.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Centralized workspace for all thesis materials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Visual timeline keeps you on track</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Direct communication with supervisors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>AI that understands academic writing</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Thesis Progress</span>
                      <span className="text-sm text-muted-foreground">68%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[68%] bg-primary rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">5/8</div>
                        <div className="text-sm text-muted-foreground">Chapters</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">42,350</div>
                        <div className="text-sm text-muted-foreground">Words</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-semibold mb-4">
              Ready to Transform Your Thesis Experience?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of graduate students who are writing smarter, not harder. 
              Start your free account today.
            </p>
            <Button size="lg" className="gap-2" asChild data-testid="button-cta-final">
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="font-semibold">ThesisFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered thesis management for academic excellence.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Documentation</li>
                <li>Blog</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ThesisFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
