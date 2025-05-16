"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiQueryClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Bot,
  User,
  LucideMessageCircleQuestion,
  Info,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { getReallocationSuggestion } from "@/app/actions/openai";
import { useLocalStorage } from "usehooks-ts";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
}

const mockMessages: ChatMessage[] = [
  {
    id: "2",
    sender: "bot",
    content: "Hi, I'm the AI bot. How can I help you today?",
  },
];

interface ChatMessageProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2 py-1",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <span className="rounded-full bg-muted p-1">
          <Bot size={20} className="text-primary" aria-label="AI bot" />
        </span>
      )}
      <div
        className={cn(
          "max-w-xs px-4 py-2 rounded-lg text-sm",
          isUser
            ? "bg-primary/85 text-primary-foreground rounded-br-none"
            : "bg-muted/80 text-muted-foreground rounded-bl-none"
        )}
        aria-label={isUser ? "User message" : "AI message"}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {isUser && (
        <span className="rounded-full bg-primary p-1">
          <User
            size={20}
            className="text-primary-foreground"
            aria-label="User"
          />
        </span>
      )}
    </div>
  );
}

export default function AiChat({
  chatId,
  processId,
  onProcessIdChange,
}: {
  chatId: number;
  processId: number;
  onProcessIdChange: (processId: number) => void;
}) {
  const [showTips, setShowTips] = useState(false);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(
    `ai-chat-messages-${chatId}`,
    mockMessages,
    { initializeWithValue: false }
  );
  const { mutateAsync: sendMessage, isPending } = ApiQueryClient.useMutation(
    "post",
    "/chat"
  );
  const { mutateAsync: reallocate, isPending: isReallocating } =
    ApiQueryClient.useMutation("post", "/reallocate");
  const { mutateAsync: applyChanges, isPending: isApplyingChanges } =
    ApiQueryClient.useMutation("post", "/reallocate/save");
  const onSendMessage = async (message: string) => {
    const newMessages = [
      ...messages,
      { id: Date.now().toString(), sender: "user", content: message },
    ] as ChatMessage[];
    setMessages(newMessages);

    const parsed = await getReallocationSuggestion(message);

    if (parsed) {
      const response = await reallocate({
        body: { target_id: parsed.target_id, class_id: parsed.class_id },
      });
      onProcessIdChange(response.process_id);
      setMessages([
        ...newMessages,
        {
          id: Date.now().toString(),
          sender: "bot",
          content: parsed.suggestion,
        },
      ]);
    } else {
      const res = await sendMessage({ body: { message } });
      setMessages([
        ...newMessages,
        { id: Date.now().toString(), sender: "bot", content: res.response },
      ]);
    }
  };

  return (
    <Card className="w-full max-w-md flex flex-col min-h-[32rem]">
      <CardHeader className="gap-0.5">
        <CardTitle className="text-lg font-semibold text-center">
          <Bot size={32} className="mx-auto" />
          Ask our AI
        </CardTitle>
        <CardDescription className="text-center leading-4">
          Explain reasons behind the allocation or suggest improvements.
        </CardDescription>
        <p className="text-sm text-muted-foreground text-center">
          <Button variant={"link"} onClick={() => setShowTips(!showTips)}>
            Want to see some tips? <LucideMessageCircleQuestion />
          </Button>
        </p>
        <ul
          className={cn(
            "list-decimal list-inside text-sm text-muted-foreground max-w-xl mx-auto mb-2 w-fit",
            showTips ? "block" : "hidden"
          )}
        >
          <li>Ask normal question to regard to the results</li>
          <li>Ask to re-allocate student (keyword: swap, reallocate)</li>
          <li>
            Ask to give suggestion to specific student (&apos;give suggestion to
            student 32394&apos;)
          </li>
        </ul>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 pb-2">
        <div
          className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 max-h-[32rem]"
          role="log"
          aria-live="polite"
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </div>
        <form
          className="flex items-center gap-2 pt-2 border-t border-muted"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const message = formData.get("message") as string;
            onSendMessage(message);
          }}
        >
          <Input
            placeholder="Ask me anything about the allocation..."
            className="flex-1"
            name="message"
          />
          <Button type="submit" disabled={isPending || isReallocating}>
            {isPending || isReallocating ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Send"
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
          <Info size={14} className="inline-block shrink-0 mt-0.5" />
          <span>
            Changes from AI bot will automatically apply to your left preview.
            You can check your changes history at{" "}
            <Link
              href={"/allocations/compare"}
              className="text-primary underline underline-offset-2"
            >
              Review & compare previous allocations
            </Link>
          </span>
        </p>

        <h3 className="font-semibold text-sm text-center mt-6">
          When you are done, please apply changes by clicking
        </h3>
        <Button
          variant={"secondary"}
          className="w-full mt-2"
          onClick={() => applyChanges({ body: { process_id: processId } })}
          disabled={isApplyingChanges}
        >
          {isApplyingChanges ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Apply changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
