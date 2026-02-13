const express = require("express");
const ytdl = require("ytdl-core");
const app = express();

const PORT = process.env.PORT || 3000;

// دالة لتحميل الأغنية
app.get("/download/:videoID", async (req, res) => {
  try {
    const videoID = req.params.videoID;
    const videoUrl = `https://www.youtube.com/watch?v=${videoID}`;
    
    // الحصول على معلومات الفيديو
    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    
    // تعيين headers للتحميل
    res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
    
    // تحميل الصوت فقط
    ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }).pipe(res);
    
  } catch (error) {
    res.status(500).send("حدث خطأ في التحميل");
  }
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>مشغل موسيقى شخصي</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial;
          text-align: center;
          background-color: #111;
          color: white;
          padding-top: 50px;
        }
        input {
          width: 300px;
          padding: 10px;
          margin-bottom: 10px;
        }
        button {
          padding: 10px 15px;
          margin: 5px;
          background-color: red;
          border: none;
          color: white;
          cursor: pointer;
        }
        #player iframe {
          width: 0;
          height: 0;
          border: 0;
        }
        #playlist {
          margin-top: 20px;
        }
        .song-item {
          margin: 10px 0;
          padding: 10px;
          background-color: #222;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .song-title {
          cursor: pointer;
          flex-grow: 1;
          text-align: right;
          padding-right: 10px;
        }
        .download-btn {
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          text-decoration: none;
        }
        .download-btn:hover {
          background-color: #45a049;
        }
        .current-song {
          border-right: 3px solid red;
        }
      </style>
    </head>
    <body>

      <h2>مشغل الموسيقى الشخصي</h2>
      <input type="text" id="ytlink" placeholder="ضع رابط الفيديو هنا">
      <button onclick="addSong()">أضف الأغنية</button>
      <br>

      <button onclick="prevSong()">السابق</button>
      <button onclick="nextSong()">التالي</button>
      <button onclick="saveSong()">حفظ الأغنية الحالية</button>

      <div id="player"></div>

      <h3>قائمة الأغاني</h3>
      <div id="playlist"></div>

      <script>
        let playlist = [];
        let currentIndex = -1;
        let savedSong = null;

        function extractVideoID(url) {
          let regExp = /(?:youtube\\.com\\/.*v=|youtu\\.be\\/)([^&]+)/;
          let match = url.match(regExp);
          return match ? match[1] : null;
        }

        function addSong() {
          let url = document.getElementById("ytlink").value;
          let videoID = extractVideoID(url);

          if(videoID){
            playlist.push(videoID);
            currentIndex = playlist.length - 1;
            renderPlaylist();
            playSong(currentIndex);
          } else {
            alert("رابط غير صحيح");
          }
        }

        function playSong(index) {
          if(index < 0 || index >= playlist.length) return;

          let videoID = playlist[index];
          currentIndex = index;

          document.getElementById("player").innerHTML =
            '<iframe src="https://www.youtube.com/embed/' + videoID +
            '?autoplay=1&controls=0&loop=1&modestbranding=1" ' +
            'allow="autoplay"></iframe>';
          
          renderPlaylist();
        }

        function nextSong() {
          if(currentIndex + 1 < playlist.length){
            playSong(currentIndex + 1);
          } else {
            alert("هذه آخر أغنية في القائمة");
          }
        }

        function prevSong() {
          if(currentIndex - 1 >= 0){
            playSong(currentIndex - 1);
          } else {
            alert("هذه أول أغنية في القائمة");
          }
        }

        function saveSong() {
          if(currentIndex >= 0){
            savedSong = playlist[currentIndex];
            alert("تم حفظ الأغنية الحالية!");
            renderPlaylist();
          } else {
            alert("لا توجد أغنية لتخزينها");
          }
        }

        function downloadSong(videoID, event) {
          event.stopPropagation(); // منع تشغيل الأغنية عند الضغط على زر التحميل
          window.location.href = '/download/' + videoID;
        }

        function renderPlaylist() {
          let container = document.getElementById("playlist");
          container.innerHTML = "";
          
          playlist.forEach((videoID, idx) => {
            let div = document.createElement("div");
            div.className = "song-item" + (idx === currentIndex ? " current-song" : "");
            
            // عنوان الأغنية
            let titleSpan = document.createElement("span");
            titleSpan.className = "song-title";
            titleSpan.textContent = "أغنية " + (idx + 1) + (idx === currentIndex ? " (تشغيل الآن)" : "");
            titleSpan.onclick = () => playSong(idx);
            
            // زر التحميل
            let downloadBtn = document.createElement("button");
            downloadBtn.className = "download-btn";
            downloadBtn.textContent = "⬇️ تحميل";
            downloadBtn.onclick = (e) => downloadSong(videoID, e);
            
            div.appendChild(titleSpan);
            div.appendChild(downloadBtn);
            container.appendChild(div);
          });

          if(savedSong){
            let savedDiv = document.createElement("div");
            savedDiv.style.marginTop = "20px";
            savedDiv.style.padding = "10px";
            savedDiv.style.backgroundColor = "#1a3a1a";
            savedDiv.style.borderRadius = "5px";
            savedDiv.style.cursor = "pointer";
            
            let savedText = document.createElement("span");
            savedText.textContent = "💾 الأغنية المحفوظة - اضغط للتشغيل";
            savedText.style.color = "#0f0";
            
            savedDiv.onclick = () => {
              let index = playlist.indexOf(savedSong);
              if(index >= 0) playSong(index);
            };
            
            savedDiv.appendChild(savedText);
            container.appendChild(savedDiv);
          }
        }
      </script>

    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});