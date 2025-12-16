import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, FileText, Upload, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function DocumentsManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    const { data: documents, isLoading } = useQuery({
        queryKey: ["/api/documents"],
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            // Use fetch directly because apiRequest sends JSON by default
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
            toast({ title: "File uploaded" });
            setUploading(false);
        },
        onError: () => {
            toast({ title: "Upload failed", variant: "destructive" });
            setUploading(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/documents/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
            toast({ title: "Document deleted" });
        },
        onError: () => {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    if (isLoading) return <div>Loading documents...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative">
                            <Input
                                type="file"
                                accept=".pdf,.txt"
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                            <Button asChild disabled={uploading}>
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                    Upload Document
                                </label>
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Upload PDFs or text files to build your AI assistant's knowledge base.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents?.map((doc: any) => (
                    <Card key={doc.id} className="hover-elevate">
                        <CardContent className="p-4 flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 overflow-hidden">
                                <div className="bg-primary/10 p-2 rounded">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-medium truncate" title={doc.title}>{doc.title}</h3>
                                    <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(doc.id)}
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {documents?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No documents uploaded yet.
                    </div>
                )}
            </div>
        </div>
    );
}
