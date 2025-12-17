import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function MethodologyWizard() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [methodologyType, setMethodologyType] = useState<string>("");
    const [specificMethodology, setSpecificMethodology] = useState<string>("");

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/ai/generate-methodology", {
                methodologyType,
                specificMethodology,
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Methodology Generated",
                description: "Your chapter outline has been created.",
            });
            setLocation(`/editor/${data.chapterId}`);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to generate methodology.",
                variant: "destructive"
            });
        },
    });

    const specificOptions = {
        qualitative: [
            { id: "case_study", label: "Case Study", desc: "In-depth exploration of a specific entity or event." },
            { id: "phenomenology", label: "Phenomenology", desc: "Understanding the lived experience of participants." },
            { id: "grounded_theory", label: "Grounded Theory", desc: "Developing theory from data." },
            { id: "ethnography", label: "Ethnography", desc: "Studying a culture or group from within." },
        ],
        quantitative: [
            { id: "survey", label: "Survey Research", desc: "Gathering data from a sample to generalize." },
            { id: "experimental", label: "Experimental (RCT)", desc: "Testing cause-and-effect with control groups." },
            { id: "correlational", label: "Correlational", desc: "Examining relationships between variables." },
        ],
        mixed: [
            { id: "explanatory", label: "Explanatory Sequential", desc: "Quant first, then Qual to explain results." },
            { id: "exploratory", label: "Exploratory Sequential", desc: "Qual first, then Quant to generalize." },
            { id: "convergent", label: "Convergent Parallel", desc: "Quant and Qual at the same time." },
        ]
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Methodology Wizard</h1>
                <p className="text-muted-foreground">Select your research approach to auto-generate your methodology chapter.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
                ))}
            </div>

            <Card className="min-h-[400px] flex flex-col justify-center">
                <CardContent className="pt-6">
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 className="text-xl font-semibold mb-6">Step 1: Choose Core Approach</h2>
                            <RadioGroup value={methodologyType} onValueChange={setMethodologyType} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div onClick={() => setMethodologyType("qualitative")} className={`cursor-pointer border-2 rounded-lg p-4 hover:border-primary transition-all ${methodologyType === "qualitative" ? "border-primary bg-primary/5" : "border-muted"}`}>
                                    <Label htmlFor="qualitative" className="cursor-pointer font-semibold text-lg">Qualitative</Label>
                                    <p className="text-sm text-muted-foreground mt-2">Exploratory, focus on words, meanings, and experiences.</p>
                                    <RadioGroupItem value="qualitative" id="qualitative" className="sr-only" />
                                </div>
                                <div onClick={() => setMethodologyType("quantitative")} className={`cursor-pointer border-2 rounded-lg p-4 hover:border-primary transition-all ${methodologyType === "quantitative" ? "border-primary bg-primary/5" : "border-muted"}`}>
                                    <Label htmlFor="quantitative" className="cursor-pointer font-semibold text-lg">Quantitative</Label>
                                    <p className="text-sm text-muted-foreground mt-2">Confirmatory, focus on numbers, statistics, and generalization.</p>
                                    <RadioGroupItem value="quantitative" id="quantitative" className="sr-only" />
                                </div>
                                <div onClick={() => setMethodologyType("mixed")} className={`cursor-pointer border-2 rounded-lg p-4 hover:border-primary transition-all ${methodologyType === "mixed" ? "border-primary bg-primary/5" : "border-muted"}`}>
                                    <Label htmlFor="mixed" className="cursor-pointer font-semibold text-lg">Mixed Methods</Label>
                                    <p className="text-sm text-muted-foreground mt-2">Combining both to provide a more complete understanding.</p>
                                    <RadioGroupItem value="mixed" id="mixed" className="sr-only" />
                                </div>
                            </RadioGroup>
                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setStep(2)} disabled={!methodologyType}>
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center mb-6">
                                <Button variant="ghost" className="mr-4" onClick={() => setStep(1)}>&larr; Back</Button>
                                <h2 className="text-xl font-semibold">Step 2: Specific Design</h2>
                            </div>

                            <RadioGroup value={specificMethodology} onValueChange={setSpecificMethodology} className="space-y-4">
                                {/* @ts-ignore */}
                                {specificOptions[methodologyType]?.map((opt: any) => (
                                    <div key={opt.id} className="flex items-center space-x-3 space-y-0">
                                        <RadioGroupItem value={opt.id} id={opt.id} />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor={opt.id} className="font-medium text-base cursor-pointer">
                                                {opt.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {opt.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </RadioGroup>

                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setStep(3)} disabled={!specificMethodology}>
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-8">
                            <div className="mb-6 flex justify-center">
                                <div className="bg-primary/10 p-4 rounded-full">
                                    <Wand2 className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Ready to Generate</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                We will now generate a structured outline for your <strong>{methodologyType}</strong> thesis using the <strong>{specificMethodology}</strong> design.
                            </p>

                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button size="lg" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                                    {generateMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Generate Chapter
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
