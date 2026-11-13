import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CourseCatalog } from "@/components/CourseCatalog";

export const metadata = { title: "Programs" };

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Programs</p>
        <h1 className="mt-3 font-display text-5xl text-ivory">Nine tracks. One working method.</h1>
        <p className="mt-3 max-w-xl text-parchment">Filter by craft area or search for a specific skill. Every program ends in a professional deliverable reviewed by a mentor.</p>
        <Suspense>
          <CourseCatalog />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
