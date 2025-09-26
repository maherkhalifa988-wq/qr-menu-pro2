'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { signInWithPasscode } from '@/lib/authClient';

// استورد أقسام الإدارة التي عندك
import AdminBrandSection from './AdminBrandSection';
import AdminCategoriesManager from './AdminCategoriesManager';
import AdminItemsManager from './AdminItemsManager';
import ImportFromJsonButton from './ImportFromJsonButton';

export default function AdminPage() {
const [role, setRole] = useState<'admin' | 'editor' | null>(null);
const [rid, setRid] = useState('al-nakheel');
const [loading, setLoading] = useState(true);

// حالات الهوية المطلوبة من AdminBrandSection
const [name, setName] = useState<string>('');
const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
const [bgUrl, setBgUrl] = useState<string | undefined>(undefined);

// التحقق من الدخول + الدور
useEffect(() => {
(async () => {
try {
const pass = window.prompt('ادخل كلمة السر (الادمن فقط)') || '';
const r = await signInWithPasscode(pass);

// تأكيد الدور من الـ claims (مصدر الحقيقة)  
    const auth = getAuth(app);  
    const idTok = await auth.currentUser?.getIdTokenResult(true);  
    const claimRole =  
      (idTok?.claims.role as 'admin' | 'editor' | undefined) || r;  

    if (claimRole !== 'admin') {  
      alert('هذه الصفحة للـ admin فقط');  
      location.href = '/editor';  
      return;  
    }  
    setRole('admin');  
  } catch (err: any) {  
    console.error('LOGIN_ERROR', err);  
    alert(`فشل الدخول: ${err?.message || String(err)}`);  
    location.href = '/';  
  } finally {  
    setLoading(false);  
  }  
})();

}, []);

// جلب بيانات الهوية عند تغيير rid (اختياري لكنه مفيد)
useEffect(() => {
let mounted = true;
(async () => {
try {
if (!rid) return;
const res = await fetch(/api/brand?rid=${encodeURIComponent(rid)}, {
cache: 'no-store',
});
if (!res.ok) return;
const data = await res.json();
if (!mounted) return;
setName(data?.name ?? '');
setLogoUrl(data?.logoUrl ?? undefined);
setBgUrl(data?.bgUrl ?? undefined);
} catch {
// تجاهل الأخطاء هنا لتجنّب تعطيل الصفحة
}
})();
return () => {
mounted = false;
};
}, [rid]);

if (loading || role !== 'admin') {
return (
<main className="container mx-auto p-6">
<h1 className="text-2xl font-bold mb-2">لوحة الإدارة</h1>
<p className="text-white/70">...جاري التحقق</p>
</main>
);
}

return (
<main className="container mx-auto p-6">
<header className="mb-6">
<h1 className="text-2xl font-bold">لوحة الإدارة</h1>
<p className="text-white/70">
تم تسجيل الدخول كـ <b>admin</b>
</p>
</header>

{/* اختيار/تغيير معرف المطعم */}  
  <section className="card p-5 mb-4">  
    <label className="label">معرّف المطعم (Restaurant ID)</label>  
    <input  
      className="input max-w-md"  
      value={rid}  
      onChange={(e) => setRid(e.target.value)}  
      placeholder="al-nakheel"  
    />  
  </section>  

  {/* الهوية (اسم/شعار/خلفية) — admin فقط */}  
  <AdminBrandSection  
    rid={rid}  
    name={name}  
    setName={setName}  
    logoUrl={logoUrl}  
    setLogoUrl={setLogoUrl}  
    bgUrl={bgUrl}  
    setBgUrl={setBgUrl}  
  />  

  {/* استيراد JSON للمجموعات والأصناف */}  
  <section className="my-6">  
    <ImportFromJsonButton rid={rid} />  
  </section>  

  {/* إدارة المجموعات */}  
  <section className="my-6">  
    <AdminCategoriesManager rid={rid} />  
  </section>  

  {/* إدارة الأصناف وتشغيل الأسعار */}  
  <section className="my-6">  
    <AdminItemsManager rid={rid} />  
  </section>  
</main>

);
}
