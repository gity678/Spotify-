const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

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
        .song {
          margin: 5px 0;
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
          } else {
            alert("لا توجد أغنية لتخزينها");
          }
        }

        function renderPlaylist() {
          let container = document.getElementById("playlist");
          container.innerHTML = "";
          playlist.forEach((videoID, idx) => {
            let div = document.createElement("div");
            div.className = "song";
            div.textContent = "أغنية " + (idx + 1) + (idx === currentIndex ? " ← تشغيل الآن" : "");
            div.onclick = () => playSong(idx);
            container.appendChild(div);
          });

          if(savedSong){
            let savedDiv = document.createElement("div");
            savedDiv.style.marginTop = "10px";
            savedDiv.style.color = "#0f0";
            savedDiv.textContent = "الأغنية المحفوظة: اضغط هنا لتشغيلها";
            savedDiv.onclick = () => {
              let index = playlist.indexOf(savedSong);
              if(index >= 0) playSong(index);
            }
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
