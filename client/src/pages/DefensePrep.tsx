import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flashcard } from "@shared/schema";
import { Loader2, BrainCircuit, RefreshCw, RotateCw, Check, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function DefensePrep() {
    const { toast } = useToast();
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>("all");

    const { data: flashcards, isLoading } = useQuery<Flashcard[]>({
        queryKey: ["/api/flashcards"],
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            setGenerating(true);
            const res = await apiRequest("POST", "/api/ai/generate-flashcards", {
                amount: 5,
                category: "general", // Can be enhanced to let user pick
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
            toast({ title: "Flashcards Generated", description: "New defense questions are ready!" });
            setGenerating(false);
            setCurrentIndex(0);
            setIsFlipped(false);
        },
        onError: (error) => {
            setGenerating(false);
            const errorMessage = error.message || "Failed to generate flashcards.";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        },
    });

    const masteryMutation = useMutation({
        mutationFn: async ({ id, level }: { id: string; level: number }) => {
            const res = await apiRequest("PATCH", `/api/flashcards/${id}`, { masteryLevel: level });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
            // Auto advance after rating if mastered
            if (currentIndex < (filteredCards?.length || 0) - 1) {
                // Optional: automatically go to next card
            }
        },
    });

    const filteredCards = flashcards?.filter(c => filterCategory === "all" || c.category === filterCategory);
    const currentCard = filteredCards?.[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % (filteredCards?.length || 1));
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + (filteredCards?.length || 1)) % (filteredCards?.length || 1));
    };

    const categories = ["all", ...Array.from(new Set(flashcards?.map(c => c.category) || []))];

    const masteryStats = flashcards?.reduce((acc, card) => {
        const level = card.masteryLevel || 0;
        if (level === 0) acc.new++;
        else if (level < 3) acc.learning++;
        else acc.mastered++;
        return acc;
    }, { new: 0, learning: 0, mastered: 0 });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Defense Prep</h1>
                    <p className="text-muted-foreground">Master your defense with AI-generated flashcards.</p>
                </div>
                <Button onClick={() => generateMutation.mutate()} disabled={generating}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Generate Questions
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">New Questions</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-500">{masteryStats?.new || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Learning</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-yellow-500">{masteryStats?.learning || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mastered</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-500">{masteryStats?.mastered || 0}</div></CardContent>
                </Card>
            </div>

            {/* Flashcard Interface */}
            {(filteredCards?.length || 0) > 0 ? (
                <div className="flex flex-col items-center space-y-8 py-8">
                    <div className="w-full max-w-xs flex justify-end">
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => (
                                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative w-full max-w-2xl aspect-video perspective-1000">
                        <motion.div
                            className="w-full h-full relative cursor-pointer transform-style-3d transition-transform duration-500"
                            initial={false}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            onClick={() => setIsFlipped(!isFlipped)}
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Front */}
                            <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-8 text-center border-2 border-primary/20 hover:border-primary/50 transition-colors">
                                <CardContent>
                                    <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">{currentCard?.category}</div>
                                    <h3 className="text-2xl font-semibold">{currentCard?.front}</h3>
                                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground flex items-center">
                                        <RotateCw className="w-3 h-3 mr-1" /> Click to flip
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Back */}
                            <Card
                                className="absolute w-full h-full backface-hidden flex items-center justify-center p-8 text-center bg-muted/50 border-2"
                                style={{ transform: "rotateY(180deg)" }}
                            >
                                <CardContent>
                                    <h4 className="text-sm font-semibold text-primary mb-4">Key Points / Answer</h4>
                                    <p className="text-lg leading-relaxed">{currentCard?.back}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-4 w-full max-w-2xl justify-between">
                        <Button variant="outline" onClick={handlePrev}>Previous</Button>

                        {isFlipped && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => { e.stopPropagation(); masteryMutation.mutate({ id: currentCard!.id, level: 1 }); handleNext(); }}
                                >
                                    Hard
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                                    onClick={(e) => { e.stopPropagation(); masteryMutation.mutate({ id: currentCard!.id, level: 3 }); handleNext(); }}
                                >
                                    Good
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-500 hover:text-green-600 hover:bg-green-50"
                                    onClick={(e) => { e.stopPropagation(); masteryMutation.mutate({ id: currentCard!.id, level: 5 }); handleNext(); }}
                                >
                                    Easy
                                </Button>
                            </div>
                        )}

                        <Button variant="outline" onClick={handleNext}>Next</Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Card {currentIndex + 1} of {filteredCards?.length}
                    </div>
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">No Flashcards Yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Generate your first set of defense prep questions based on your thesis content.
                        </p>
                        <Button onClick={() => generateMutation.mutate()} disabled={generating}>
                            {generating ? "Generating..." : "Generate Questions"}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
