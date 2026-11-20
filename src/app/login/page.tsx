import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  // Defense in depth alongside src/proxy.ts: never render the form to an
  // already-authenticated visitor.
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="relative grid size-11 place-items-center rounded-[13px] bg-primary text-primary-foreground shadow-sm"
            aria-hidden="true"
          >
            <Wallet className="size-5" strokeWidth={2.1} />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-accent-strong" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              Welcome to Spendly
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in or create an account to start tracking.
            </p>
          </div>
        </div>

        <LoginForm />

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Your data is securely stored in the cloud.
        </p>
      </div>
    </main>
  );
}
