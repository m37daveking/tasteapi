"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const tastemakers = [
  { id: "rick-rubin", name: "Rick Rubin", domain: "Music", question: "What can be removed?" },
  { id: "brian-eno", name: "Brian Eno", domain: "Systems", question: "What constraints would help?" },
  { id: "dieter-rams", name: "Dieter Rams", domain: "Design", question: "Less, but better?" },
  { id: "steve-jobs", name: "Steve Jobs", domain: "Product", question: "Is this insanely great?" },
  { id: "rei-kawakubo", name: "Rei Kawakubo", domain: "Fashion", question: "Is this something new?" },
  { id: "virgil-abloh", name: "Virgil Abloh", domain: "Culture", question: "What's the 3% change?" },
  { id: "bjork", name: "Björk", domain: "Avant-garde", question: "Is this from the future?" },
  { id: "tadao-ando", name: "Tadao Ando", domain: "Architecture", question: "Where is the light?" },
  { id: "rene-redzepi", name: "René Redzepi", domain: "Food", question: "Does this taste like a place?" },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tastemakers.length);
    }, 3500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const handleTastemakerClick = (index: number) => {
    setActiveIndex(index);
    startTimer();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const active = tastemakers[activeIndex];

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 md:px-12 pt-6">
        <img src="/logo.png" alt="TasteAPI" className="h-20 -mt-1 -ml-3" />
        <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-[0.12em] font-mono">
          <a href="/demo" className="hover:opacity-50 transition-opacity">Demo</a>
          <a href="#how" className="hover:opacity-50 transition-opacity">How It Works</a>
          <a href="#api" className="hover:opacity-50 transition-opacity">API</a>
          <a href="#join" className="hover:opacity-50 transition-opacity">Early Access</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 md:px-12 pt-24 md:pt-32 pb-20 md:pb-32 min-h-[85vh] flex flex-col justify-center">
        <p className={`text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-8 transition-opacity duration-700 ${mounted ? "opacity-50" : "opacity-0"}`}>
          Taste as a Service
        </p>

        <h1 className={`font-serif text-[clamp(3rem,10vw,9rem)] font-black leading-[0.95] tracking-tight max-w-5xl transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          Think taste.
        </h1>

        <div className="mt-16 md:mt-24 ml-auto max-w-lg">
          <p className={`text-lg md:text-xl leading-relaxed transition-all duration-700 delay-300 ${mounted ? "opacity-80 translate-y-0" : "opacity-0 translate-y-4"}`}>
            TasteAPI encodes the aesthetic judgment of history&apos;s greatest creative minds into AI-powered APIs. Query Rick Rubin, Brian Eno, Dieter Rams — get judgment, not just answers.
          </p>
          <a
            href="/demo"
            className={`inline-block mt-8 text-[11px] uppercase tracking-[0.12em] font-mono font-medium border-b border-[#0a0a0a] pb-1 hover:opacity-50 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}
          >
            Try the Demo &rarr;
          </a>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 md:mx-12 border-t border-[#0a0a0a]/10" />

      {/* Rotating Tastemaker Quotes */}
      <section className="px-8 md:px-12 py-20 md:py-32">
        <div className="flex flex-col md:flex-row gap-16 md:gap-24">
          {/* Left: The question */}
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-6">
              {active.name} / {active.domain}
            </p>
            <h2 className="font-serif text-[clamp(2rem,6vw,5.5rem)] font-bold leading-[1.05] tracking-tight transition-all duration-500">
              &ldquo;{active.question}&rdquo;
            </h2>
          </div>

          {/* Right: Tastemaker list */}
          <div className="md:w-72 flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-4">
              {tastemakers.length} Minds Encoded
            </p>
            {tastemakers.map((tm, i) => (
              <button
                key={tm.id}
                onClick={() => handleTastemakerClick(i)}
                className={`text-left py-2.5 text-base transition-all duration-300 border-b border-transparent ${
                  i === activeIndex
                    ? "opacity-100 font-medium border-[#0a0a0a]/20"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <span>{tm.name}</span>
                <span className="ml-3 text-sm opacity-60">{tm.domain}</span>
              </button>
            ))}
            <a
              href="/demo"
              className="mt-4 text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 hover:opacity-100 transition-opacity"
            >
              Explore all 56 &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 md:mx-12 border-t border-[#0a0a0a]/10" />

      {/* See It In Action */}
      <section className="px-8 md:px-12 py-20 md:py-32">
        <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-6">Same Input / Different Minds</p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-16">See it in action.</h2>

        <div className="max-w-3xl">
          <blockquote className="text-lg md:text-xl leading-relaxed opacity-70 border-l-2 border-[#0a0a0a]/30 pl-6 mb-16">
            &ldquo;A landing page with 8 features, 12 testimonials, animated hero, and 3 CTAs. Core value prop: reduce meetings by 50%.&rdquo;
          </blockquote>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-4">Rick Rubin / Music</p>
              <p className="text-base leading-[1.8]">
                &ldquo;I&apos;m pulling away. You buried your most compelling truth under layers of decoration. Twelve testimonials is fear talking — you don&apos;t trust the one thing you do. What if you removed everything except the core promise? One sentence. One button. Let the silence do the convincing.&rdquo;
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-4">Brian Eno / Systems</p>
              <p className="text-base leading-[1.8]">
                &ldquo;This isn&apos;t a system — it&apos;s accumulation. You&apos;ve filled the canvas instead of designing the frame. What if the page itself demonstrated the product? Show a meeting dissolving. Let visitors feel 50% fewer meetings in the negative space. Use fewer notes.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 md:mx-12 border-t border-[#0a0a0a]/10" />

      {/* How It Works */}
      <section id="how" className="px-8 md:px-12 py-20 md:py-32">
        <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-6">Process / 003</p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-16">How it works.</h2>

        <div className="grid md:grid-cols-3 gap-12 md:gap-16 max-w-4xl">
          {[
            { num: "01", title: "Encoding", desc: "We study interviews, books, and creative work to extract each mind's philosophy, judgment patterns, and decision frameworks." },
            { num: "02", title: "Modeling", desc: "Each becomes a Claude-powered agent with their distinct voice, values, and aesthetic criteria — not a chatbot, a judge." },
            { num: "03", title: "Querying", desc: "Submit any creative work or idea. Get judgment and reasoning in their authentic voice. Multiple perspectives, one API call." },
          ].map((step) => (
            <div key={step.num}>
              <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-40 mb-4">{step.num}</p>
              <h3 className="font-serif text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-base leading-[1.7] opacity-70">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 md:mx-12 border-t border-[#0a0a0a]/10" />

      {/* API Example */}
      <section id="api" className="px-8 md:px-12 py-20 md:py-32">
        <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-6">Integration / 004</p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-16">One API call.</h2>

        <div className="max-w-xl bg-[#0a0a0a] text-[#fafafa] rounded-sm p-8 font-mono text-sm leading-[1.8]">
          <pre className="overflow-x-auto whitespace-pre-wrap">
{`const res = await fetch('/api/query', {
  method: 'POST',
  body: JSON.stringify({
    tastemakerIds: ['rick-rubin', 'brian-eno'],
    work: 'A landing page with...',
    stream: true
  })
})

// Streaming responses in their voice
for await (const chunk of res.body) {
  // Rick Rubin: "What can be removed?"
  // Brian Eno: "What constraints would help?"
}`}
          </pre>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 md:mx-12 border-t border-[#0a0a0a]/10" />

      {/* Join */}
      <section id="join" className="px-8 md:px-12 py-20 md:py-32">
        <div className="max-w-lg">
          <p className="text-[11px] uppercase tracking-[0.12em] font-mono opacity-50 mb-6">Early Access / 005</p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-6">Join the beta.</h2>
          <p className="text-lg opacity-70 mb-10 leading-relaxed">
            Get early access and founding rates. We&apos;re onboarding teams in batches.
          </p>

          {submitted ? (
            <p className="text-base font-medium">Thanks — we&apos;ll be in touch.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="flex-1 px-4 py-3 bg-transparent border border-[#0a0a0a]/20 text-base outline-none focus:border-[#0a0a0a] transition-colors placeholder:opacity-40"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#0a0a0a] text-[#fafafa] text-[11px] uppercase tracking-[0.12em] font-mono font-medium hover:opacity-80 transition-opacity"
              >
                Request Access
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 md:px-12 py-12 border-t border-[#0a0a0a]/10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <img src="/logo.png" alt="TasteAPI" className="h-8" />
            <p className="text-sm opacity-50 mt-1">A Radical Intelligence product</p>
          </div>
          <div className="text-sm opacity-50 md:text-right leading-relaxed">
            <p>Responses represent interpretations, not actual opinions</p>
            <p>of the individuals referenced.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
