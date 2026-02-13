const express = require("express");
const yts = require("yt-search");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Music Search & Play</title>
      <style>
        :root { --spotify-green: #1DB954; --bg-black: #121212; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg-black); color: white; margin: 0; padding-bottom: 120px; }
        .container { padding: 20px; }
        .search-box { background: #181818; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; border-radius: 25px; border: none; background: #333; color: white; margin-bottom: 10px; box-sizing: border-box; }
        button { cursor: pointer; border-radius: 25px; border: none; font-weight: bold; transition: 0.3s; }
        .btn-search { background: var(--spotify-green); color: black; padding: 10px 20px; width: 100%; }
        
        .results-list, .playlist { margin-top: 20px; }
        .item { display: flex; align-items: center; background: #1a1a1a; padding: 10px; margin-bottom: 8px; border-radius: 8px; cursor: pointer; }
        .item img { width: 50px; height: 50px; border-radius: 5px; margin-left: 15px; }
        .item-info { flex-grow: 1; text-align: right; }
        .item-title { font-size: 14px; font-weight: bold; display: block; }
        .btn-add { background: #333; color: #fff; padding: 5px 12px; font-size: 12px; }

        .player-bar { position: fixed; bottom: 0; width: 100%; background: #000; padding: 15px; border-top: 1px solid #282828; text-align: center; }
        #yt-player { width: 1px; height: 1px; position: absolute; left: -1000px; }
        .controls { display: flex; justify-content: center; gap: 30px; font-size: 30px; margin-top: 10px; }
      </style>
    </head>
    <body>

      <div class="container">
        <h2>استكشف الموسيقى 🔍</h2>
        
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="ابحث عن أغنية أو فنان...">
          <button class="btn-search" onclick="searchYoutube()">بحث في يوتيوب</button>
        </div>

        <div id="status" style="font-size: 12px; color: #b3b3b3;"></div>

        <div id="results" class="results-list">
          </div>

        <hr style="border: 0.5px solid #282828; margin: 30px 0;">
        
        <h3>قائمة التشغيل الخاصة بك 🎵</h3>
        <div id="playlist" class="playlist"></div>
      </div>

      <div id="yt-player"></div>

      <div class="player-bar">
        <div id="current-song-name" style="color: var(--spotify-green); font-size: 14px;">لا يوجد شيء قيد التشغيل</div>
        <div class="controls">
          <span onclick="prevSong()">⏮</span>
          <span id="playIcon" onclick="togglePlay()">▶</span>
          <span onclick="nextSong()">⏭</span>
        </div>
      </div>

      <script src="https://www.youtube.com/iframe_api"></script>
      <script>
        let player;
        let playlist = JSON.parse(localStorage.getItem('my_songs')) || [];
        let currentIndex = -1;

        function onYouTubeIframeAPIReady() {
          player = new YT.Player('yt-player', {
            events: { 'onStateChange': (e) => { if(e.data === 0) nextSong(); } }
          });
        }

        async function searchYoutube() {
          const query = document.getElementById('searchInput').value;
          if(!query) return;
          const status = document.getElementById('status');
          const resultsDiv = document.getElementById('results');
          
          status.innerText = "⏳ جاري البحث...";
          resultsDiv.innerHTML = "";

          try {
            const res = await fetch('/api/search?q=' + encodeURIComponent(query));
            const data = await res.json();
            
            status.innerText = "أفضل النتائج لـ: " + query;
            data.forEach(video => {
              const div = document.createElement('div');
              div.className = 'item';
              div.innerHTML = \`
                <img src="\${video.thumbnail}">
                <div class="item-info">
                  <span class="item-title">\${video.title}</span>
                  <button class="btn-add" onclick="addToPlaylist('\${video.videoId}', '\${video.title.replace(/'/g, "")}')">➕ إضافة</button>
                </div>
              \`;
              resultsDiv.appendChild(div);
            });
          } catch (e) {
            status.innerText = "❌ فشل البحث";
          }
        }

        function addToPlaylist(id, title) {
          playlist.push({ videoId: id, title: title });
          localStorage.setItem('my_songs', JSON.stringify(playlist));
          renderPlaylist();
          if(currentIndex === -1) playSong(0);
        }

        function renderPlaylist() {
          const list = document.getElementById('playlist');
          list.innerHTML = "";
          playlist.forEach((song, i) => {
            const div = document.createElement('div');
            div.className = 'item';
            div.style.borderRight = i === currentIndex ? "4px solid #1DB954" : "none";
            div.innerHTML = \`
              <div class="item-info" onclick="playSong(\${i})">
                <span class="item-title">\${song.title}</span>
              </div>
              <span onclick="removeFromPlaylist(\${i})">🗑️</span>
            \`;
            list.appendChild(div);
          });
        }

        function playSong(i) {
          currentIndex = i;
          player.loadVideoById(playlist[i].videoId);
          document.getElementById('current-song-name').innerText = "🔊 " + playlist[i].title;
          document.getElementById('playIcon').innerText = "⏸";
          renderPlaylist();
        }

        function togglePlay() {
          const state = player.getPlayerState();
          if(state === 1) { player.pauseVideo(); document.getElementById('playIcon').innerText = "▶"; }
          else { player.playVideo(); document.getElementById('playIcon').innerText = "⏸"; }
        }

        function nextSong() { if(currentIndex < playlist.length - 1) playSong(currentIndex + 1); }
        function prevSong() { if(currentIndex > 0) playSong(currentIndex - 1); }
        function removeFromPlaylist(i) {
            playlist.splice(i, 1);
            localStorage.setItem('my_songs', JSON.stringify(playlist));
            renderPlaylist();
        }

        window.onload = renderPlaylist;
      </script>
    </body>
    </html>
  `);
});

// مسار البحث في السيرفر
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  const results = await yts(query);
  res.json(results.videos.slice(0, 5)); // إرجاع أول 5 نتائج
});

app.listen(PORT, () => console.log("Music Server Running..."));