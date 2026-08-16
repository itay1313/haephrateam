import { mediaUrl } from "@/lib/queries";

export function Portrait({
  name,
  storageKey,
  className = "",
  sizes = "portrait",
}: {
  name: string;
  storageKey?: string | null;
  className?: string;
  sizes?: "portrait" | "wide" | "thumb";
}) {
  const initial = name.slice(0, 1);
  const ratio =
    sizes === "wide" ? "aspect-[16/10]" : sizes === "thumb" ? "aspect-square" : "aspect-[3/4]";

  if (storageKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(storageKey)}
        alt={name}
        className={`${ratio} w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${ratio} flex w-full items-center justify-center bg-[linear-gradient(160deg,#d7c4a8,#b08968_55%,#6e3d36)] ${className}`}
      aria-hidden
    >
      <span className="font-display text-5xl text-cream/90">{initial}</span>
    </div>
  );
}
