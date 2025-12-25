import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Monitor, Apple, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function DownloadPage() {
    const [platform, setPlatform] = useState<"windows" | "mac" | "linux" | "unknown">("unknown");

    const GITHUB_REPO = "jebbario24/phddoctorat";
    const VERSION = "1.0.0";
    const BASE_URL = `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}`;

    const DOWNLOAD_LINKS = {
        windows: `${BASE_URL}/PhD.Thesis.Buddy.Setup.${VERSION}.exe`,
        mac: `${BASE_URL}/PhD.Thesis.Buddy-${VERSION}.dmg`,
        linux: `${BASE_URL}/PhD.Thesis.Buddy-${VERSION}.AppImage`
    };

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("win")) setPlatform("windows");
        else if (userAgent.includes("mac")) setPlatform("mac");
        else if (userAgent.includes("linux")) setPlatform("linux");
    }, []);

    const openLink = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/">
                        <a className="font-bold text-xl flex items-center gap-2">
                            <span className="text-primary">🎓</span> PhD Thesis Buddy
                        </a>
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/auth">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container py-12 flex flex-col items-center">
                <div className="text-center max-w-2xl mb-12">
                    <h1 className="text-4xl font-bold mb-4">Download User App for Desktop</h1>
                    <p className="text-xl text-muted-foreground">
                        Get the full power of PhD Thesis Buddy on your computer. Offline access, local processing, and better performance.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Latest Version: v{VERSION}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full">
                    {/* Windows */}
                    <Card className={`relative ${platform === "windows" ? "border-primary shadow-lg scale-105" : ""}`}>
                        {platform === "windows" && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                Recommended for you
                            </div>
                        )}
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <Monitor className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle>Windows</CardTitle>
                            <CardDescription>Windows 10 or later (64-bit)</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button className="w-full gap-2" size="lg" onClick={() => openLink(DOWNLOAD_LINKS.windows)}>
                                <Download className="w-4 h-4" />
                                Download for Windows
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">.exe installer • 150MB</p>
                        </CardContent>
                    </Card>

                    {/* macOS */}
                    <Card className={`relative ${platform === "mac" ? "border-primary shadow-lg scale-105" : ""}`}>
                        {platform === "mac" && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                Recommended for you
                            </div>
                        )}
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <Apple className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle>macOS</CardTitle>
                            <CardDescription>macOS 11.0 or later</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button className="w-full gap-2" size="lg" variant="outline" onClick={() => openLink(DOWNLOAD_LINKS.mac)}>
                                <Download className="w-4 h-4" />
                                Download for Mac
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">.dmg installer • Apple Silicon & Intel</p>
                        </CardContent>
                    </Card>

                    {/* Linux */}
                    <Card className={`relative ${platform === "linux" ? "border-primary shadow-lg scale-105" : ""}`}>
                        {platform === "linux" && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                Recommended for you
                            </div>
                        )}
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <Monitor className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle>Linux</CardTitle>
                            <CardDescription>Ubuntu, Debian, Fedora</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button className="w-full gap-2" size="lg" variant="outline" onClick={() => openLink(DOWNLOAD_LINKS.linux)}>
                                <Download className="w-4 h-4" />
                                Download for Linux
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">.AppImage • Universal</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-16 text-center max-w-2xl">
                    <h2 className="text-2xl font-bold mb-4">Why use the Desktop App?</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 p-2 rounded h-fit">
                                <Monitor className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Local Database</h3>
                                <p className="text-sm text-muted-foreground">Your research data stays on your machine. No internet connection required for basic features.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-primary/10 p-2 rounded h-fit">
                                <Smartphone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Better Performance</h3>
                                <p className="text-sm text-muted-foreground">Native system integration for smoother experience and faster processing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
