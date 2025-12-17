
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Reference {
    id: string;
    title: string;
    authors: string[];
    year: number;
    matrixData: Record<string, string>;
}

interface Thesis {
    id: string;
    matrixColumns: string[];
}

export default function LiteratureMatrix() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [newColumnName, setNewColumnName] = useState("");
    const [editingCell, setEditingCell] = useState<{
        refId: string;
        column: string;
    } | null>(null);
    const [cellValue, setCellValue] = useState("");

    const { data: references = [] } = useQuery<Reference[]>({
        queryKey: ["/api/references"],
    });

    const { data: thesis } = useQuery<Thesis>({
        queryKey: ["/api/dashboard"],
        select: (data: any) => data.thesis, // Access nested thesis object
    });

    const updateThesisMutation = useMutation({
        mutationFn: async (data: { matrixColumns: string[] }) => {
            const res = await fetch("/api/settings/thesis", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update columns");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
            toast({ title: "Success", description: "Matrix columns updated" });
        },
    });

    const updateReferenceMutation = useMutation({
        mutationFn: async (data: { id: string; matrixData: Record<string, string> }) => {
            const res = await fetch(`/api/references/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matrixData: data.matrixData }),
            });
            if (!res.ok) throw new Error("Failed to update reference");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/references"] });
            setEditingCell(null);
            toast({ title: "Saved", description: "Cell updated" });
        },
    });

    const handleAddColumn = () => {
        if (!newColumnName.trim() || !thesis) return;
        const currentColumns = thesis.matrixColumns || [];
        if (currentColumns.includes(newColumnName)) {
            toast({ title: "Error", description: "Column already exists", variant: "destructive" });
            return;
        }
        updateThesisMutation.mutate({
            matrixColumns: [...currentColumns, newColumnName],
        });
        setNewColumnName("");
    };

    const handleRemoveColumn = (columnToRemove: string) => {
        if (!thesis) return;
        const currentColumns = thesis.matrixColumns || [];
        updateThesisMutation.mutate({
            matrixColumns: currentColumns.filter(c => c !== columnToRemove),
        });
    };

    const handleSaveCell = () => {
        if (!editingCell) return;
        const ref = references.find(r => r.id === editingCell.refId);
        if (!ref) return;

        const updatedMatrixData = { ...ref.matrixData, [editingCell.column]: cellValue };
        updateReferenceMutation.mutate({
            id: editingCell.refId,
            matrixData: updatedMatrixData,
        });
    };

    if (!thesis) return <div>Loading...</div>;

    const columns = thesis.matrixColumns || [];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Literature Matrix
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Synthesize your research by defining comparison criteria.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Comparison Column
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Column</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4">
                            <Input
                                placeholder="e.g., Methodology, Key Findings, Limitations"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                            />
                            <Button onClick={handleAddColumn}>Add</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Research Synthesis</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px] font-bold">Reference / Paper</TableHead>
                                {columns.map((col) => (
                                    <TableHead key={col} className="min-w-[200px] font-bold">
                                        <div className="flex items-center justify-between">
                                            {col}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleRemoveColumn(col)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {references.map((ref) => (
                                <TableRow key={ref.id}>
                                    <TableCell className="font-medium align-top">
                                        <div className="space-y-1">
                                            <div className="line-clamp-2" title={ref.title}>
                                                {ref.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {ref.authors?.[0]} ({ref.year})
                                            </div>
                                        </div>
                                    </TableCell>
                                    {columns.map((col) => {
                                        const isEditing = editingCell?.refId === ref.id && editingCell?.column === col;
                                        const value = ref.matrixData?.[col] || "";

                                        return (
                                            <TableCell key={col} className="align-top p-2">
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <Textarea
                                                            value={cellValue}
                                                            onChange={(e) => setCellValue(e.target.value)}
                                                            className="min-h-[100px] text-sm"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingCell(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button size="sm" onClick={handleSaveCell}>
                                                                <Save className="h-3 w-3 mr-1" /> Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="min-h-[60px] p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors text-sm whitespace-pre-wrap"
                                                        onClick={() => {
                                                            setEditingCell({ refId: ref.id, column: col });
                                                            setCellValue(value);
                                                        }}
                                                    >
                                                        {value || <span className="text-muted-foreground italic">Click to add notes...</span>}
                                                    </div>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                            {references.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1} className="text-center h-24 text-muted-foreground">
                                        No references found. Add references in the "References" tab to populate this matrix.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
