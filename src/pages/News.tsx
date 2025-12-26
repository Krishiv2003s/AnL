import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SidebarAd } from "@/components/AdBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, Newspaper, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsItem {
    title: string;
    link: string;
    date: string;
    source: string;
}

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use Netlify Function instead of Supabase Edge Function
            const response = await fetch('/.netlify/functions/get-news');

            if (!response.ok) throw new Error("Failed to fetch news. Deployment might still be in progress.");

            const data = await response.json();
            setNews(data || []);
        } catch (err: any) {
            console.error("News error:", err);
            setError("Netlify News Error: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        // Auto refresh every 30 minutes
        const interval = setInterval(fetchNews, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background grid-bg relative">
            <Header />
            <SidebarAd side="left" />
            <SidebarAd side="right" />

            <main className="container pt-24 pb-12 relative z-0">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                <Newspaper className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                Economic News
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-2">
                                Latest Indian business & economic updates from the last 5 hours.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => fetchNews()} disabled={loading} className="w-full sm:w-auto">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                        </Button>
                    </div>

                    {loading && news.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Fetching latest headlines...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-destructive/20 bg-destructive/5">
                            <CardContent className="py-10 text-center">
                                <p className="text-destructive font-medium mb-4">Error: {error}</p>
                                <Button onClick={() => fetchNews()}>Try Again</Button>
                            </CardContent>
                        </Card>
                    ) : news.length === 0 ? (
                        <div className="text-center py-20 border border-dashed rounded-xl bg-muted/30">
                            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No recent news</h3>
                            <p className="text-muted-foreground">No Indian economic news found in the last 5 hours. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {news.map((item, index) => (
                                <Card key={index} className="hover:border-primary/30 transition-colors">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group"
                                            >
                                                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                                                    {item.title}
                                                </CardTitle>
                                            </a>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="font-medium text-primary/80">{item.source}</span>
                                            <span>•</span>
                                            <span>{item.date}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 p-4 rounded-lg bg-muted/50 border border-border text-center text-xs text-muted-foreground">
                        <p className="mb-1">News headlines powered by Google News. Clicking a headline opens the original publisher.</p>
                        <p>© {new Date().getFullYear()} AnL Financial Terminal. All news rights belong to their respective publishers.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
