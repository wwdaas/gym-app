import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Passw0rd!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await db.user.upsert({
    where: { email: "admin@gym.local" },
    update: {},
    create: {
      name: "管理员",
      email: "admin@gym.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  const member1 = await db.user.upsert({
    where: { email: "member1@gym.local" },
    update: {},
    create: {
      name: "会员一号",
      email: "member1@gym.local",
      passwordHash,
      role: "MEMBER",
    },
  });

  const member2 = await db.user.upsert({
    where: { email: "member2@gym.local" },
    update: {},
    create: {
      name: "会员二号",
      email: "member2@gym.local",
      passwordHash,
      role: "MEMBER",
    },
  });

  const [liCoach, wangCoach, zhangCoach] = await Promise.all([
    db.coach.upsert({
      where: { id: "seed-coach-li" },
      update: {},
      create: { id: "seed-coach-li", name: "李教练", bio: "瑜伽认证教练，5 年教龄" },
    }),
    db.coach.upsert({
      where: { id: "seed-coach-wang" },
      update: {},
      create: { id: "seed-coach-wang", name: "王教练", bio: "动感单车 & 有氧训练专项" },
    }),
    db.coach.upsert({
      where: { id: "seed-coach-zhang" },
      update: {},
      create: { id: "seed-coach-zhang", name: "张教练", bio: "力量与体能训练教练" },
    }),
  ]);

  const [yoga, cycling, strength] = await Promise.all([
    db.courseType.upsert({
      where: { id: "seed-course-yoga" },
      update: {},
      create: {
        id: "seed-course-yoga",
        name: "瑜伽",
        description: "舒缓拉伸，适合初学者",
        durationMinutes: 60,
      },
    }),
    db.courseType.upsert({
      where: { id: "seed-course-cycling" },
      update: {},
      create: {
        id: "seed-course-cycling",
        name: "动感单车",
        description: "高强度有氧训练",
        durationMinutes: 45,
      },
    }),
    db.courseType.upsert({
      where: { id: "seed-course-strength" },
      update: {},
      create: {
        id: "seed-course-strength",
        name: "力量训练",
        description: "器械与自由重量训练",
        durationMinutes: 60,
      },
    }),
  ]);

  const now = new Date();
  const atOffset = (dayOffset: number, hour: number, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const scheduleDefs = [
    { courseTypeId: yoga.id, coachId: liCoach.id, room: "瑜伽室 A", day: 1, hour: 9, duration: 60, capacity: 12 },
    { courseTypeId: yoga.id, coachId: liCoach.id, room: "瑜伽室 A", day: 2, hour: 18, duration: 60, capacity: 12 },
    { courseTypeId: cycling.id, coachId: wangCoach.id, room: "单车房", day: 1, hour: 19, duration: 45, capacity: 15 },
    { courseTypeId: cycling.id, coachId: wangCoach.id, room: "单车房", day: 3, hour: 7, duration: 45, capacity: 15 },
    { courseTypeId: cycling.id, coachId: wangCoach.id, room: "单车房", day: 4, hour: 19, duration: 45, capacity: 15 },
    { courseTypeId: strength.id, coachId: zhangCoach.id, room: "力量区", day: 2, hour: 10, duration: 60, capacity: 8 },
    { courseTypeId: strength.id, coachId: zhangCoach.id, room: "力量区", day: 5, hour: 17, duration: 60, capacity: 8 },
    { courseTypeId: strength.id, coachId: zhangCoach.id, room: "力量区", day: 6, hour: 9, duration: 60, capacity: 8 },
    // small-capacity slot to make it easy to exercise the "full" / duplicate-booking paths
    { courseTypeId: yoga.id, coachId: liCoach.id, room: "瑜伽室 B", day: 1, hour: 20, duration: 60, capacity: 2 },
  ];

  const schedules = [];
  for (let i = 0; i < scheduleDefs.length; i++) {
    const def = scheduleDefs[i];
    const startTime = atOffset(def.day, def.hour);
    const endTime = new Date(startTime.getTime() + def.duration * 60_000);
    const schedule = await db.schedule.upsert({
      where: { id: `seed-schedule-${i}` },
      update: {},
      create: {
        id: `seed-schedule-${i}`,
        courseTypeId: def.courseTypeId,
        coachId: def.coachId,
        room: def.room,
        startTime,
        endTime,
        capacity: def.capacity,
      },
    });
    schedules.push(schedule);
  }

  // A schedule that started 5 minutes ago and hasn't ended yet, so the
  // check-in window (start-15min .. end) is open right now for manual testing.
  const liveStart = new Date(now.getTime() - 5 * 60_000);
  const liveEnd = new Date(now.getTime() + 55 * 60_000);
  const liveSchedule = await db.schedule.upsert({
    where: { id: "seed-schedule-live" },
    update: { startTime: liveStart, endTime: liveEnd },
    create: {
      id: "seed-schedule-live",
      courseTypeId: cycling.id,
      coachId: wangCoach.id,
      room: "单车房",
      startTime: liveStart,
      endTime: liveEnd,
      capacity: 10,
    },
  });

  await db.booking.upsert({
    where: { id: "seed-booking-member1-live" },
    update: {},
    create: {
      id: "seed-booking-member1-live",
      scheduleId: liveSchedule.id,
      memberId: member1.id,
      status: "BOOKED",
    },
  });

  await db.booking.upsert({
    where: { id: "seed-booking-member2-live" },
    update: {},
    create: {
      id: "seed-booking-member2-live",
      scheduleId: liveSchedule.id,
      memberId: member2.id,
      status: "BOOKED",
    },
  });

  await db.booking.upsert({
    where: { id: "seed-booking-member1-upcoming" },
    update: {},
    create: {
      id: "seed-booking-member1-upcoming",
      scheduleId: schedules[0].id,
      memberId: member1.id,
      status: "BOOKED",
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login:   ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`Member login:  ${member1.email} / ${DEMO_PASSWORD}`);
  console.log(`Member login:  ${member2.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
