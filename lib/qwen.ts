import OpenAI from "openai";

const globalForQwen = globalThis as unknown as {
  qwen: OpenAI | undefined;
};

export function getQwenClient(): OpenAI {
  if (!globalForQwen.qwen) {
    globalForQwen.qwen = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY || "missing-api-key",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }
  return globalForQwen.qwen;
}

export const ASSISTANT_MODEL = "qwen-plus";
