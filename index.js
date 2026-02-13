const express = require('express');
const app = express();

// استخدام المنفذ الذي يحدده Railway تلقائياً
const PORT = process.env.PORT || 3000;

// محتوى الصفحة التي ستظهر لك
const helloHTML = `
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
            font-family: 'Segoe UI', sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
        }
        .message {
            text-align: center;
            padding: 40px;
            border: 2px solid #1DB954;
            border-radius: 20px;
            background: #121212;
        }
        h1 { color: #1DB954; font-size: 48px; }
        p { color: #888; font-size: 20px; }
    </style>
</head>
<body>
    <div class="message">
        <h1>مرحباً بك في موقعك! 👋</h1>
        <p>السيرفر يعمل الآن بنجاح على Railway.</p>
    </div>
</body>
</html>
`;

// المسار الرئيسي
app.get('/', (req, res) => {
    res.send(helloHTML);
});

// تشغيل السيرفر
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ السيرفر يعمل على المنفذ: ${PORT}`);
});