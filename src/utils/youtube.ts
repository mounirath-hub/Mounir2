/**
 * Utility functions for extracting YouTube video ID and generating URLs
 */

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // youtu.be/<id>
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // ?v=<id> or &v=<id>
  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (queryMatch && queryMatch[1]) return queryMatch[1];

  // /embed/<id>
  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // /shorts/<id>
  const shortsMatch = trimmed.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // /live/<id>
  const liveMatch = trimmed.match(/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // General YouTube pattern
  const generalMatch = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (generalMatch && generalMatch[1]) return generalMatch[1];

  return null;
}

export function isValidYouTubeUrl(url: string | null | undefined): boolean {
  return extractYouTubeId(url) !== null;
}

export function getYouTubeThumbnail(urlOrId: string | null | undefined): string {
  const id = extractYouTubeId(urlOrId);
  if (id) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80';
}

export function getYouTubeEmbedUrl(urlOrId: string | null | undefined, autoplay: boolean = true): string | null {
  const id = extractYouTubeId(urlOrId);
  if (!id) return null;
  const autoParam = autoplay ? '1' : '0';
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoParam}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
}

export function getYouTubeWatchUrl(urlOrId: string | null | undefined): string {
  const id = extractYouTubeId(urlOrId);
  if (id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return 'https://www.youtube.com';
}
