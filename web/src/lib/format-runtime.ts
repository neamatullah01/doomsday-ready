/**
 * Formats a runtime in minutes into human-readable hours and minutes (e.g. 126 -> "2h 6m", 45 -> "45m", 0 -> "0m").
 */
export function formatRuntime(minutes: number): string {
  if (minutes < 0 || isNaN(minutes)) {
    return '0m';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
