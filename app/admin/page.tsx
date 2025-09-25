// app/admin/menu/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Group = {
  id: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string | null;
};

type Item = {
  id: string;
  groupId: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string | null;
  price?: number | null;
  isActive?: boolean;
};

declare global {
  interface Window {
    cloudinary?: any;
  }
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

export default function AdminMenuPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === Load data from your API ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [gRes, iRes] = await Promise.all([
          fetch("/api/groups", { cache: "no-store" }),
          fetch("/api/items", { cache: "no-store" }),
        ]);

        if (!gRes.ok) throw new Error("Failed to fetch groups");
        if (!iRes.ok) throw new Error("Failed to fetch items");

        const gData: Group[] = await gRes.json();
        const iData: Item[] = await iRes.json();

        if (!mounted) return;
        setGroups(gData);
        setItems(iData);
        setSelectedGroupId((prev) => prev ?? gData[0]?.id ?? null);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "حدث خطأ أثناء جلب البيانات");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Items of selected group
  const filteredItems = useMemo(
    () => (selectedGroupId ? items.filter((it) => it.groupId === selectedGroupId) : []),
    [items, selectedGroupId]
  );

  // === Cloudinary Upload helper ===
  const openCloudinary = (onSuccess: (url: string) => void) => {
    if (!window.cloudinary) {
      alert("Cloudinary Widget غير متوفر. تأكد من تضمين سكربت الويدجت في _app أو layout.");
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        multiple: false,
        sources: ["local", "url", "camera"],
        folder: "menu",
        maxFiles: 1,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          onSuccess(result.info.secure_url);
        }
      }
    );
    widget.open();
  };

  // === Mutations ===
  const updateGroupImage = async (groupId: string, imageUrl: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error("فشل حفظ صورة المجموعة");
      setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, imageUrl } : g)));
    } catch (e: any) {
      alert(e?.message || "تعذر حفظ الصورة");
    } finally {
      setSaving(false);
    }
  };

  const updateItemImage = async (itemId: string, imageUrl: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error("فشل حفظ صورة الصنف");
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, imageUrl } : it)));
    } catch (e: any) {
      alert(e?.message || "تعذر حفظ الصورة");
    } finally {
      setSaving(false);
    }
  };

  // === UI ===
  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>
        <p>جاري التحميل...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المجموعات والأصناف</h1>

      {/* === BAR 1: المجموعات === */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">المجموعات</h2>
          <div className="text-sm opacity-70">{saving ? "يتم الحفظ..." : null}</div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {groups.map((g) => {
            const isActive = g.id === selectedGroupId;
            return (
              <div
                key={g.id}
                className={`flex items-center gap-3 whitespace-nowrap rounded-2xl border px-3 py-2 cursor-pointer transition
                  ${isActive ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/5 border-white/20 hover:bg-white/10"}`}
                onClick={() => setSelectedGroupId(g.id)}
                title={g.nameAr}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border">
                  {g.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.imageUrl} alt={g.nameAr} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs opacity-60">لا صورة</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{g.nameAr}</span>
                  <span className="text-[10px] opacity-70">{g.nameEn}</span>
                </div>
                <button
                  className={`ml-1 text-xs rounded-lg px-2 py-1 border ${isActive ? "border-white/60" : "border-white/20"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openCloudinary((url) => updateGroupImage(g.id, url));
                  }}
                >
                  رفع صورة
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* === BAR 2: الأصناف التابعة للمجموعة المختارة (اختياري كفلتر سريع) === */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">أصناف المجموعة المختارة</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredItems.map((it) => (
            <span
              key={it.id}
              className="text-xs border rounded-xl px-2 py-1 bg-white/5 border-white/20 whitespace-nowrap"
              title={it.nameAr}
            >
              {it.nameAr}
            </span>
          ))}
          {filteredItems.length === 0 && (
            <span className="text-sm opacity-60">لا توجد أصناف لعرضها في هذه المجموعة.</span>
          )}
        </div>
      </section>

      {/* === GRID: عرض الأصناف الخاصة بالمجموعة المختارة فقط === */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((it) => (
            <div key={it.id} className="border rounded-2xl p-3 bg-white/5 border-white/20">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border mb-3">
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={it.nameAr} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm opacity-60">لا صورة</div>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{it.nameAr}</div>
                  <div className="text-xs opacity-70">{it.nameEn}</div>
                  {typeof it.price === "number" && (
                    <div className="mt-1 text-sm">السعر: {it.price.toFixed(2)}</div>
                  )}
                </div>
                <button
                  className="text-xs rounded-lg px-2 py-1 border border-white/20 hover:bg-white/10"
                  onClick={() => openCloudinary((url) => updateItemImage(it.id, url))}
                >
                  تغيير الصورة
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hint for Cloudinary script */}
      <footer className="mt-8 text-xs opacity-60">
        تأكد من إضافة سكربت Cloudinary Widget في <code>app/(root)/layout.tsx</code> أو <code>_app.tsx</code>:
        <pre className="mt-2 p-2 rounded bg-black/40 overflow-auto">
{`<script src="https://widget.cloudinary.com/v2.0/global/all.js" async></script>`}
        </pre>
      </footer>
    </main>
  );
      }
