const express = require("express");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();

const PORT = process.env.PORT || 3000;
const musicFolder = path.join(__dirname, "downloads");

// إنشاء مجلد التخزين إذا لم يكن موجوداً
if (!fs.existsSync(musicFolder)) fs.mkdirSync(musicFolder);

// إعداد multer لرفع الملفات
const upload = multer({ 
  dest: 'temp/',
  limits: { fileSize: 50 * 1024 * 1024 } // حد 50 ميجا
});

app.use("/offline-music", express.static(musicFolder));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>My Offline Music - Railway</title>
      <style>
        :root { --green: #1DB954; --black: #121212; --grey: #1e1e1e; }
        body { font-family: sans-serif; background: var(--black); color: white; margin: 0; padding-bottom: 120px; }
        .container { padding: 15px; }
        .box { background: var(--grey); padding: 15px; border-radius: 12px; margin-bottom: 20px; }
        input, select { width: 100%; padding: 12px; border-radius: 8px; border: none; background: #333; color: white; box-sizing: border-box; margin-bottom: 10px; }
        button { cursor: pointer; border-radius: 8px; border: none; font-weight: bold; padding: 10px; }
        .btn-green { background: var(--green); width: 100%; }
        .btn-blue { background: #007bff; color: white; }
        
        .item { display: flex; align-items: center; background: #252525; padding: 10px; margin: 8px 0; border-radius: 8px; }
        .item-info { flex: 1; margin-right: 10px; font-size: 14px; cursor: pointer; }
        .btn-download { background: #28a745; color: white; padding: 5px 10px; font-size: 11px; border-radius: 4px; text-decoration: none; margin-left: 5px; }

        .player-bar { position: fixed; bottom: 0; width: 100%; background: #000; padding: 15px; border-top: 1px solid #333; text-align: center; }
        audio { width: 100%; height: 35px; margin-top: 10px; }
        .offline-badge { font-size: 10px; background: var(--green); color: black; padding: 2px 5px; border-radius: 4px; margin-right: 5px; }
        .item-actions { display: flex; gap: 5px; }
        .upload-area { border: 2px dashed #444; padding: 20px; text-align: center; border-radius: 12px; margin-bottom: 20px; }
        .note { color: #ffaa00; font-size: 12px; margin-top: 5px; }
      </style>
    </head>
    <body>

      <div class="container">
        <h3>📱 مكتبتي الموسيقية (Railway + GitHub)</h3>
        
        <div class="box">
          <h4>🔍 البحث في يوتيوب</h4>
          <input type="text" id="q" placeholder="اسم الأغنية...">
          <button class="btn-green" onclick="search()">بحث</button>
        </div>

        <div class="box">
          <h4>📤 رفع ملف صوتي</h4>
          <div class="upload-area">
            <form id="uploadForm" enctype="multipart/form-data">
              <input type="file" name="audio" accept=".mp3,.m4a,.wav" required>
              <button type="submit" class="btn-blue" style="width:100%">رفع الملف</button>
            </form>
            <div class="note">ملفات MP3, M4A, WAV - حد أقصى 50 ميجا</div>
          </div>
        </div>

        <div id="status" style="font-size:12px; color: #aaa; margin-bottom:10px;"></div>
        
        <div id="results"></div>

        <hr style="border:0.5px solid #333;">
        <h4>💾 مكتبتي المحفوظة (${new Date().toLocaleDateString('ar-EG')})</h4>
        <div id="my-list"></div>
      </div>

      <div class="player-bar">
        <div id="now-playing" style="font-size:12px;">اختر أغنية</div>
        <audio id="main-player" controls autoplay></audio>
      </div>

      <script>
        // رفع الملفات
        document.getElementById('uploadForm').onsubmit = async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          document.getElementById('status').innerText = "⏳ جاري الرفع...";
          
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if(data.success) {
              document.getElementById('status').innerText = "✅ تم الرفع بنجاح!";
              loadOfflineFiles();
              e.target.reset();
            } else {
              document.getElementById('status').innerText = "❌ فشل الرفع";
            }
          } catch(e) {
            document.getElementById('status').innerText = "❌ خطأ في الاتصال";
          }
        };

        async function search() {
          const q = document.getElementById('q').value;
          if(!q) return;
          const resDiv = document.getElementById('results');
          document.getElementById('status').innerText = "⏳ جاري البحث...";
          
          try {
            const res = await fetch('/api/search?q=' + encodeURIComponent(q));
            const videos = await res.json();
            
            resDiv.innerHTML = videos.map(v => \`
              <div class="item">
                <div class="item-info" onclick="window.open('https://youtube.com/watch?v=\${v.videoId}', '_blank')">
                  🎵 \${v.title}
                </div>
                <div class="item-actions">
                  <span style="color:#888; font-size:11px;">⏱️ \${v.timestamp}</span>
                </div>
              </div>
            \`).join('');
            document.getElementById('status').innerText = "✅ انسخ الرابط وحمل الأغنية من موقع خارجي";
          } catch(e) {
            document.getElementById('status').innerText = "❌ خطأ في البحث";
          }
        }

        async function loadOfflineFiles() {
          try {
            const res = await fetch('/api/list');
            const files = await res.json();
            const listDiv = document.getElementById('my-list');
            
            if(files.length === 0) {
              listDiv.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">لا توجد أغاني محفوظة</div>';
              return;
            }
            
            listDiv.innerHTML = files.map(f => \`
              <div class="item">
                <div class="item-info" onclick="playOffline('\${f}')">
                  <span class="offline-badge">OFFLINE</span> \${f.replace(/\.[^/.]+$/, "")}
                </div>
                <div class="item-actions">
                  <a href="/offline-music/\${encodeURIComponent(f)}" download="\${f}" class="btn-download">⬇️</a>
                  <span onclick="playOffline('\${f}')" style="cursor: pointer;">▶️</span>
                </div>
              </div>
            \`).join('');
          } catch(e) {
            console.log(e);
          }
        }

        function playOffline(file) {
          const player = document.getElementById('main-player');
          player.src = "/offline-music/" + encodeURIComponent(file);
          document.getElementById('now-playing').innerText = "🔊 " + file.replace(/\.[^/.]+$/, "");
        }

        window.onload = loadOfflineFiles;
      </script>
    </body>
    </html>
  `);
});

// البحث فقط (بدون تحميل)
app.get("/api/search", async (req, res) => {
  try {
    const r = await yts(req.query.q);
    res.json(r.videos.slice(0, 5));
  } catch (e) {
    res.json([]);
  }
});

// رفع الملفات
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false });
    }
    
    const oldPath = req.file.path;
    const fileName = req.file.originalname;
    const newPath = path.join(musicFolder, fileName);
    
    // نقل الملف
    fs.renameSync(oldPath, newPath);
    
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

app.get("/api/list", (req, res) => {
  try {
    const files = fs.readdirSync(musicFolder)
      .filter(f => f.match(/\.(mp3|m4a|wav)$/i))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(musicFolder, a));
        const statB = fs.statSync(path.join(musicFolder, b));
        return statB.mtimeMs - statA.mtimeMs;
      });
    res.json(files);
  } catch (e) {
    res.json([]);
  }
});

app.listen(PORT, () => console.log("✅ Music Server Running on Railway"));