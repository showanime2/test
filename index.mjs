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

app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
