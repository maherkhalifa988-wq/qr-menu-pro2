// حفظ سعر عنصر واحد
  async function saveItemPrice(itemId: string, newPrice: number) {
    if (!selectedCat) return
    setSaving(true)
    try {
      await updateDoc(
        doc(db, 'restaurants', RID, 'categories', selectedCat, 'items', itemId),
        { price: Number(newPrice || 0) }
      )
      setItems(prev => prev.map(it => (it.id === itemId ? { ...it, price: newPrice } : it)))
    } catch (e: any) {
      console.error(e)
      alert('فشل حفظ السعر: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>

      {/* 1) الهوية (اسم/شعار/خلفية) */}
      <AdminBrandSection
        rid={RID}
        name={name}
        setName={setName}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        bgUrl={bgUrl}
        setBgUrl={setBgUrl}
      />

      {/* 2) استيراد JSON */}
      <section className="my-6">
        <ImportFromJsonButton rid={RID} />
      </section>

      {/* 3) إدارة المجموعات */}
      <section className="card p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">إدارة المجموعات</h2>
          {loadingCats && <span className="text-white/60 text-sm">...جارٍ التحميل</span>}
        </div>

        {cats.length === 0 && !loadingCats ? (
          <p className="text-white/60">لا توجد مجموعات بعد.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {cats.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <b>#{c.order ?? 0}</b>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={() => setSelectedCat(c.id)}>
                      أصناف المجموعة
                    </button>
                    <button
                      className="btn-ghost text-red-300"
                      onClick={() => deleteCat(c.id)}
                      disabled={saving}
                      title="حذف المجموعة مع كافة الأصناف"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <label className="text-sm">الاسم (عربي)</label>
                  <input
                    className="input"
                    value={c.nameAr ?? ''}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, nameAr: e.target.value } : x)))
                    }
                  />
                  <label className="text-sm">Name (English)</label>
                  <input
                    className="input"
                    value={c.nameEn ?? ''}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, nameEn: e.target.value } : x)))
                    }
                  />
                  <label className="text-sm">رابط صورة المجموعة</label>
                  <input
                    className="input col-span-1 md:col-span-1"
                    placeholder="ألصق رابط Cloudinary"
                    value={c.imageUrl ?? ''}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, imageUrl: e.target.value } : x)))
                    }
                  />
                  <div className="flex items-center">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        width={80}
                        height={60}
                        className="rounded border border-white/10 object-cover"
                      />
                    ) : (
                      <span className="text-white/40 text-xs">لا توجد صورة</span>
                    )}
                  </div>
                  <label className="text-sm">الترتيب</label>
                  <input
                    type="number"
                    className="input"
                    value={c.order ?? 0}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, order: Number(e.target.value || 0) } : x)))
                    }
                  />
                </div>

                <div className="mt-3">
                  <button
                    className="btn"
                    onClick={() => saveCat(c)}
                    disabled={saving}
                  >
                    حفظ المجموعة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4) محرر أسعار الأصناف */}
      <section className="card p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">تعديل أسعار الأصناف</h2>
          <select
            className="input"
            value={selectedCat ?? ''}
            onChange={(e) => setSelectedCat(e.target.value || null)}
          >
            <option value="">— اختر مجموعة —</option>
            {cats.map(c => (
              <option key={c.id} value={c.id}>{c.nameAr||c.name||c.nameEn || c.id}</option>
            ))}
          </select>
        </div>

        {!selectedCat ? (
          <p className="text-white/60">اختر مجموعة لعرض أصنافها.</p>
        ) : loadingItems ? (
          <p className="text-white/60">...جارٍ تحميل الأصناف</p>
        ) : items.length === 0 ? (
          <p className="text-white/60">لا توجد أصناف داخل هذه المجموعة.</p>
        ) : (
          <table className="w-full border border-white/10">
            <thead>
              <tr className="bg-white/5">
                <th className="p-2 text-right">الاسم (عربي)</th>
                <th className="p-2 text-right">Name (English)</th>
                <th className="p-2 text-right">السعر</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t border-white/10">
                  <td className="p-2">{it.nameAr  it.name  '-'}</td>
                  <td className="p-2">{it.nameEn || '-'}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="input w-32"
                      defaultValue={typeof it.price === 'number' ? it.price : 0}
                      onBlur={(e) => saveItemPrice(it.id, Number(e.target.value || 0))}
                    />
                  </td>
                  <td className="p-2 text-white/50 text-xs">يحفظ عند الخروج من الحقل</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
