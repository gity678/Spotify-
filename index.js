const express = require("express");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3000;
const musicFolder = path.join(__dirname, "downloads");

// إنشاء مجلد التخزين إذا لم يكن موجوداً
if (!fs.existsSync(musicFolder)) fs.mkdirSync(musicFolder);

app.use("/offline-music", express.static(musicFolder));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>My Offline Music</title>
      <style>
        :root { --green: #1DB954; --black: #121212; --grey: #1e1e1e; }
        body { font-family: sans-serif; background: var(--black); color: white; margin: 0; padding-bottom: 120px; }
        .container { padding: 15px; }
        .box { background: var(--grey); padding: 15px; border-radius: 12px; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; border-radius: 8px; border: none; background: #333; color: white; box-sizing: border-box; }
        button { cursor: pointer; border-radius: 8px; border: none; font-weight: bold; margin-top: 10px; padding: 10px; }
        .btn-search { background: var(--green); width: 100%; }
        
        .item { display: flex; align-items: center; background: #252525; padding: 10px; margin: 8px 0; border-radius: 8px; }
        .item-info { flex: 1; margin-right: 10px; font-size: 14px; }
        .btn-save { background: #007bff; color: white; padding: 5px 10px; font-size: 11px; margin-left: 5px; }
        .btn-download { background: #28a745; color: white; padding: 5px 10px; font-size: 11px; border-radius: 4px; text-decoration: none; margin-left: 5px; }

        .player-bar { position: fixed; bottom: 0; width: 100%; background: #000; padding: 15px; border-top: 1px solid #333; text-align: center; }
        audio { width: 100%; height: 35px; margin-top: 10px; }
        .offline-badge { font-size: 10px; background: var(--green); color: black; padding: 2px 5px; border-radius: 4px; margin-right: 5px; }
        
        .item-actions { display: flex; gap: 5px; }
      </style>
    </head>
    <body>

      <div class="container">
        <h3>البحث والتحفظ للسيرفر 📂</h3>
        <div class="box">
          <input type="text" id="q" placeholder="اسم الأغنية...">
          <button class="btn-search" onclick="search()">بحث</button>
        </div>

        <div id="status" style="font-size:12px; color: #aaa; margin-bottom:10px;"></div>
        <div id="results"></div>

        <hr style="border:0.5px solid #333;">
        <h4>مكتبتي المحفوظة (بدون إنترنت) 💾</h4>
        <div id="my-list"></div>
      </div>

      <div class="player-bar">
        <div id="now-playing" style="font-size:12px;">اختر أغنية</div>
        <audio id="main-player" controls autoplay></audio>
      </div>

      <script>
        async function search() {
          const q = document.getElementById('q').value;
          if(!q) return;
          const resDiv = document.getElementById('results');
          document.getElementById('status').innerText = "⏳ جاري البحث...";
          
          const res = await fetch('/api/search?q=' + encodeURIComponent(q));
          const videos = await res.json();
          
          resDiv.innerHTML = videos.map(v => \`
            <div class="item">
              <div class="item-info">\${v.title}</div>
              <div class="item-actions">
                <button class="btn-save" onclick="saveToServer('\${v.videoId}', '\${v.title.replace(/'/g,"")}')">📥 حفظ</button>
              </div>
            </div>
          \`).join('');
          document.getElementById('status').innerText = "";
        }

        async function saveToServer(id, title) {
          document.getElementById('status').innerText = "⏳ جاري التحميل والحفظ للسيرفر... يرجى الانتظار";
          try {
            const res = await fetch(\`/api/download?id=\${id}&title=\${encodeURIComponent(title)}\`);
            const data = await res.json();
            if(data.success) {
              document.getElementById('status').innerText = "✅ تم الحفظ بنجاح!";
              loadOfflineFiles();
            } else {
              alert("فشل التحميل: " + data.error);
            }
          } catch(e) { alert("خطأ في الاتصال"); }
        }

        async function loadOfflineFiles() {
          const res = await fetch('/api/list');
          const files = await res.json();
          const listDiv = document.getElementById('my-list');
          listDiv.innerHTML = files.map(f => \`
            <div class="item">
              <div class="item-info" onclick="playOffline('\${f}')">
                <span class="offline-badge">OFFLINE</span> \${f}
              </div>
              <div class="item-actions">
                <a href="/offline-music/\${encodeURIComponent(f)}" download="\${f}" class="btn-download">⬇️ تحميل</a>
                <span onclick="playOffline('\${f}')" style="cursor: pointer;">▶️</span>
              </div>
            </div>
          \`).join('');
        }

        function playOffline(file) {
          const player = document.getElementById('main-player');
          player.src = "/offline-music/" + encodeURIComponent(file);
          document.getElementById('now-playing').innerText = "🔊 " + file;
        }

        window.onload = loadOfflineFiles;
      </script>
    </body>
    </html>
  `);
});

// البحث
app.get("/api/search", async (req, res) => {
  const r = await yts(req.query.q);
  res.json(r.videos.slice(0, 5));
});

// التحميل والحفظ للسيرفر
app.get("/api/download", async (req, res) => {
  const { id, title } = req.query;
  const fileName = `${title.replace(/[^\w\s\u0600-\u06FF]/gi, '')}.mp3`;
  const filePath = path.join(musicFolder, fileName);

  try {
    // محاولة التحميل من مصدر بديل
    const downloadUrl = `https://api.vevioz.com/api/button/mp3/${id}`;
    
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => res.json({ success: true }));
    writer.on('error', (err) => res.json({ success: false, error: err.message }));

  } catch (err) {
    res.json({ success: false, error: "يوتيوب يمنع التحميل المباشر حالياً" });
  }
});

app.get("/api/list", (req, res) => {
  const files = fs.readdirSync(musicFolder).filter(f => f.endsWith('.mp3'));
  res.json(files);
});

app.listen(PORT, () => console.log("Offline Music Server Running..."));