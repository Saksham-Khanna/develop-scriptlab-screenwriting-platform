import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui";
import { FeaturedPrograms } from "@/components/landing/FeaturedPrograms";

const STEPS = [
  { n: "01", title: "Choose a program", body: "Nine tracks spanning commercial specs, structure, character, dialogue, story breaking, writers' rooms, table reads, script doctoring and rewrites." },
  { n: "02", title: "Study the craft", body: "Text and video lessons written by produced writers — short, specific, and built around what readers and rooms actually respond to." },
  { n: "03", title: "Write the pages", body: "Every program sets real assignments: loglines, ten-page openings, scene outlines, doctor's memos. Submit text and attach your PDF." },
  { n: "04", title: "Get mentor notes", body: "A working writer reads your submission and returns scored feedback with improvement suggestions — describe, don't prescribe." },
];

const OUTCOMES = [
  ["A vetted, marketable concept", "Loglines and a one-page pitch that pass the irony test and the genre contract."],
  ["Structural fluency", "Three-act and five-act models you can apply, diagnose and defend in a room."],
  ["Characters with engines", "Want, need, lie and wound — dramatised through behaviour, not exposition."],
  ["Scenes that turn", "Objective, obstacle, subtext and the act of leaving early."],
  ["A rewrite you can plan", "Pass-by-pass roadmaps with definitions of done, so you never polish a broken draft."],
  ["Notes you can use", "How to give and receive professional feedback — and translate 'I was bored' into a fix."],
];

const TESTIMONIALS = [
  { quote: "The coverage walkthrough alone changed how I open a script. I'd been burying my inciting incident on page 22 for three drafts.", name: "Sample student", role: "Commercial Spec cohort" },
  { quote: "I came in with a 'slow second act' and left understanding it was a midpoint problem. The fix took one afternoon on cards.", name: "Sample student", role: "Script Doctoring track" },
  { quote: "Mentor notes arrived within days, with page numbers. First time feedback felt like a development meeting rather than a workshop.", name: "Sample student", role: "Dialogue & Scene Writing" },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="grain relative overflow-hidden">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero.jpg" alt="" className="h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
          </div>
          <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-5 py-24 lg:px-8">
            <p className="animate-rise mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Commercial Screenwriting & Script Doctoring Lab</p>
            <h1 className="animate-rise delay-1 max-w-3xl font-display text-5xl font-medium leading-[1.05] text-ivory sm:text-6xl lg:text-7xl">
              Write the script that gets <em className="italic text-gold-soft">past the reader.</em>
            </h1>
            <p className="animate-rise delay-2 mt-6 max-w-xl text-lg leading-relaxed text-parchment">
              ScriptLab is a structured, mentor-led program for aspiring screenwriters. Learn how produced writers break story, build characters, write scenes that turn — and diagnose the draft that isn&apos;t working.
            </p>
            <div className="animate-rise delay-3 mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">Join the Lab</ButtonLink>
              <ButtonLink href="/courses" variant="secondary" size="lg">Explore programs</ButtonLink>
            </div>
            <div className="animate-rise delay-3 mt-14 flex flex-wrap gap-x-10 gap-y-4 text-sm text-muted">
              <span><strong className="font-display text-2xl text-ivory">9</strong> &nbsp;craft tracks</span>
              <span><strong className="font-display text-2xl text-ivory">40+</strong> &nbsp;lessons</span>
              <span><strong className="font-display text-2xl text-ivory">1:1</strong> &nbsp;mentor notes on every submission</span>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="border-y border-line bg-charcoal/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">What ScriptLab is</p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-ivory">A lab, not a lecture hall.</h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-parchment lg:col-span-7">
              <p>
                Most screenwriting education stops at theory. ScriptLab is built around the professional workflow: break the story before you write it, write the pages, hear them read, take the notes, and plan the rewrite. Every program ends in a deliverable a producer would recognise.
              </p>
              <p>
                Mentors are working writers who have sat in rooms, taken studio notes and doctored scripts in trouble. Their feedback locates problems by page number and leaves the solution to you — because that is how the job works.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURED PROGRAMS */}
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Featured programs</p>
              <h2 className="mt-3 font-display text-4xl text-ivory">Start with the craft you need most.</h2>
            </div>
            <Link href="/courses" className="text-sm text-gold-soft hover:underline">View all nine tracks →</Link>
          </div>
          <FeaturedPrograms />
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="border-y border-line bg-charcoal/40">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">How it works</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl text-ivory">From premise to mentor notes in four movements.</h2>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="bg-ink p-7 transition hover:bg-charcoal">
                  <span className="font-display text-4xl text-gold/70">{s.n}</span>
                  <h3 className="mt-4 text-lg font-medium text-ivory">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* OUTCOMES */}
        <section id="outcomes" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Learning outcomes</p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-ivory">What you leave with.</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">Each track is designed around a professional deliverable. Finish the lab with a portfolio of documents — not certificates.</p>
              <ButtonLink href="/register" className="mt-8">Begin your first track</ButtonLink>
            </div>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {OUTCOMES.map(([t, b]) => (
                <li key={t} className="border-l border-gold/40 pl-5">
                  <h3 className="font-display text-xl text-ivory">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="border-y border-line bg-charcoal/40">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">From the lab</p>
                <h2 className="mt-3 font-display text-4xl text-ivory">What writers say.</h2>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-wider text-muted">Sample content — illustrative testimonials</span>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <figure key={i} className="flex flex-col rounded-xl border border-line bg-ink p-7">
                  <span className="font-display text-5xl leading-none text-gold/50">“</span>
                  <blockquote className="mt-2 flex-1 font-display text-xl leading-relaxed text-ivory">{t.quote}</blockquote>
                  <figcaption className="mt-6 text-xs uppercase tracking-wider text-muted">{t.name} · {t.role}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 py-24 text-center lg:px-8">
            <p className="font-display text-sm italic text-gold-soft">FADE IN:</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-tight text-ivory sm:text-5xl">Your next draft deserves a room full of professionals.</h2>
            <p className="mx-auto mt-5 max-w-lg text-parchment">Create a free account, enroll in a track, and submit your first pages this week.</p>
            <div className="mt-9 flex justify-center gap-3">
              <ButtonLink href="/register" size="lg">Join the Lab</ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg">Sign in</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
