
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Book, FlaskConical, Users, Lightbulb, Send } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface JournalEntry {
    id: string;
    content: string;
    type: "thought" | "meeting" | "experiment" | "reading";
    tags: string[];
    date: string;
}

const EntryIcon = ({ type }: { type: string }) => {
    switch (type) {
        case "meeting": return <Users className="h-4 w-4" />;
        case "experiment": return <FlaskConical className="h-4 w-4" />;
        case "reading": return <Book className="h-4 w-4" />;
        default: return <Lightbulb className="h-4 w-4" />;
    }
};

const EntryColor = (type: string) => {
    switch (type) {
        case "meeting": return "bg-blue-100 text-blue-700 border-blue-200";
        case "experiment": return "bg-green-100 text-green-700 border-green-200";
        case "reading": return "bg-purple-100 text-purple-700 border-purple-200";
        default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
};

export default function ResearchJournal() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [content, setContent] = useState("");
    const [type, setType] = useState<string>("thought");

    const { data: entries = [] } = useQuery<JournalEntry[]>({
        queryKey: ["/api/journal"],
    });

    const createMutation = useMutation({
        mutationFn: async (newEntry: any) => {
            const res = await fetch("/api/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEntry),
            });
            if (!res.ok) throw new Error("Failed to create entry");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
            setContent("");
            toast({ title: "Entry saved", description: "Your thought has been recorded." });
        },
    });

    const handleSubmit = () => {
        if (!content.trim()) return;
        createMutation.mutate({ content, type, date: new Date().toISOString() });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {t.journalTitle}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t.journalDesc}
                </p>
            </div>

            <Card className="border-2 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">{t.newEntry}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder={t.entryPlaceholder}
                        className="min-h-[120px] resize-none text-base"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t.entryType} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="thought">💭 {t.typeThought}</SelectItem>
                                <SelectItem value="meeting">👥 {t.typeMeeting}</SelectItem>
                                <SelectItem value="experiment">🧪 {t.typeExperiment}</SelectItem>
                                <SelectItem value="reading">📚 {t.typeReading}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSubmit} disabled={!content.trim() || createMutation.isPending}>
                            <Send className="h-4 w-4 mr-2" />
                            {t.logEntry}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold pl-1">{t.timeline}</h2>
                <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-3.5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-border before:to-transparent">
                    {entries.map((entry) => (
                        <div key={entry.id} className="relative group">
                            <div className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full border shadow-sm ${EntryColor(entry.type)}`}>
                                <EntryIcon type={entry.type} />
                            </div>
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between items-start text-sm text-muted-foreground">
                                        <span className="font-medium bg-muted px-2 py-0.5 rounded text-foreground capitalize">
                                            {entry.type}
                                        </span>
                                        <span>{format(new Date(entry.date), "PPP p")}</span>
                                    </div>
                                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                        {entry.content}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            {t.noEntries}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
