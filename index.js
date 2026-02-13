const express = require('express');
const app = express();

// المنفذ الخاص بك
const PORT = 12044;

// كود الواجهة (HTML) بداخل متغير
const homePage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مرحباً بك</title>
    <style>
        body { 
            background-color: #0b0b0b; 
            color: white; 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
        }
        .card {
            background: #181818;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            text-align: center;
            border: 1px solid #1DB954;
        }
        h1 { color: #1DB954; margin-bottom: 10px; }
        p { color: #b3b3b3; font-size: 18px; }
        .status-dot {
            height: 10px;
            width: 10px;
            background-color: #1DB954;
            border-radius: 50%;
            display: inline-block;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>مرحباً بك في الموقع <span class="status-dot"></span></h1>
        <p>السيرفر يعمل الآن بنجاح على المنفذ 12044</p>
        <p>كل شيء جاهز للبدء!</p>
    </div>
</body>
</html>
`;

// عندما يفتح الشخص الرابط الرئيسي
app.get('/', (req, res) => {
    res.send(homePage);
});

// تشغيل السيرفر
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ السيرفر شغال! افتح: http://myself189.duckdns.org:${PORT}`);
});