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
import { cn } from "@/lib/utils";
import { Bot, User, LucideMessageCircleQuestion, Info } from "lucide-react";
import { useState } from "react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
}

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "user",
    content: "Why was student 32394 placed in group A?",
  },
  {
    id: "2",
    sender: "bot",
    content:
      "Student 32394 was placed in group A to balance skill levels and maintain existing positive connections.",
  },
  {
    id: "3",
    sender: "user",
    content: "Can you suggest improvements for group B?",
  },
  {
    id: "4",
    sender: "bot",
    content:
      "Consider swapping student 32401 with 32398 to improve group cohesion in group B.",
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
        {message.content}
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

export default function AiChat() {
  const [showTips, setShowTips] = useState(false);

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
          className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1"
          role="log"
          aria-live="polite"
        >
          {mockMessages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </div>
        <form
          className="flex items-center gap-2 pt-2 border-t border-muted"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            placeholder="Ask me anything about the allocation..."
            className="flex-1"
          />
          <Button variant={"secondary"} type="submit">
            Send
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-1">
          <Info size={14} className="inline-block mb-px" /> Changes from AI bot
          will automatically apply to your left preview.
        </p>

        <h3 className="font-semibold text-sm text-center mt-6">
          When you are done, please apply changes by clicking
        </h3>
        <Button className="w-full mt-2">Apply changes</Button>
      </CardContent>
    </Card>
  );
}
