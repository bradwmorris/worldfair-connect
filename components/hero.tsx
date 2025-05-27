import NextLogo from "./next-logo";
import SupabaseLogo from "./supabase-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <h1 className="sr-only italic">an experiment</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        map your ai world fair connections
      </p>
      <div className="flex gap-2 mt-4">
        <Button asChild size="sm" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
