import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Mail, GraduationCap, Share2, Copy, Loader2, Check, Link } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import type { User as UserType, Thesis, SharedAccess } from "@shared/schema";

interface SettingsData {
  user: UserType;
  thesis: Thesis | null;
  sharedAccess: SharedAccess[];
}

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("read");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studyLevel: "",
    field: "",
    thesisTitle: "",
    thesisTopic: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        firstName: data.user?.firstName || "",
        lastName: data.user?.lastName || "",
        studyLevel: data.user?.studyLevel || "",
        field: data.user?.field || "",
        thesisTitle: data.thesis?.title || "",
        thesisTopic: data.thesis?.topic || "",
      });
    }
  }, [data]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/settings/profile", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        studyLevel: formData.studyLevel,
        field: formData.field,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const updateThesisMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/settings/thesis", {
        title: formData.thesisTitle,
        topic: formData.thesisTopic,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Thesis updated", description: "Your thesis details have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update thesis.", variant: "destructive" });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/settings/share", {
        email: shareEmail,
        permissionLevel: sharePermission,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setIsShareDialogOpen(false);
      setShareEmail("");
      toast({ title: "Invitation sent", description: "Share link has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create share link.", variant: "destructive" });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/settings/share/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Access revoked", description: "The share link has been removed." });
    },
  });

  const copyShareLink = async (token: string) => {
    const link = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Share link copied to clipboard." });
  };

  const getInitials = () => {
    if (data?.user?.firstName && data?.user?.lastName) {
      return `${data.user.firstName[0]}${data.user.lastName[0]}`.toUpperCase();
    }
    if (data?.user?.email) {
      return data.user.email[0].toUpperCase();
    }
    return "U";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const user = data?.user;
  const thesis = data?.thesis;
  const sharedAccess = data?.sharedAccess || [];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your account and thesis preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : "Your Name"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Study Level</Label>
              <Select
                value={formData.studyLevel}
                onValueChange={(value) => setFormData({ ...formData, studyLevel: value })}
              >
                <SelectTrigger data-testid="select-study-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD / Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Select
                value={formData.field}
                onValueChange={(value) => setFormData({ ...formData, field: value })}
              >
                <SelectTrigger data-testid="select-field">
                  <SelectValue placeholder="Select field" />
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
          </div>

          <Button
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Thesis Details
          </CardTitle>
          <CardDescription>Your thesis information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thesisTitle">Thesis Title</Label>
            <Input
              id="thesisTitle"
              value={formData.thesisTitle}
              onChange={(e) => setFormData({ ...formData, thesisTitle: e.target.value })}
              data-testid="input-thesis-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thesisTopic">Topic Description</Label>
            <Textarea
              id="thesisTopic"
              value={formData.thesisTopic}
              onChange={(e) => setFormData({ ...formData, thesisTopic: e.target.value })}
              rows={3}
              data-testid="textarea-thesis-topic"
            />
          </div>
          <Button
            onClick={() => updateThesisMutation.mutate()}
            disabled={updateThesisMutation.isPending}
            data-testid="button-save-thesis"
          >
            {updateThesisMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Thesis Details
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Supervisor Access
            </CardTitle>
            <CardDescription>Share your thesis with supervisors</CardDescription>
          </div>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-share-thesis">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Your Thesis</DialogTitle>
                <DialogDescription>
                  Create a share link for your supervisor to access your thesis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="shareEmail">Supervisor Email</Label>
                  <Input
                    id="shareEmail"
                    type="email"
                    placeholder="supervisor@university.edu"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    data-testid="input-share-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select value={sharePermission} onValueChange={setSharePermission}>
                    <SelectTrigger data-testid="select-permission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="comment">Can Comment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => shareMutation.mutate()}
                  disabled={!shareEmail.trim() || shareMutation.isPending}
                  className="w-full"
                  data-testid="button-create-share"
                >
                  {shareMutation.isPending ? "Creating..." : "Create Share Link"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {sharedAccess.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No one has access to your thesis yet.</p>
              <p className="text-sm">Share it with your supervisor to get feedback.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedAccess.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`shared-access-${access.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{access.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {access.permissionLevel === "comment" ? "Can Comment" : "Read Only"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyShareLink(access.token)}
                      data-testid={`button-copy-link-${access.id}`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeAccessMutation.mutate(access.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-revoke-${access.id}`}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
