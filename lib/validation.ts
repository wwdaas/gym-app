import { z } from "zod";

export const courseTypeSchema = z.object({
  name: z.string().min(1, "请输入课程名称").max(50),
  description: z.string().max(500).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(1).max(600),
});

export const scheduleSchema = z
  .object({
    courseTypeId: z.string().min(1, "请选择课程类型"),
    coachId: z.string().min(1, "请选择教练"),
    room: z.string().min(1, "请输入教室/场地").max(50),
    startTime: z.string().min(1, "请选择开始时间"),
    endTime: z.string().min(1, "请选择结束时间"),
    capacity: z.coerce.number().int().min(1, "容量至少为 1").max(200),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    error: "结束时间必须晚于开始时间",
    path: ["endTime"],
  });

export const coachSchema = z.object({
  name: z.string().min(1, "请输入教练姓名").max(50),
  bio: z.string().max(500).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().min(1, "请输入邮箱"),
  password: z.string().min(1, "请输入密码"),
});
