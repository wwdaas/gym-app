import type OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { countActiveBookings } from "@/lib/capacity";
import { bookScheduleForMember, cancelBookingForMember } from "@/lib/booking-core";

export const ASSISTANT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "browse_schedule",
      description:
        "浏览未来的课程排期，可选按课程名称筛选。返回每个排期的 scheduleId、课程名称、教练、场地、开始/结束时间、容量与剩余名额。预约课程前必须先用这个工具找到对应的 scheduleId。",
      parameters: {
        type: "object",
        properties: {
          courseName: {
            type: "string",
            description: "按课程名称模糊筛选，例如「瑜伽」，可选",
          },
          daysAhead: {
            type: "integer",
            description: "查询未来多少天内的课程，默认 7 天，最大 30 天",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_class",
      description:
        "帮当前会员预约一个具体的课程排期。scheduleId 必须来自 browse_schedule 的结果，不要自己编造。",
      parameters: {
        type: "object",
        properties: {
          scheduleId: { type: "string", description: "要预约的课程排期 ID" },
        },
        required: ["scheduleId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description:
        "取消当前会员自己的一个预约。bookingId 必须来自 check_my_bookings 的结果，不要自己编造。",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "要取消的预约 ID" },
        },
        required: ["bookingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_my_bookings",
      description:
        "查询当前会员自己的预约记录，返回 bookingId、课程名称、教练、时间与状态。",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["BOOKED", "CHECKED_IN", "CANCELLED", "ALL"],
            description:
              "按状态筛选，默认只返回有效预约（BOOKED、CHECKED_IN）",
          },
        },
      },
    },
  },
];

type ToolInput = Record<string, unknown>;

function str(input: ToolInput, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`缺少参数 ${key}`);
  }
  return value;
}

async function browseSchedule(input: ToolInput) {
  const daysAheadRaw = Number(input.daysAhead);
  const daysAhead = Number.isFinite(daysAheadRaw)
    ? Math.min(Math.max(Math.trunc(daysAheadRaw), 1), 30)
    : 7;
  const until = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const courseName =
    typeof input.courseName === "string" && input.courseName
      ? input.courseName
      : undefined;

  const schedules = await db.schedule.findMany({
    where: {
      isCancelled: false,
      startTime: { gte: new Date(), lte: until },
      ...(courseName
        ? { courseType: { name: { contains: courseName } } }
        : {}),
    },
    include: { courseType: true, coach: true },
    orderBy: { startTime: "asc" },
    take: 20,
  });

  const results = await Promise.all(
    schedules.map(async (s) => {
      const booked = await countActiveBookings(db, s.id);
      return {
        scheduleId: s.id,
        course: s.courseType.name,
        coach: s.coach.name,
        room: s.room,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        capacity: s.capacity,
        remaining: Math.max(s.capacity - booked, 0),
      };
    }),
  );

  return results;
}

async function checkMyBookings(memberId: string, input: ToolInput) {
  const status = typeof input.status === "string" ? input.status : undefined;
  const statusFilter =
    status && status !== "ALL" ? [status] : ["BOOKED", "CHECKED_IN"];

  const bookings = await db.booking.findMany({
    where: {
      memberId,
      status: { in: statusFilter as ("BOOKED" | "CHECKED_IN" | "CANCELLED")[] },
    },
    include: { schedule: { include: { courseType: true, coach: true } } },
    orderBy: { schedule: { startTime: "desc" } },
    take: 20,
  });

  return bookings.map((b) => ({
    bookingId: b.id,
    course: b.schedule.courseType.name,
    coach: b.schedule.coach.name,
    room: b.schedule.room,
    startTime: b.schedule.startTime.toISOString(),
    endTime: b.schedule.endTime.toISOString(),
    status: b.status,
  }));
}

export function createAssistantToolDispatcher(memberId: string) {
  return async function dispatch(
    name: string,
    input: ToolInput,
  ): Promise<string> {
    try {
      switch (name) {
        case "browse_schedule":
          return JSON.stringify(await browseSchedule(input));
        case "book_class": {
          const result = await bookScheduleForMember(
            str(input, "scheduleId"),
            memberId,
          );
          if (result.ok) {
            revalidatePath("/member/schedule");
            revalidatePath("/member/bookings");
          }
          return JSON.stringify(result);
        }
        case "cancel_booking": {
          const result = await cancelBookingForMember(
            str(input, "bookingId"),
            memberId,
          );
          if (result.ok) {
            revalidatePath("/member/schedule");
            revalidatePath("/member/bookings");
          }
          return JSON.stringify(result);
        }
        case "check_my_bookings":
          return JSON.stringify(await checkMyBookings(memberId, input));
        default:
          return JSON.stringify({ error: `未知工具: ${name}` });
      }
    } catch (err) {
      return JSON.stringify({
        error: err instanceof Error ? err.message : "工具执行失败",
      });
    }
  };
}
