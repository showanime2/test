import express from 'express';
import fetch from 'node-fetch'; // If you're using Node 18+, you can use global fetch instead.
import cors from 'cors';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', async (req, res) => {
    res.send("ok")
})

app.get('/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;

        if (!targetUrl) {
            return res.status(400).send("Missing 'url' query parameter.");
        }

        const response = await fetch(targetUrl, {
            headers: {
                'Origin': targetUrl,
                'Referer': targetUrl,
            },
        });

        if (!response.ok) {
            console.error(`Fetch failed with status: ${response.status}`);
            return res.status(response.status).send(`Failed to fetch ${targetUrl}`);
        }

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("mpegurl")) {
            let m3u8Text = await response.text();
            const proxyBase = `${req.protocol}://${req.get('host')}`;
            m3u8Text = rewriteM3U8(m3u8Text, proxyBase);
            res.setHeader("Content-Type", contentType);
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.send(m3u8Text);
        }

        res.setHeader("Content-Type", contentType || "application/octet-stream");
        res.setHeader("Access-Control-Allow-Origin", "*");

        response.body.pipe(res);
    } catch (error) {
        console.error("Unhandled error: ", error);
        res.status(500).send("Internal Server Error");
    }
});

function rewriteM3U8(m3u8Text, proxyBase) {
    return m3u8Text.replace(/https/g, `${proxyBase}/proxy?url=https`);
}

app.get('/filename.m3u8', (req, res) => {
    // Log all request headers
    console.log("🔍 Incoming Request Headers:");
    for (const [key, value] of Object.entries(req.headers)) {
        console.log(`${key}: ${value}`);
    }

    const playlist = `#EXTM3U
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1997668,RESOLUTION=1920x1080,FRAME-RATE=25.000,CODECS="avc1.640032,mp4a.40.2"
https://cors.aniwave.at/?url=https%3A%2F%2Frainstorm92.xyz%2F_v7%2F48a6745b613df615918be06204c59321b581c16e8e60886d2b52cdb615ec6f269e5ba9e2a887fa5c0c8afd853ab40735f14e858a6cc8ed697458f3c6e92f71b8b001d6d766501145d76d10ded128b56b1798a894b67eba47046f2687d230ee9bbeeaa18a3744695c81bba87d9b3b54fbfd539879ddd01c0726c6083f52c0db7d%2Findex-f1-v1-a1.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1057271,RESOLUTION=1280x720,FRAME-RATE=25.000,CODECS="avc1.64001f,mp4a.40.2"
https://cors.aniwave.at/?url=https%3A%2F%2Frainstorm92.xyz%2F_v7%2F48a6745b613df615918be06204c59321b581c16e8e60886d2b52cdb615ec6f269e5ba9e2a887fa5c0c8afd853ab40735f14e858a6cc8ed697458f3c6e92f71b8b001d6d766501145d76d10ded128b56b1798a894b67eba47046f2687d230ee9bbeeaa18a3744695c81bba87d9b3b54fbfd539879ddd01c0726c6083f52c0db7d%2Findex-f2-v1-a1.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=470165,RESOLUTION=640x360,FRAME-RATE=25.000,CODECS="avc1.64001e,mp4a.40.2"
https://cors.aniwave.at/?url=https%3A%2F%2Frainstorm92.xyz%2F_v7%2F48a6745b613df615918be06204c59321b581c16e8e60886d2b52cdb615ec6f269e5ba9e2a887fa5c0c8afd853ab40735f14e858a6cc8ed697458f3c6e92f71b8b001d6d766501145d76d10ded128b56b1798a894b67eba47046f2687d230ee9bbeeaa18a3744695c81bba87d9b3b54fbfd539879ddd01c0726c6083f52c0db7d%2Findex-f3-v1-a1.m3u8`;

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(playlist);
});


app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
