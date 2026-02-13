const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>مشغل الموسيقى</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial;
          text-align: center;
          margin-top: 50px;
          background-color: #111;
          color: white;
        }
        input {
          width: 300px;
          padding: 10px;
          margin-bottom: 10px;
        }
        button {
          padding: 10px 20px;
          background: red;
          color: white;
          border: none;
          cursor: pointer;
        }
        #player iframe {
          width: 0;
          height: 0;
          border: 0;
        }
      </style>
    </head>
    <body>

      <h2>ضع رابط أغنية من YouTube</h2>
      <input type="text" id="ytlink" placeholder="ضع الرابط هنا">
      <button onclick="playMusic()">تشغيل</button>

      <div id="player"></div>

      <script>
        function extractVideoID(url) {
          let regExp = /(?:youtube\\.com\\/.*v=|youtu\\.be\\/)([^&]+)/;
          let match = url.match(regExp);
          return match ? match[1] : null;
        }

        function playMusic() {
          let url = document.getElementById("ytlink").value;
          let videoID = extractVideoID(url);

          if(videoID){
            document.getElementById("player").innerHTML =
              '<iframe src="https://www.youtube.com/embed/' + videoID +
              '?autoplay=1&controls=0&loop=1&modestbranding=1" ' +
              'allow="autoplay"></iframe>';
          } else {
            alert("رابط غير صحيح");
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
