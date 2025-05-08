"use client";

import { useEffect, useTransition } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useGlobalLoading } from "./GlobalLoading";
import { cn } from "@/lib/utils";

/**
 * A custom Link component that wraps Next.js's next/link component.
 */
export function TransitionLink({
  href,
  children,
  replace,
  className,
  ...rest
}: Parameters<typeof NextLink>[0]) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { loading, setLoading } = useGlobalLoading();

  useEffect(() => {
    setLoading(isPending);
  }, [isPending, setLoading]);

  return (
    <NextLink
      href={href}
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => {
          const url = href.toString();
          if (replace) {
            router.replace(url);
          } else {
            router.push(url);
          }
        });
      }}
      className={cn(className, loading && "animate-pulse")}
      {...rest}
    >
      {children}
    </NextLink>
  );
}
