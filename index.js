const express = require("express");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core"); // المكتبة الجديدة المستقرة
const app = express();

const PORT = process.env.PORT || 3000;
const musicFolder = path.join(__dirname, "downloads");

if (!fs.existsSync(musicFolder)) {
    fs.mkdirSync(musicFolder);
}

app.use("/music", express.static(musicFolder));

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <title>مشغل الموسيقى الشخصي</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: sans-serif; text-align: center; background: #121212; color: #e0e0e0; padding: 15px; margin: 0; }
            .container { max-width: 500px; margin: auto; }
            input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #333; background: #1e1e1e; color: white; box-sizing: border-box; }
            button { width: 100%; padding: 12px; margin: 5px 0; cursor: pointer; border-radius: 8px; border: none; font-weight: bold; transition: 0.3s; }
            .btn-download { background: #1db954; color: white; }
            .btn-download:disabled { background: #555; }
            .status { color: #1db954; margin: 10px; font-size: 0.9em; min-height: 1.2em; }
            #list { margin-top: 20px; text-align: right; }
            .song-item { background: #1e1e1e; padding: 10px; margin: 10px 0; border-radius: 10px; border: 1px solid #333; }
            .song-name { display: block; margin-bottom: 8px; font-size: 0.9em; color: #bbb; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            audio { width: 100%; height: 35px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h3>تخزين الأغاني (توفير الإنترنت) 🎧</h3>
            <input type="text" id="url" placeholder="انسخ رابط الفيديو هنا...">
            <button id="dl-btn" class="btn-download" onclick="downloadToServer()">حفظ في السيرفر</button>
            <div id="status" class="status"></div>

            <div id="list-section">
                <h4 style="border-bottom: 1px solid #333; padding-bottom: 5px;">مكتبتك الصوتية:</h4>
                <div id="list">جاري تحميل القائمة...</div>
            </div>
        </div>

        <script>
            async function downloadToServer() {
                const urlInput = document.getElementById('url');
                const btn = document.getElementById('dl-btn');
                const status = document.getElementById('status');
                
                if(!urlInput.value) return alert("يرجى وضع الرابط");

                btn.disabled = true;
                status.innerText = "⏳ جاري المعالجة والحفظ... انتظر قليلاً";
                
                try {
                    const response = await fetch('/save?url=' + encodeURIComponent(urlInput.value));
                    const data = await response.json();
                    if(data.success) {
                        status.innerText = "✅ تم الحفظ بنجاح!";
                        urlInput.value = "";
                        loadPlaylist();
                    } else {
                        status.innerText = "❌ فشل: " + data.error;
                    }
                } catch (e) {
                    status.innerText = "❌ خطأ في السيرفر";
                } finally {
                    btn.disabled = false;
                }
            }

            async function loadPlaylist() {
                const response = await fetch('/list-songs');
                const songs = await response.json();
                const listDiv = document.getElementById('list');
                listDiv.innerHTML = songs.length === 0 ? "لا توجد أغاني محفوظة بعد." : "";
                
                songs.forEach(song => {
                    const div = document.createElement('div');
                    div.className = 'song-item';
                    div.innerHTML = \`
                        <span class="song-name">\${song}</span>
                        <audio controls preload="none">
                            <source src="/music/\${encodeURIComponent(song)}" type="audio/mpeg">
                        </audio>
                    \`;
                    listDiv.appendChild(div);
                });
            }

            window.onload = loadPlaylist;
        </script>
    </body>
    </html>
    `);
});

app.get("/save", async (req, res) => {
    const videoURL = req.query.url;
    if (!ytdl.validateURL(videoURL)) {
        return res.json({ success: false, error: "رابط يوتيوب غير صحيح" });
    }

    try {
        // الحصول على معلومات الفيديو مع تجاوز القيود
        const info = await ytdl.getInfo(videoURL);
        
        // تنظيف اسم الملف من الرموز الغريبة
        const cleanTitle = info.videoDetails.title.replace(/[^\w\s\u0600-\u06FF]/gi, '').trim();
        const fileName = `${cleanTitle || "audio_" + Date.now()}.mp3`;
        const filePath = path.join(musicFolder, fileName);

        const stream = ytdl(videoURL, { 
            filter: 'audioonly', 
            quality: 'highestaudio' 
        });

        const fileStream = fs.createWriteStream(filePath);
        stream.pipe(fileStream);

        fileStream.on('finish', () => {
            res.json({ success: true, fileName });
        });

        stream.on('error', (err) => {
            console.error(err);
            res.json({ success: false, error: "حدث خطأ أثناء البث" });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "يوتيوب يمنع الوصول حالياً، حاول لاحقاً" });
    }
});

app.get("/list-songs", (req, res) => {
    fs.readdir(musicFolder, (err, files) => {
        if (err) return res.json([]);
        const mp3Files = files.filter(file => file.endsWith('.mp3'));
        res.json(mp3Files);
    });
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});