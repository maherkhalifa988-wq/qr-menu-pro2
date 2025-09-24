# QR Menu Pro (Cloudinary + Firestore)

. 
  
## ✨ المزايا
- رفع الصور باستخدام Cloudinary بدل Firebase Storage.
- قاعدة بيانات Firestore مع أدوار:
  - Admin (كلمة المرور: 000)  
  - Editor (كلمة المرور: 000)
- زر خاص لاستيراد جميع مجموعات وأصناف مطعم النخيل بسعر 0.

## 🚀 طريقة التشغيل محليًا

1. أنشئ ملف .env.local وضع فيه متغيرات Firebase و Cloudinary.
2. ثبّت الحزم:
   `bash
   npm install
   ## 🛠️ المسارات
- لوحة الإدارة: /admin
- محرر الأسعار: /editor
- واجهة الزبون: /r/al-nakheel
