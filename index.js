const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = 12044;

// واجهة التطبيق مدمجة
const htmlPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Player</title>
    <style>
        body { background: #000; color: #fff; font-family: sans-serif; text-align: center; padding: 20px; }
        input { width: 80%; padding: 15px; border-radius: 25px; border: 1px solid #333; background: #1a1a1a; color: white; margin-bottom: 15px; }
        button { background: #1DB954; color: black; border: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; cursor: pointer; }
        .player-box { margin-top: 40px; background: #111; padding: 20px; border-radius: 20px; border: 1px dashed #1DB954; }
        audio { width: 100%; filter: invert(1); margin-top: 10px; }
        .loader { display: none; color: #1DB954; }
    </style>
</head>
<body>
    <h2>مشغل الموسيقى 🎵</h2>
    <input type="text" id="url" placeholder="الصق رابط يوتيوب هنا...">
    <br>
    <button onclick="startPlay()">تشغيل</button>
    
    <div class="player-box">
        <div id="status">جاهز للاستماع</div>
        <audio id="audio" controls></audio>
    </div>

    <script>
        function startPlay() {
            const url = document.getElementById('url').value;
            const audio = document.getElementById('audio');
            const status = document.getElementById('status');
            
            if(!url) return alert("الرجاء وضع رابط!");

            status.innerText = "جاري الاتصال بالسيرفر... ⏳";
            audio.src = "/stream?url=" + encodeURIComponent(url);
            audio.play().then(() => {
                status.innerText = "يعمل الآن ✅";
            }).catch(e => {
                status.innerText = "فشل التشغيل (تأكد من الرابط) ❌";
            });
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlPage));

// محرك تحويل الفيديو لصوت
app.get('/stream', async (req, res) => {
    try {
        const videoURL = req.query.url;
        if (!videoURL) return res.status(400).send("No URL");

        res.setHeader('Content-Type', 'audio/mpeg');
        
        ytdl(videoURL, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }).pipe(res);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});