

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    try {
        const query = 'India economy OR India business OR RBI OR GDP OR Inflation';
        // Google News RSS search URL
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch RSS from Google News");

        const xml = await response.text();

        // Basic regex-based RSS parsing (since we don't have an XML parser easily in Deno edge without external imports)
        const items: any[] = [];
        const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

        for (const match of itemMatches) {
            const content = match[1];

            // Extract title (usually includes source at the end like "Title - Source")
            const rawTitle = content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
            const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
            const pubDateStr = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

            // Google News Titles are often "Title - Source"
            const titleParts = rawTitle.split(' - ');
            const source = titleParts.pop() || "Unknown Source";
            const title = titleParts.join(' - ') || rawTitle;

            const pubDate = new Date(pubDateStr);
            const now = new Date();
            const diffMs = now.getTime() - pubDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            // Filter: Only last 5 hours
            if (diffHours <= 5) {
                items.push({
                    title: decodeHtml(title),
                    link,
                    date: formatTimeAgo(pubDate),
                    source: decodeHtml(source)
                });
            }
        }

        return new Response(JSON.stringify(items), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }
});

function decodeHtml(html: string) {
    return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function formatTimeAgo(date: Date) {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMin = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);

    if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffMin > 0) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    return 'Just now';
}
