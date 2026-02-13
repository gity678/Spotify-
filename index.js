const express = require('express');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = 12044;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/stream', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).send("الرابط مطلوب");

        res.setHeader('Content-Type', 'audio/mpeg');
        ytdl(url, { 
            filter: 'audioonly', 
            quality: 'highestaudio' 
        }).pipe(res);
    } catch (err) {
        res.status(500).send("خطأ في السيرفر");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
