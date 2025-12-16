import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DocumentsManager } from "@/components/DocumentsManager";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  BookOpen,
  Copy,
  Trash2,
  MoreVertical,
  Download,
  Search,
  ExternalLink,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Reference } from "@shared/schema";

interface ReferencesData {
  references: Reference[];
}

const citationStyles = [
  { value: "apa", label: "APA 7th Edition" },
  { value: "mla", label: "MLA 9th Edition" },
  { value: "chicago", label: "Chicago 17th Edition" },
];

export default function References() {
  const { toast } = useToast();
  const [isAddingReference, setIsAddingReference] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("apa");
  const [newReference, setNewReference] = useState({
    title: "",
    authors: "",
    year: "",
    source: "",
    url: "",
    doi: "",
    notes: "",
  });

  const { data, isLoading } = useQuery<ReferencesData>({
    queryKey: ["/api/references"],
  });

  const createReferenceMutation = useMutation({
    mutationFn: async (reference: typeof newReference) => {
      await apiRequest("POST", "/api/references", {
        ...reference,
        authors: reference.authors.split(",").map((a) => a.trim()),
        year: reference.year ? parseInt(reference.year) : null,
        citationStyle: selectedStyle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      setIsAddingReference(false);
      setNewReference({
        title: "",
        authors: "",
        year: "",
        source: "",
        url: "",
        doi: "",
        notes: "",
      });
      toast({ title: "Reference added", description: "Your reference has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add reference.", variant: "destructive" });
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/references/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
      toast({ title: "Reference deleted", description: "The reference has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reference.", variant: "destructive" });
    },
  });

  const handleAddReference = () => {
    if (newReference.title.trim()) {
      createReferenceMutation.mutate(newReference);
    }
  };

  const formatCitation = (reference: Reference, style: string) => {
    const authors = reference.authors?.join(", ") || "Unknown Author";
    const year = reference.year || "n.d.";
    const title = reference.title || "Untitled";
    const source = reference.source || "";

    switch (style) {
      case "apa":
        return `${authors} (${year}). ${title}. ${source}`;
      case "mla":
        return `${authors}. "${title}." ${source}, ${year}.`;
      case "chicago":
        return `${authors}. "${title}." ${source} (${year}).`;
      default:
        return `${authors} (${year}). ${title}. ${source}`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Citation copied to clipboard." });
  };

  const exportReferences = () => {
    const references = data?.references || [];
    const content = references
      .map((ref) => formatCitation(ref, selectedStyle))
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `references-${selectedStyle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "References exported successfully." });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const references = data?.references || [];
  const filteredReferences = references.filter(
    (ref) =>
      ref.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.authors?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-references-title">References & Knowledge</h1>
        <p className="text-muted-foreground">Manage your citations and AI source documents</p>
      </div>

      <Tabs defaultValue="citations" className="w-full">
        <TabsList>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          <TabsTrigger value="documents">Documents (AI Knowledge)</TabsTrigger>
        </TabsList>

        <TabsContent value="citations" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="w-[180px]" data-testid="select-citation-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {citationStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportReferences} data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddingReference} onOpenChange={setIsAddingReference}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-reference">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reference
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Reference</DialogTitle>
                    <DialogDescription>Add a new source to your reference list.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Article or book title"
                        value={newReference.title}
                        onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                        data-testid="input-reference-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authors">Authors</Label>
                      <Input
                        id="authors"
                        placeholder="Last, First; Last, First (separated by commas)"
                        value={newReference.authors}
                        onChange={(e) => setNewReference({ ...newReference, authors: e.target.value })}
                        data-testid="input-reference-authors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          placeholder="2024"
                          value={newReference.year}
                          onChange={(e) => setNewReference({ ...newReference, year: e.target.value })}
                          data-testid="input-reference-year"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Input
                          id="source"
                          placeholder="Journal, Book, Website"
                          value={newReference.source}
                          onChange={(e) => setNewReference({ ...newReference, source: e.target.value })}
                          data-testid="input-reference-source"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        placeholder="https://..."
                        value={newReference.url}
                        onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
                        data-testid="input-reference-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doi">DOI</Label>
                      <Input
                        id="doi"
                        placeholder="10.1000/xyz123"
                        value={newReference.doi}
                        onChange={(e) => setNewReference({ ...newReference, doi: e.target.value })}
                        data-testid="input-reference-doi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Personal notes about this source..."
                        value={newReference.notes}
                        onChange={(e) => setNewReference({ ...newReference, notes: e.target.value })}
                        rows={3}
                        data-testid="textarea-reference-notes"
                      />
                    </div>
                    <Button
                      onClick={handleAddReference}
                      disabled={!newReference.title.trim() || createReferenceMutation.isPending}
                      className="w-full"
                      data-testid="button-save-reference"
                    >
                      {createReferenceMutation.isPending ? "Adding..." : "Add Reference"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-references"
            />
          </div>

          {filteredReferences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No matches found" : "No references yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : "Add your first reference to start building your bibliography."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddingReference(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Reference
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReferences.map((reference) => (
                <Card key={reference.id} className="hover-elevate" data-testid={`card-reference-${reference.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{reference.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {reference.authors?.join(", ")} {reference.year && `(${reference.year})`}
                        </p>
                        <div className="p-3 bg-muted/50 rounded-lg text-sm font-mono">
                          {formatCitation(reference, selectedStyle)}
                        </div>
                        {reference.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {reference.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {reference.source && (
                            <Badge variant="secondary">{reference.source}</Badge>
                          )}
                          {reference.url && (
                            <Button variant="ghost" size="sm" className="h-7" asChild>
                              <a href={reference.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-reference-menu-${reference.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(formatCitation(reference, selectedStyle))}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Citation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteReferenceMutation.mutate(reference.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
