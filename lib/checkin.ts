export const CHECKIN_WINDOW_BEFORE_MIN = 15;

export function isWithinCheckInWindow(schedule: {
  startTime: Date;
  endTime: Date;
}): boolean {
  const now = new Date();
  const windowStart = new Date(
    schedule.startTime.getTime() - CHECKIN_WINDOW_BEFORE_MIN * 60_000,
  );
  return now >= windowStart && now <= schedule.endTime;
}
