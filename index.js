const express = require("express");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core");
const app = express();

const PORT = process.env.PORT || 3000;
const musicFolder = path.join(__dirname, "downloads");

if (!fs.existsSync(musicFolder)) {
    fs.mkdirSync(musicFolder);
}

app.use("/music", express.static(musicFolder));

// واجهة المستخدم (HTML)
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Music Cloud Storage</title>
        <style>
            body { font-family: -apple-system, sans-serif; background: #000; color: #fff; padding: 20px; text-align: center; }
            .card { background: #111; padding: 20px; border-radius: 15px; border: 1px solid #333; max-width: 400px; margin: auto; }
            input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #222; color: #fff; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background: #ff0000; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
            button:disabled { background: #555; }
            #status { margin: 15px 0; font-size: 14px; color: #aaa; }
            .song-item { background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 10px; text-align: right; }
            audio { width: 100%; margin-top: 10px; filter: invert(1); }
        </style>
    </head>
    <body>
        <div class="card">
            <h3>تخزين سحابي للموسيقى ☁️</h3>
            <input type="text" id="url" placeholder="ضع رابط يوتيوب هنا">
            <button id="btn" onclick="download()">حفظ في السيرفر</button>
            <div id="status">جاهز للتحميل</div>
        </div>
        <div id="list" style="max-width:400px; margin: 20px auto;"></div>

        <script>
            async function download() {
                const btn = document.getElementById('btn');
                const status = document.getElementById('status');
                const url = document.getElementById('url').value;

                if(!url) return alert("أدخل الرابط!");

                btn.disabled = true;
                status.innerText = "⏳ جاري تجاوز حماية يوتيوب والحفظ...";

                try {
                    const res = await fetch('/save?url=' + encodeURIComponent(url));
                    const data = await res.json();
                    if(data.success) {
                        status.innerText = "✅ تم الحفظ بنجاح!";
                        loadList();
                    } else {
                        status.innerText = "❌ خطأ: " + data.error;
                    }
                } catch (e) {
                    status.innerText = "❌ فشل الاتصال بالسيرفر";
                } finally {
                    btn.disabled = false;
                }
            }

            async function loadList() {
                const res = await fetch('/list-songs');
                const songs = await res.json();
                const listDiv = document.getElementById('list');
                listDiv.innerHTML = songs.map(s => \`
                    <div class="song-item">
                        <div style="font-size:14px; margin-bottom:5px;">\${s}</div>
                        <audio controls src="/music/\${encodeURIComponent(s)}"></audio>
                    </div>
                \`).join('');
            }
            window.onload = loadList;
        </script>
    </body>
    </html>
    `);
});

// مسار الحفظ المطور
app.get("/save", async (req, res) => {
    const videoURL = req.query.url;
    
    if (!ytdl.validateURL(videoURL)) {
        return res.json({ success: false, error: "رابط غير صالح" });
    }

    try {
        const info = await ytdl.getInfo(videoURL, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    'Cookie': '' // يمكنك إضافة كوكيز هنا لاحقاً إذا استمر الحظر
                }
            }
        });

        const title = info.videoDetails.title.replace(/[^\w\s\u0600-\u06FF]/gi, '').substring(0, 40);
        const fileName = `${title}.mp3`;
        const filePath = path.join(musicFolder, fileName);

        // تحميل الملف بجودة صوت فقط لتجنب حجم البيانات الكبير
        const stream = ytdl(videoURL, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        const fileStream = fs.createWriteStream(filePath);
        
        stream.pipe(fileStream);

        stream.on('error', (err) => {
            console.error(err);
            res.json({ success: false, error: "يوتيوب قطع الاتصال (حماية)" });
        });

        fileStream.on('finish', () => {
            res.json({ success: true, fileName });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "فشل الوصول للفيديو" });
    }
});

app.get("/list-songs", (req, res) => {
    const files = fs.readdirSync(musicFolder).filter(f => f.endsWith('.mp3'));
    res.json(files);
});

app.listen(PORT, () => console.log("Server on " + PORT));