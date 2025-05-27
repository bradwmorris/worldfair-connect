import NextLogo from "./next-logo";
import SupabaseLogo from "./supabase-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header() {
  return (
    <div className="flex flex-col gap-24 items-center py-16">
      <h1 className="sr-only italic">an experiment</h1>
      <p className="text-4xl lg:text-6xl !leading-tight mx-auto max-w-3xl text-center font-semibold">
        map your ai world's fair <span className="underline decoration-green-500 decoration-4 text-green-600">connections</span>
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
