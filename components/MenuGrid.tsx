import Image from 'next/image'

type Item = { id: string; name: string; price: number; imageUrl?: string }

export default function MenuGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map(it => (
        <div key={it.id} className="card p-3 flex flex-col items-center">
          {it.imageUrl ? (
            <Image
              src={it.imageUrl}
              alt={it.name}
              width={160}
              height={120}
              className="rounded-xl object-cover w-full h-32"
            />
          ) : (
            <div className="bg-white/10 w-full h-32 rounded-xl flex items-center justify-center text-white/50">
              لا صورة
            </div>
          )}
          <div className="mt-2 text-center">
            <p className="font-semibold">{it.name}</p>
            <p className="text-white/70">{it.price} ل.س</p>
          </div>
        </div>
      ))}
    </div>
  )
}
