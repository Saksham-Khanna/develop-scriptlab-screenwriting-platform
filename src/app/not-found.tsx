import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-sm italic text-gold-soft">CUT TO:</p>
      <h1 className="mt-3 font-display text-5xl text-ivory">This page isn&apos;t in the script.</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <ButtonLink href="/" className="mt-8">Back to ScriptLab</ButtonLink>
    </main>
  );
}
