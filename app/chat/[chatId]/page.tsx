import type { Metadata } from "next";
import { ChatView } from "@/features/chat/ChatView";

export const metadata: Metadata = {
  title: "Chat",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return <ChatView chatId={chatId} />;
}
