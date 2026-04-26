# Ranna Pro | رنة برو

تطبيق الدردشة والمكالمات المشفرة المتطور.

## أ) التشغيل المحلي

### 1. تثبيت Node.js
حمّله من [nodejs.org](https://nodejs.org/) واختر الإصدار v18 أو أحدث.

### 2. استنساخ المشروع
افتح Terminal واكتب:
```bash
git clone https://github.com/muntheer14-byte/ranna.git
cd ranna
```

### 3. تثبيت المكتبات
```bash
npm install
```

### 4. إعداد ملف البيئة
```bash
cp .env.example .env
```
ثم افتح ملف `.env` وأضف بيانات Firebase الخاصة بك.

### 5. تشغيل التطبيق
```bash
npm run dev
```
افتح المتصفح على [http://localhost:5173](http://localhost:5173)

---

## ب) إعداد Firebase

### 1. إنشاء المشروع
افتح [console.firebase.google.com](https://console.firebase.google.com/) وأنشئ مشروعاً جديداً أو اختر مشروعك الحالي.

### 2. تفعيل Authentication
- اضغط **Authentication** ← **Sign-in method**.
- فعّل **Email/Password**.
- فعّل **Google**.

### 3. إنشاء Firestore Database
- اضغط **Firestore Database** ← **Create database**.
- اختر **Production mode**.
- اختر المنطقة الأقرب إليك.

### 4. نسخ قواعد Firestore
- افتح **Firestore** ← **Rules**.
- انسخ محتوى ملف `firestore.rules` من المشروع والصقه هناك.

### 5. أضف الفهارس (Indexes)
- افتح **Firestore** ← **Indexes**.
- يمكنك إضافة الفهارس يدوياً كما هو موضح في `firestore.indexes.json`.

### 6. إعداد التخزين (Storage)
- افتح **Storage** ← **Rules**.
- انسخ محتوى ملف `storage.rules` من المشروع والصقه هناك.
