"use server";

import type OpenAI from "openai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQwenClient, ASSISTANT_MODEL } from "@/lib/qwen";
import { ASSISTANT_TOOLS, createAssistantToolDispatcher } from "@/lib/agent-tools";

export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type AssistantTurnResult = {
  messages: ChatMessage[];
  error?: string;
};

const MAX_TOOL_ITERATIONS = 6;
// Cap stored history so the prompt doesn't grow unbounded over months of use.
const MAX_STORED_MESSAGES = 60;

function systemPrompt(memberName: string): string {
  return `你是健身房预约系统里的会员预约助手，正在和会员「${memberName}」对话。

你可以使用工具帮会员：浏览课程排期、预约课程、取消预约、查询自己的预约记录。

规则：
- 只能操作当前会员自己的预约，不要询问或假设其他会员的信息。
- 预约课程前，先用 browse_schedule 找到正确的 scheduleId；取消预约前，先用 check_my_bookings 找到正确的 bookingId。不要编造 ID。
- 工具返回的时间是 ISO 8601 格式，回复会员时请转换成自然、易读的中文时间表达（例如「周四上午9点」）。
- 如果操作失败（比如已满员、重复预约、预约不存在），把工具返回的错误信息用自然语言解释给会员，不要直接输出原始 JSON。
- 回复要简洁、口语化，像健身房前台一样友好。`;
}

function trimForStorage(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_STORED_MESSAGES) return messages;
  let start = messages.length - MAX_STORED_MESSAGES;
  // Never start the history on a tool result — its matching tool_calls
  // message would be cut off and the API rejects orphaned tool messages.
  while (start < messages.length && messages[start].role === "tool") {
    start++;
  }
  return messages.slice(start);
}

async function saveHistory(userId: string, messages: ChatMessage[]) {
  const payload = JSON.stringify(trimForStorage(messages));
  await db.assistantChat.upsert({
    where: { userId },
    update: { messages: payload },
    create: { userId, messages: payload },
  });
}

export async function loadAssistantHistory(): Promise<ChatMessage[]> {
  const session = await auth();
  if (!session?.user) return [];

  const chat = await db.assistantChat.findUnique({
    where: { userId: session.user.id },
  });
  if (!chat) return [];

  try {
    const parsed = JSON.parse(chat.messages);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export async function clearAssistantHistory(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await db.assistantChat.deleteMany({ where: { userId: session.user.id } });
}

export async function sendAssistantMessage(
  history: ChatMessage[],
  userText: string,
): Promise<AssistantTurnResult> {
  const trimmed = userText.trim();
  if (!trimmed) {
    return { messages: history, error: "请输入消息内容" };
  }

  const session = await auth();
  if (!session?.user) {
    return { messages: history, error: "请先登录" };
  }

  const dispatch = createAssistantToolDispatcher(session.user.id);
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(session.user.name ?? "会员") },
    ...history,
    { role: "user", content: trimmed },
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    let completion;
    try {
      completion = await getQwenClient().chat.completions.create({
        model: ASSISTANT_MODEL,
        messages,
        tools: ASSISTANT_TOOLS,
      });
    } catch (err) {
      console.error("Assistant request failed:", err);
      return { messages: history, error: "助手暂时不可用，请稍后再试" };
    }

    const message = completion.choices[0]?.message;
    if (!message) {
      return { messages: history, error: "助手暂时不可用，请稍后再试" };
    }
    messages.push(message);

    const toolCalls = message.tool_calls?.filter(
      (call): call is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
        call.type === "function",
    );
    if (!toolCalls || toolCalls.length === 0) {
      break;
    }

    for (const toolCall of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = toolCall.function.arguments
          ? JSON.parse(toolCall.function.arguments)
          : {};
      } catch {
        args = {};
      }
      const result = await dispatch(toolCall.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  const withoutSystem = messages.filter((m) => m.role !== "system");

  try {
    await saveHistory(session.user.id, withoutSystem);
  } catch (err) {
    console.error("Failed to persist assistant history:", err);
  }

  return { messages: withoutSystem };
}
