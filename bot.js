const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// إعداد البوت مع خاصية حفظ الجلسة لعدم مسح الـ QR كل مرة
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// إظهار رمز QR في شاشة السيرفر (Logs)
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('📌 امسح رمز QR التالي لربط واتساب HOTEP:');
});

client.on('ready', () => {
    console.log('✅ HOTEP Bot is Ready and Connected to Cloud!');
});

// استقبال الطلبات من الموقع
app.post('/send-order', (req, res) => {
    const { name, phone, address, total } = req.body;

    // تحويل رقم العميل للصيغة الدولية (مصر كمثال)
    let clientWhatsAppNumber = phone.trim();
    if (clientWhatsAppNumber.startsWith('0')) {
        clientWhatsAppNumber = '20' + clientWhatsAppNumber.substring(1);
    }
    const finalRecipient = `${clientWhatsAppNumber}@c.us`;

    // حساب التفاصيل المالية
    const shipping = (total == 250 || total == 270) ? (total == 250 ? 50 : 70) : 50;
    const productPrice = total - shipping;

    // نص الرسالة الاحترافية
    const message = `مرحباً بك في *HOTEP* يا ${name} 🔥\n\n` +
        `لقد استلمنا طلبك عبر موقعنا الرسمي بالمواصفات التالية:\n\n` +
        `📦 *تفاصيل الفاتورة:*\n` +
        `• سعر المنتج: ${productPrice} ج.م\n` +
        `• مصاريف الشحن: ${shipping} ج.م\n` +
        `• *الإجمالي المطلوب: ${total} ج.م*\n\n` +
        `📍 *بيانات الاستلام:*\n` +
        `• الاسم: ${name}\n` +
        `• العنوان: ${address}\n\n` +
        `✅ *يرجى الرد على هذه الرسالة بكلمة (تأكيد) لضمان جاهزيتك للاستلام وبدء الشحن فوراً.*\n\n` +
        `نحن فخورون بخدمتك دائماً.\n` +
        `🌐 موقعنا: https://hotep-f423e.web.app`;

    client.sendMessage(finalRecipient, message)
        .then(() => {
            console.log(`✉️ تم إرسال الرسالة بنجاح إلى العميل: ${name}`);
            res.status(200).send({ success: true });
        })
        .catch(err => {
            console.error('❌ فشل الإرسال، تأكد من أن الرقم عليه واتساب:', err);
            res.status(500).send({ success: false });
        });
});

// إعداد المنفذ العالمي للسيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HOTEP Server is running on port ${PORT}`);
});

client.initialize();