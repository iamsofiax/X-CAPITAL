"use client";

const EARTH =
  "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg";

const GLOBES = [
  { label: "Americas desk", offset: "18%", delay: "0s" },
  { label: "EMEA desk", offset: "52%", delay: "-8s" },
  { label: "APAC desk", offset: "78%", delay: "-16s" },
];

export function TripleGlobe() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-8 place-items-center">
      {GLOBES.map((g) => (
        <figure key={g.label} className="flex flex-col items-center gap-3 md:gap-5">
          <div className="relative w-[28vw] h-[28vw] max-w-[250px] max-h-[250px] min-w-[96px] min-h-[96px]" style={{ perspective: "800px" }}>
            <div
              className="absolute inset-[-14%] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(56,189,248,0.22), transparent 68%)",
              }}
            />
            <div
              className="xc-orbit absolute inset-[-16%] rounded-full border border-sky-300/25 pointer-events-none"
              style={{ animationDelay: g.delay }}
            />
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                boxShadow:
                  "inset -28px -16px 36px rgba(0,0,0,0.65), 0 0 40px rgba(56,189,248,0.18)",
              }}
            >
              <div
                className="xc-globe-spin absolute inset-0"
                style={{
                  animationDelay: g.delay,
                  backgroundImage: `url(${EARTH})`,
                  backgroundSize: "200% 100%",
                  ["--globe-x" as string]: g.offset,
                }}
              />
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.28), transparent 32%), radial-gradient(circle at 72% 70%, transparent 40%, rgba(0,0,0,0.45) 100%)",
                }}
              />
            </div>
          </div>
          <figcaption className="text-[11px] tracking-[0.22em] uppercase text-white/45">{g.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
