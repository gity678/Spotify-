const express = require("express");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
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
        .item-info { flex: 1; margin-right: 10px; font-size: 14px; cursor: pointer; }
        .btn-save { background: #007bff; color: white; padding: 5px 10px; font-size: 11px; margin-left: 5px; }
        .btn-download { background: #28a745; color: white; padding: 5px 10px; font-size: 11px; border-radius: 4px; text-decoration: none; margin-left: 5px; }

        .player-bar { position: fixed; bottom: 0; width: 100%; background: #000; padding: 15px; border-top: 1px solid #333; text-align: center; }
        audio { width: 100%; height: 35px; margin-top: 10px; }
        .offline-badge { font-size: 10px; background: var(--green); color: black; padding: 2px 5px; border-radius: 4px; margin-right: 5px; }
        
        .item-actions { display: flex; gap: 5px; }
        .loading { opacity: 0.5; pointer-events: none; }
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
          
          try {
            const res = await fetch('/api/search?q=' + encodeURIComponent(q));
            const videos = await res.json();
            
            if(videos.length === 0) {
              document.getElementById('status').innerText = "❌ لا توجد نتائج";
              return;
            }
            
            resDiv.innerHTML = videos.map(v => \`
              <div class="item">
                <div class="item-info">\${v.title}</div>
                <div class="item-actions">
                  <button class="btn-save" onclick="saveToServer('\${v.videoId}', '\${v.title.replace(/'/g, "\\\\'")}')">📥 حفظ</button>
                </div>
              </div>
            \`).join('');
            document.getElementById('status').innerText = "";
          } catch(e) {
            document.getElementById('status').innerText = "❌ خطأ في البحث";
          }
        }

        async function saveToServer(id, title) {
          const btn = event.target;
          btn.disabled = true;
          btn.innerText = "⏳ جاري...";
          
          document.getElementById('status').innerText = "⏳ جاري التحميل والحفظ للسيرفر... يرجى الانتظار";
          try {
            const res = await fetch(\`/api/download?id=\${id}&title=\${encodeURIComponent(title)}\`);
            const data = await res.json();
            if(data.success) {
              document.getElementById('status').innerText = "✅ تم الحفظ بنجاح!";
              loadOfflineFiles();
            } else {
              document.getElementById('status').innerText = "❌ فشل التحميل: " + data.error;
            }
          } catch(e) { 
            document.getElementById('status').innerText = "❌ خطأ في الاتصال";
          }
          btn.disabled = false;
          btn.innerText = "📥 حفظ";
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
                  <span class="offline-badge">OFFLINE</span> \${f.replace('.mp3', '')}
                </div>
                <div class="item-actions">
                  <a href="/offline-music/\${encodeURIComponent(f)}" download="\${f}" class="btn-download">⬇️ تحميل</a>
                  <span onclick="playOffline('\${f}')" style="cursor: pointer;">▶️</span>
                </div>
              </div>
            \`).join('');
          } catch(e) {
            console.log("خطأ في تحميل القائمة");
          }
        }

        function playOffline(file) {
          const player = document.getElementById('main-player');
          player.src = "/offline-music/" + encodeURIComponent(file);
          document.getElementById('now-playing').innerText = "🔊 " + file.replace('.mp3', '');
        }

        window.onload = loadOfflineFiles;
      </script>
    </body>
    </html>
  `);
});

// البحث
app.get("/api/search", async (req, res) => {
  try {
    const r = await yts(req.query.q);
    res.json(r.videos.slice(0, 5));
  } catch (e) {
    res.json([]);
  }
});

// التحميل والحفظ للسيرفر - طرق متعددة
app.get("/api/download", async (req, res) => {
  const { id, title } = req.query;
  const safeTitle = title.replace(/[^\w\s\u0600-\u06FF]/gi, '').substring(0, 50);
  const fileName = `${safeTitle}.mp3`;
  const filePath = path.join(musicFolder, fileName);

  // لو الملف موجود مسبقاً
  if (fs.existsSync(filePath)) {
    return res.json({ success: true, message: "الملف موجود مسبقاً" });
  }

  // قائمة بمصادر التحميل (للتجربة)
  const downloadSources = [
    `https://api.vevioz.com/api/button/mp3/${id}`,
    `https://p.oceansaver.in/ajax/download.php?format=mp3&url=https://www.youtube.com/watch?v=${id}`,
    `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${id}&f=mp3`
  ];

  // تجربة كل مصدر
  for (const source of downloadSources) {
    try {
      console.log(`محاولة التحميل من: ${source}`);
      
      const response = await axios({
        method: 'get',
        url: source,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // التحقق من أن المحتوى هو ملف صوتي
      const contentType = response.headers['content-type'];
      if (contentType && (contentType.includes('audio') || contentType.includes('octet-stream'))) {
        const writer = fs.createWriteStream(filePath);
        
        await new Promise((resolve, reject) => {
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // التحقق من حجم الملف
        const stats = fs.statSync(filePath);
        if (stats.size > 10000) { // أكبر من 10KB
          console.log(`✅ تم التحميل بنجاح من ${source}`);
          return res.json({ success: true });
        } else {
          fs.unlinkSync(filePath); // حذف الملف الصغير جداً
        }
      }
    } catch (e) {
      console.log(`❌ فشل التحميل من ${source}: ${e.message}`);
      // استمر في تجربة المصادر الأخرى
    }
  }

  // إذا فشلت جميع المحاولات
  res.json({ success: false, error: "تعذر تحميل الأغنية من جميع المصادر" });
});

app.get("/api/list", (req, res) => {
  try {
    const files = fs.readdirSync(musicFolder)
      .filter(f => f.endsWith('.mp3'))
      .sort((a, b) => {
        // ترتيب حسب تاريخ التعديل (الأحدث أولاً)
        const statA = fs.statSync(path.join(musicFolder, a));
        const statB = fs.statSync(path.join(musicFolder, b));
        return statB.mtimeMs - statA.mtimeMs;
      });
    res.json(files);
  } catch (e) {
    res.json([]);
  }
});

app.listen(PORT, () => console.log("✅ Offline Music Server Running on port", PORT));