export function formatCountdown(targetDate: string | Date | number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
} {
  const targetTime = typeof targetDate === 'string' || typeof targetDate === 'number'
    ? new Date(targetDate).getTime()
    : targetDate.getTime();

  const now = Date.now();
  const diff = targetTime - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formatted: 'Đã hết hạn',
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0 || days > 0) parts.push(`${hours} giờ`);
  parts.push(`${minutes} phút`);
  parts.push(`${seconds}s`);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formatted: parts.join(' '),
  };
}
