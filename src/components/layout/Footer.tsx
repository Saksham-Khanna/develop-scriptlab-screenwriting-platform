import Link from "next/link";
import { Logo } from "./Navbar";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            A working lab for commercial screenwriters. Structure, character, dialogue, story breaking and script doctoring — taught the way professional rooms actually work, with mentor notes on your pages.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Learn</p>
          <ul className="mt-4 space-y-2 text-sm text-parchment">
            <li><Link className="hover:text-gold-soft" href="/courses">All programs</Link></li>
            <li><Link className="hover:text-gold-soft" href="/courses?category=script-doctoring">Script doctoring</Link></li>
            <li><Link className="hover:text-gold-soft" href="/courses?category=story-breaking">Story breaking</Link></li>
            <li><Link className="hover:text-gold-soft" href="/#how">How it works</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Account</p>
          <ul className="mt-4 space-y-2 text-sm text-parchment">
            <li><Link className="hover:text-gold-soft" href="/register">Join the Lab</Link></li>
            <li><Link className="hover:text-gold-soft" href="/login">Sign in</Link></li>
            <li><Link className="hover:text-gold-soft" href="/register?role=instructor">Apply as a mentor</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} ScriptLab. All rights reserved.</span>
          <span>FADE IN: — your first page starts here.</span>
        </div>
      </div>
    </footer>
  );
}
