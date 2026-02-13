const express = require("express");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const app = express();

const PORT = process.env.PORT || 3000;
const musicFolder = path.join(__dirname, "downloads");

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
if (!fs.existsSync(musicFolder)) {
    fs.mkdirSync(musicFolder);
}

// جعل مجلد التحميلات متاحاً للوصول عبر الرابط
app.use("/music", express.static(musicFolder));

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <title>مشغل الموسيقى الذكي</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: sans-serif; text-align: center; background: #1a1a1a; color: white; padding: 20px; }
            input { width: 80%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; border-radius: 5px; border: none; font-weight: bold; }
            .btn-download { background: #28a745; color: white; width: 80%; }
            .status { color: #ffc107; margin: 10px; font-size: 0.9em; }
            #playlist { margin-top: 20px; text-align: right; }
            .song-item { background: #333; padding: 15px; margin: 5px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
            audio { width: 100%; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h2>تخزين الأغاني على السيرفر 📂</h2>
        <input type="text" id="url" placeholder="ضع رابط يوتيوب هنا">
        <button class="btn-download" onclick="downloadToServer()">تحميل وحفظ في السيرفر</button>
        <div id="status" class="status"></div>

        <div id="playlist">
            <h3>الأغاني المحفوظة (لا تستهلك يوتيوب):</h3>
            <div id="list"></div>
        </div>

        <script>
            async function downloadToServer() {
                const url = document.getElementById('url').value;
                const status = document.getElementById('status');
                if(!url) return alert("ضع الرابط أولاً");

                status.innerText = "جاري التحميل والحفظ في السيرفر... قد يستغرق دقيقة";
                
                try {
                    const response = await fetch('/save?url=' + encodeURIComponent(url));
                    const data = await response.json();
                    if(data.success) {
                        status.innerText = "تم الحفظ بنجاح!";
                        loadPlaylist();
                    } else {
                        status.innerText = "خطأ في التحميل: " + data.error;
                    }
                } catch (e) {
                    status.innerText = "حدث خطأ في الاتصال بالسيرفر";
                }
            }

            async function loadPlaylist() {
                const response = await fetch('/list-songs');
                const songs = await response.json();
                const listDiv = document.getElementById('list');
                listDiv.innerHTML = '';
                
                songs.forEach(song => {
                    const div = document.createElement('div');
                    div.className = 'song-item';
                    div.innerHTML = \`
                        <div>
                            <span>\${song}</span>
                            <audio controls>
                                <source src="/music/\${song}" type="audio/mpeg">
                            </audio>
                        </div>
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

// مسار لتحميل الأغنية وحفظها كملف MP3
app.get("/save", async (req, res) => {
    const videoURL = req.query.url;
    try {
        const info = await ytdl.getInfo(videoURL);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 30);
        const fileName = `${title}.mp3`;
        const filePath = path.join(musicFolder, fileName);

        // التحميل والحفظ
        const stream = ytdl(videoURL, { filter: 'audioonly', quality: 'highestaudio' });
        const fileStream = fs.createWriteStream(filePath);

        stream.pipe(fileStream);

        fileStream.on('finish', () => {
            res.json({ success: true, fileName });
        });

        fileStream.on('error', (err) => {
            res.json({ success: false, error: err.message });
        });

    } catch (err) {
        res.status(500).json({ success: false, error: "فشل استخراج بيانات الفيديو" });
    }
});

// مسار لعرض قائمة الأغاني الموجودة في السيرفر
app.get("/list-songs", (req, res) => {
    fs.readdir(musicFolder, (err, files) => {
        if (err) return res.json([]);
        res.json(files.filter(file => file.endsWith('.mp3')));
    });
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});