import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkında",
  description: "Veri kaynakları, güven seviyeleri ve yanlış/yapay konferanslardan kaçınma yöntemleri.",
};

const trustLevels = [
  {
    level: "Doğrulandı",
    description: "Resmî kurum, akademik organizasyon veya güvenilir çağrı sayfası üzerinden teyit edildi. Kaynak, tarih ve başvuru koşulları kontrol edildi.",
  },
  {
    level: "Bilinmiyor",
    description: "Kaynak ve süreçler kısmen görünür olsa da resmî teyit tamamlanmadı. Bu kayıtlar daha dikkatli değerlendirilmelidir.",
  },
  {
    level: "Şüpheli",
    description: "Kurum, yayıncı, indeks veya organizasyon bilgileri eksik, tutarsız veya doğrulanamayan girişlerdir. Bu tür kayıtlar kullanıcı kararına bırakılır.",
  },
];

const checklist = [
  "Yayıncı ve organizasyon bilgisi net mi?",
  "Indexleme veya program bilgisi doğrulanabilir mi?",
  "Yönetim kurulu veya komite gerçek mi, resmî mi?",
  "Ücret, burs ve kabul süreci şeffaf mı?",
  "Çağrı metni ve gecikme/son başvuru tarihleri tutarlı mı?",
  "Resmî web sitesi, e-posta ve iletişim bilgisi mevcut mu?",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-slate-900 dark:text-slate-100 md:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Hakkında</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Proje ve veri doğrulama yaklaşımı</h1>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <Link href="/" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Ana sayfa</Link>
              <Link href="/opportunities" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Fırsatlar</Link>
              <Link href="/takvim" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Takvim</Link>
            </nav>
          </div>
        </header>

        <article className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <section className="space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Amaç</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Biyomedikal araştırma ekibi için çağrılar ve fırsatları tek ekranda görünür kılmak</h2>
            </div>

            <p className="text-base leading-8 text-slate-700 dark:text-slate-200">
              Bu proje, biyomedikal AR-GE ekiplerinin yeni konferanslar, hibe fırsatları, çağrılar ve yarışma/fuar etkinliklerini hızlıca takip etmesini hedefler. Odak noktası, yalnızca “görünür” etkinlikleri listelemek değil; doğru, güncel ve işin bağlamına uygun çağrıları ayırarak takip etme sürecini kolaylaştırmaktır.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Veri kaynakları</h3>
            <p className="text-base leading-8 text-slate-700 dark:text-slate-200">
              Kaynaklar, resmî konferans/kurum duyuruları, akademik çağrı ve etkinlik sayfaları ile güvenilir kamuya açık duyurulardan toplanır. Her veri kaydının kaynağı ve doğrulama tarihi saklanır; böylece içerik geçmişi takip edilebilir ve yanlış ya da sahte görünümün nedeni daha kolay izlenebilir.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-base leading-7 text-slate-700 dark:text-slate-200">
              <li>Resmî organizasyon sayfaları</li>
              <li>Akademik komite ve kurum duyuruları</li>
              <li>Yayımlanan çağrı metinleri ve program bilgileri</li>
              <li>Yayıncı veya indeks bilgisi olan kaynaklar</li>
            </ul>
          </section>

          <section className="mt-10 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verinin nasıl doğrulandığı</h3>
            <p className="text-base leading-8 text-slate-700 dark:text-slate-200">
              Her kayıt için aynı soru seti uygulanır: Kaynak resmî mi, tarihler tutarlı mı, kategorik bilgiler eksik mi, ücret ve kabul süreci şeffaf mı, organizasyon bilgisi gerçek mi? Bu kontroller sonucunda bilgi üç seviyeye ayrılır: doğrulandı, bilinmiyor ve şüpheli. Bu yöntem, yüzeyde güçlü görünen ama güvenilirlik açığı olan etkinliklerin fark edilmesini kolaylaştırır.
            </p>
          </section>

          <section className="mt-10 space-y-5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Güven seviyeleri</h3>
            <div className="space-y-3">
              {trustLevels.map((item) => (
                <div key={item.level} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">{item.level}</p>
                  <p className="mt-2 text-base leading-7 text-slate-700 dark:text-slate-200">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Yağmacı konferanslardan kaçınma kontrol listesi</h3>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">✓</span>
                  <span className="text-base leading-7 text-slate-700 dark:text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900/70 dark:bg-brand-950/25">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hata bildir & iletişim</h3>
            <p className="mt-3 text-base leading-8 text-slate-700 dark:text-slate-200">
              Veri, tarih, kurum veya kaynak bilgisiyle ilgili bir sorun fark ederseniz lütfen bize bildirirseniz çok seviniriz. İletişim için e-posta adresi ve hata bildirimi bağlantısı kullanılabilir; yanlış ya da eksik kayıtlar yönetici teyidiyle düzeltilir.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href="mailto:info@biomedical-radar.example" className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500">Hata bildir</a>
              <a href="mailto:info@biomedical-radar.example" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">İletişim</a>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
