"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  clearAssistantHistory,
  sendAssistantMessage,
  type ChatMessage,
} from "@/actions/assistant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type DisplayMessage = { role: "user" | "assistant"; text: string };

function extractDisplayMessages(history: ChatMessage[]): DisplayMessage[] {
  const out: DisplayMessage[] = [];
  for (const msg of history) {
    if (msg.role !== "user" && msg.role !== "assistant") continue;
    if (typeof msg.content !== "string") continue;
    const text = msg.content.trim();
    if (!text) continue;
    out.push({ role: msg.role, text });
  }
  return out;
}

export function AssistantChat({
  initialHistory,
}: {
  initialHistory: ChatMessage[];
}) {
  const [history, setHistory] = useState<ChatMessage[]>(initialHistory);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = extractDisplayMessages(history);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length, pending]);

  function handleSend() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setError(null);
    startTransition(async () => {
      const result = await sendAssistantMessage(history, text);
      setHistory(result.messages);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  function handleClear() {
    if (pending || history.length === 0) return;
    if (!confirm("确定要清空历史对话吗？清空后无法恢复。")) return;
    setError(null);
    startTransition(async () => {
      await clearAssistantHistory();
      setHistory([]);
    });
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {displayMessages.length > 0 && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="text-xs text-zinc-500 transition-colors hover:text-rose-400 disabled:opacity-50"
          >
            清空历史对话
          </button>
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {displayMessages.length === 0 && (
          <p className="text-sm text-zinc-500">
            你好！我可以帮你查课程表、预约课程、取消预约，或者查看你的预约记录，直接告诉我你想做什么吧。
          </p>
        )}
        {displayMessages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-4 py-2 text-sm text-white"
                  : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-100"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-500">
              思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="例如：帮我看看这周有哪些瑜伽课"
          disabled={pending}
        />
        <Button onClick={handleSend} disabled={pending || !input.trim()}>
          发送
        </Button>
      </div>
    </div>
  );
}
