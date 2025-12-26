exports.handler = async function (event, context) {
    const CORS_HEADERS = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    try {
        const query = 'India economy OR India business OR RBI OR GDP OR Inflation';
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

        console.log("Fetching news from:", url);

        // Using global fetch (available in Node 18+)
        const response = await fetch(url);
        if (!response.ok) {
            console.error("RSS fetch failed:", response.status, response.statusText);
            throw new Error(`Failed to fetch RSS from Google News: ${response.statusText}`);
        }

        const xml = await response.text();
        console.log("Received XML length:", xml.length);

        const items = [];
        const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

        for (const match of itemMatches) {
            const content = match[1];
            const rawTitle = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
            const link = (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
            const pubDateStr = (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";

            const titleParts = rawTitle.split(' - ');
            const source = titleParts.pop() || "Unknown Source";
            const title = titleParts.join(' - ') || rawTitle;

            const pubDate = new Date(pubDateStr);
            const now = new Date();
            const diffMs = now.getTime() - pubDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours <= 5) {
                items.push({
                    title: decodeHtml(title),
                    link,
                    date: formatTimeAgo(pubDate),
                    source: decodeHtml(source)
                });
            }
        }

        console.log(`Returning ${items.length} news items`);

        return {
            statusCode: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        };

    } catch (error) {
        console.error("Function error:", error);
        return {
            statusCode: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};

function decodeHtml(html) {
    return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "");
}

function formatTimeAgo(date) {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMin = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);

    if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffMin > 0) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    return 'Just now';
}
