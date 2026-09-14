import fs from 'fs';
import path from 'path';

/**
 * A team portrait.
 *
 * The two approved avatar illustrations are fixed artwork and must never be
 * regenerated, so this component only ever *reuses* a file that is already on
 * disk. Drop the approved images at:
 *
 *   public/team/viral-sharma.png
 *   public/team/animesh-agrawal.png
 *
 * (.png, .jpg, .jpeg or .webp all work) and they are picked up automatically.
 * Until a file is there, a neutral botanical disc stands in — deliberately not
 * a face, not initials and not a stock portrait, so nothing is invented.
 */

const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

function findAvatar(slug: string): string | null {
  for (const ext of EXTENSIONS) {
    const rel = `/team/${slug}${ext}`;
    if (fs.existsSync(path.join(process.cwd(), 'public', rel))) return rel;
  }
  return null;
}

export default function TeamAvatar({ slug, name }: { slug: string; name: string }) {
  const src = findAvatar(slug);

  return (
    <div className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-full bg-sage-100 sm:h-[120px] sm:w-[120px]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name}, co-creator of Notes Hub`}
          width={120}
          height={120}
          className="h-full w-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 120 120" role="img" aria-label={`Portrait of ${name} not yet added`} className="h-full w-full">
          <circle cx="60" cy="60" r="60" fill="var(--sage-100)" />
          <path d="M60 30 C84 52 84 88 60 104 C36 88 36 52 60 30 Z" fill="var(--sage-300)" opacity="0.75" />
          <path d="M60 38 L60 98" stroke="var(--sage-500)" strokeWidth="2.5" opacity="0.55" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
