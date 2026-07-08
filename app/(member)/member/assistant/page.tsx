import { loadAssistantHistory } from "@/actions/assistant-actions";
import { AssistantChat } from "./chat";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const initialHistory = await loadAssistantHistory();

  return (
    <div>
      <h1 className="gradient-text mb-4 text-2xl font-extrabold tracking-tight">
        预约助手
      </h1>
      <AssistantChat initialHistory={initialHistory} />
    </div>
  );
}
