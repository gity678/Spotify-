const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Spotify Clone | My Playlist</title>
      <style>
        :root { --spotify-green: #1DB954; --bg-black: #121212; --card-grey: #181818; }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-black); color: white; margin: 0; padding-bottom: 100px; }
        
        /* الهيدر */
        .header { padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.5)); }
        
        /* صندوق الإضافة */
        .add-section { padding: 20px; background: var(--card-grey); margin: 15px; border-radius: 10px; }
        input { width: 100%; padding: 12px; border-radius: 25px; border: none; background: #333; color: white; margin-bottom: 10px; box-sizing: border-box; }
        button.add-btn { background: var(--spotify-green); color: black; border: none; padding: 10px 25px; border-radius: 25px; font-weight: bold; width: 100%; }

        /* قائمة الأغاني */
        .playlist { padding: 10px; }
        .song-item { display: flex; align-items: center; padding: 10px; margin-bottom: 5px; border-radius: 5px; transition: 0.3s; cursor: pointer; }
        .song-item:hover { background: #282828; }
        .song-item.active { color: var(--spotify-green); }
        .song-info { flex-grow: 1; margin-right: 15px; }
        .song-title { font-weight: bold; display: block; }
        .song-id { font-size: 12px; color: #b3b3b3; }

        /* مشغل الموسيقى السفلي */
        .player-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #000; padding: 15px; border-top: 1px solid #282828; display: flex; flex-direction: column; align-items: center; }
        #player-container { width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
        .controls { display: flex; gap: 20px; align-items: center; }
        .control-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; }
        .play-pause { font-size: 40px; color: white; }
        .now-playing { font-size: 14px; margin-bottom: 10px; color: var(--spotify-green); }
      </style>
    </head>
    <body>

      <div class="header">
        <h1>مكتبتي الموسيقية</h1>
      </div>

      <div class="add-section">
        <input type="text" id="songTitle" placeholder="اسم الأغنية (مثلاً: عمرو دياب - تملي معاك)">
        <input type="text" id="songUrl" placeholder="رابط فيديو اليوتيوب">
        <button class="add-btn" onclick="addNewSong()">إضافة إلى المكتبة</button>
      </div>

      <div class="playlist" id="playlist">
        </div>

      <div id="player-container">
        <div id="yt-player"></div>
      </div>

      <div class="player-bar">
        <div class="now-playing" id="current-title">اختر أغنية للتشغيل</div>
        <div class="controls">
          <button class="control-btn" onclick="prevSong()">⏮</button>
          <button class="control-btn play-pause" id="playBtn" onclick="togglePlay()">▶</button>
          <button class="control-btn" onclick="nextSong()">⏭</button>
        </div>
      </div>

      <script src="https://www.youtube.com/iframe_api"></script>
      <script>
        let player;
        let playlist = JSON.parse(localStorage.getItem('spotify_playlist')) || [];
        let currentIndex = -1;

        // تهيئة مشغل يوتيوب
        function onYouTubeIframeAPIReady() {
          player = new YT.Player('yt-player', {
            height: '0',
            width: '0',
            events: {
              'onStateChange': onPlayerStateChange
            }
          });
        }

        function onPlayerStateChange(event) {
          if (event.data === YT.PlayerState.ENDED) {
            nextSong();
          }
        }

        function extractVideoID(url) {
          let regExp = /(?:youtube\\.com\\/.*v=|youtu\\.be\\/)([^&?]+)/;
          let match = url.match(regExp);
          return match ? match[1] : null;
        }

        function addNewSong() {
          const title = document.getElementById('songTitle').value;
          const url = document.getElementById('songUrl').value;
          const videoId = extractVideoID(url);

          if (title && videoId) {
            playlist.push({ title, videoId });
            localStorage.setItem('spotify_playlist', JSON.stringify(playlist));
            document.getElementById('songTitle').value = '';
            document.getElementById('songUrl').value = '';
            renderPlaylist();
          } else {
            alert("تأكد من كتابة الاسم ووضع رابط صحيح");
          }
        }

        function renderPlaylist() {
          const listDiv = document.getElementById('playlist');
          listDiv.innerHTML = '';
          playlist.forEach((song, index) => {
            const div = document.createElement('div');
            div.className = \`song-item \${index === currentIndex ? 'active' : ''}\`;
            div.onclick = () => playSong(index);
            div.innerHTML = \`
              <div class="song-info">
                <span class="song-title">\${song.title}</span>
                <span class="song-id">يوتيوب ID: \${song.videoId}</span>
              </div>
              <span>\${index === currentIndex ? '🔊' : ''}</span>
            \`;
            listDiv.appendChild(div);
          });
        }

        function playSong(index) {
          if (index < 0 || index >= playlist.length) return;
          currentIndex = index;
          const song = playlist[index];
          
          player.loadVideoById(song.videoId);
          document.getElementById('current-title').innerText = "جاري تشغيل: " + song.title;
          document.getElementById('playBtn').innerText = "⏸";
          renderPlaylist();
        }

        function togglePlay() {
          if (!player) return;
          const state = player.getPlayerState();
          if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
            document.getElementById('playBtn').innerText = "▶";
          } else {
            player.playVideo();
            document.getElementById('playBtn').innerText = "⏸";
          }
        }

        function nextSong() {
          if (currentIndex < playlist.length - 1) playSong(currentIndex + 1);
        }

        function prevSong() {
          if (currentIndex > 0) playSong(currentIndex - 1);
        }

        window.onload = renderPlaylist;
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log("Server on " + PORT));