const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express'); // إضافة مكتبة السيرفر
const cors = require('cors'); // إضافة مكتبة الربط

const app = express();
app.use(cors()); // السماح للموقع بالتواصل مع البوت
app.use(express.json());

// إعداد البوت بنفس الإعدادات اللي نجحت معاك
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

// طباعة الرمز في الـ Logs
client.on('qr', (qr) => {
    console.log('--- SCAN THE QR CODE BELOW ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready and connected!');
});

// الجزء الخاص باستقبال الطلب من الموقع وإرسال رسالة الواتساب
app.post('/send-whatsapp', async (req, res) => {
    const { phone, name } = req.body;
    try {
        const message = `أهلاً يا ${name}، تم استلام طلبك من HOTEP بنجاح! 🏺`;
        await client.sendMessage(`2${phone}@c.us`, message);
        console.log(`✅ رسالة اتبعتت لـ ${name}`);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('❌ خطأ في الإرسال:', err);
        res.status(500).json({ error: 'Failed' });
    }
});

client.on('message', msg => {
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});

// تشغيل السيرفر والبوت
client.initialize();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});