"use client";

const POSTER =
  "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=2400&q=80";

export function RocketHero() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER}
        alt=""
        className="hero-video hero-video-position absolute inset-0 w-full h-full object-cover"
      />
      <video
        className="hero-video hero-video-position absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={POSTER}
      >
        <source media="(min-width: 768px)" src="/videos/hero-desktop.mp4" type="video/mp4" />
        <source media="(min-width: 768px)" src="/videos/hero-hd.mp4" type="video/mp4" />
        <source src="/videos/hero-mobile.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-x-[30%] bottom-0 h-36 animate-engine-fire bg-gradient-to-t from-orange-500/28 via-amber-400/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-[#050505]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/15" />
    </div>
  );
}
