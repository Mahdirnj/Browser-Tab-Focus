export function BackgroundLayer({ imageUrl }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900" />
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.25),transparent_65%)] transition-opacity duration-700" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/45 opacity-75" />
    </div>
  )
}

export default BackgroundLayer
