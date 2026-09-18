export default function Loading() {
  return (
    <div className="min-h-screen px-6 pb-24 pt-36 md:px-10" role="status" aria-label="Carregando conteúdo">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-3 w-32 bg-gold/30" />
        <div className="mt-6 h-16 max-w-3xl bg-white/10" />
        <div className="mt-5 h-5 max-w-xl bg-white/5" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="aspect-[4/3] bg-white/5" />)}
        </div>
      </div>
    </div>
  );
}
