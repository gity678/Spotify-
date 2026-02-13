const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

// في Railway، يجب استخدام process.env.PORT لأن المنفذ يتغير تلقائياً
const PORT = process.env.PORT || 3000;

// واجهة التطبيق HTML مدمجة بالكامل لتسهيل الرفع والتشغيل
const htmlPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Railway Music Player</title>
    <style>
        :root { --spotify-green: #1DB954; --bg-black: #121212; }
        body { 
            background-color: #000; 
            color: white; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100vh;
        }
        .container { width: 90%; max-width: 400px; text-align: center; }
        h2 { color: var(--spotify-green); margin-bottom: 30px; }
        input { 
            width: 100%; 
            padding: 15px; 
            border-radius: 30px; 
            border: none; 
            background: #282828; 
            color: white; 
            font-size: 16px; 
            margin-bottom: 20px; 
            box-sizing: border-box;
            outline: none;
        }
        button { 
            background: var(--spotify-green); 
            color: black; 
            border: none; 
            padding: 15px 40px; 
            border-radius: 30px; 
            font-weight: bold; 
            font-size: 18px; 
            cursor: pointer; 
            transition: 0.3s;
        }
        button:active { transform: scale(0.95); }
        .player-card { 
            margin-top: 40px; 
            background: var(--bg-black); 
            padding: 20px; 
            border-radius: 20px; 
            width: 100%;
            border: 1px solid #333;
        }
        #status { font-size: 14px; color: #b3b3b3; margin-bottom: 15px; }
        audio { width: 100%; filter: invert(1); }
    </style>
</head>
<body>
    <div class="container">
        <h2>Music Stream 📱</h2>
        <input type="text" id="urlInput" placeholder="الصق رابط يوتيوب هنا...">
        <button onclick="playMusic()">تشغيل الآن</button>
        
        <div class="player-card">
            <div id="status">جاهز للاستماع</div>
            <audio id="audioPlayer" controls></audio>
        </div>
    </div>

    <script>
        function playMusic() {
            const url = document.getElementById('urlInput').value;
            const player = document.getElementById('audioPlayer');
            const status = document.getElementById('status');

            if(!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
                alert("يرجى إدخال رابط يوتيوب صحيح");
                return;
            }

            status.innerText = "جاري معالجة الرابط... 🔄";
            status.style.color = "#1DB954";
            
            // استدعاء مسار الاستريم من السيرفر
            player.src = "/stream?url=" + encodeURIComponent(url);
            player.play().then(() => {
                status.innerText = "يتم التشغيل الآن 🎶";
            }).catch(err => {
                status.innerText = "خطأ في التشغيل ❌";
                status.style.color = "red";
            });
        }
    </script>
</body>
</html>
`;

// المسار الرئيسي لعرض الواجهة
app.get('/', (req, res) => {
    res.send(htmlPage);
});

// مسار تحويل الفيديو إلى صوت مباشر (Streaming)
app.get('/stream', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).send("رابط مفقود");

        // إعلام المتصفح أن الملف عبارة عن صوت mpeg
        res.setHeader('Content-Type', 'audio/mpeg');
        
        // استخدام ytdl لجلب الصوت فقط
        ytdl(url, { 
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25 
        }).pipe(res);

    } catch (err) {
        console.error("خطأ في السيرفر:", err.message);
        res.status(500).send("حدث خطأ أثناء معالجة الصوت");
    }
});

// تشغيل السيرفر على المنفذ المحدد من Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ السيرفر يعمل على المنفذ: ${PORT}`);
});