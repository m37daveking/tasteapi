"use client";

import { useState, useMemo, useEffect } from "react";
import { tastemakers } from "@/lib/tastemakers";

interface TastemakerResponse {
  id: string;
  name: string;
  response: string;
  error?: string;
}

type Category = "culture" | "climate";

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const parts: (string | React.ReactElement)[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
      const match = boldMatch && italicMatch
        ? (boldMatch.index! <= italicMatch.index! ? boldMatch : italicMatch)
        : boldMatch || italicMatch;

      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }
      if (match.index > 0) parts.push(remaining.slice(0, match.index));
      const isBold = match[0].startsWith("**");
      parts.push(
        isBold
          ? <strong key={`${i}-${key++}`} className="font-semibold">{match[1]}</strong>
          : <em key={`${i}-${key++}`}>{match[1]}</em>
      );
      remaining = remaining.slice(match.index + match[0].length);
    }

    return (
      <span key={i}>
        {parts}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

export default function Demo() {
  const [activeTab, setActiveTab] = useState<Category>("culture");
  const [selectedTastemakers, setSelectedTastemakers] = useState<string[]>([]);
  const [work, setWork] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TastemakerResponse[]>([]);
  const [error, setError] = useState("");
  const [doneTastemakers, setDoneTastemakers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const select = params.get("select");
    if (select) {
      const ids = select.split(",").filter((id) => tastemakers.some((tm) => tm.id === id));
      if (ids.length > 0) {
        setSelectedTastemakers(ids);
        const firstTm = tastemakers.find((tm) => tm.id === ids[0]);
        if (firstTm?.category === "climate") setActiveTab("climate");
      }
    }
  }, []);

  const filteredTastemakers = useMemo(() => {
    return tastemakers.filter((tm) => {
      if (tm.category !== activeTab) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return tm.name.toLowerCase().includes(q) || tm.domain.toLowerCase().includes(q) || tm.tagline.toLowerCase().includes(q);
    });
  }, [activeTab, search]);

  const cultureTastemakers = useMemo(() => tastemakers.filter(tm => tm.category === "culture"), []);
  const climateTastemakers = useMemo(() => tastemakers.filter(tm => tm.category === "climate"), []);

  const toggleTastemaker = (id: string) => {
    setSelectedTastemakers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTastemakers.length === 0) { setError("Select at least one mind"); return; }
    if (!work.trim()) { setError("Describe your idea"); return; }

    setLoading(true);
    setError("");
    setResults([]);
    setDoneTastemakers(new Set());

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tastemakerIds: selectedTastemakers, work: work.trim(), stream: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) { setError("Streaming not supported"); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const data = line.replace(/^data: /, "").trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.event === "done") {
              setDoneTastemakers((prev) => new Set([...prev, parsed.id]));
            } else if (parsed.event === "start") {
              setResults((prev) => {
                if (prev.some((r) => r.id === parsed.id)) return prev;
                return [...prev, { id: parsed.id, name: parsed.name, response: "" }];
              });
            } else if (parsed.delta) {
              setResults((prev) => prev.map((r) => r.id === parsed.id ? { ...r, response: r.response + parsed.delta } : r));
            } else if (parsed.error) {
              setResults((prev) => {
                if (prev.some((r) => r.id === parsed.id)) return prev.map((r) => r.id === parsed.id ? { ...r, error: parsed.error } : r);
                return [...prev, { id: parsed.id, name: parsed.id, response: "", error: parsed.error }];
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch { setError("Failed to connect"); }
    finally { setLoading(false); }
  };

  const quickPicks = activeTab === "culture" ? [
    { label: "The Minimalists", ids: ["rick-rubin", "dieter-rams", "helmut-lang", "kenya-hara"] },
    { label: "Tech Visionaries", ids: ["steve-jobs", "jony-ive", "john-maeda"] },
    { label: "The Provocateurs", ids: ["rei-kawakubo", "virgil-abloh", "ai-weiwei", "vivienne-westwood"] },
    { label: "Film & Mood", ids: ["wong-kar-wai", "sofia-coppola", "spike-jonze", "michel-gondry"] },
  ] : [
    { label: "Youth Activists", ids: ["greta-thunberg", "vanessa-nakate", "xiye-bastida"] },
    { label: "Systems Thinkers", ids: ["kate-raworth", "donella-meadows", "vaclav-smil"] },
    { label: "Tech Optimists", ids: ["elon-musk-climate", "saul-griffith", "ramez-naam"] },
  ];

  const examples = activeTab === "culture" ? [
    "A minimalist landing page for a meditation app — white space, one CTA, no images. Just typography.",
    "A hip-hop album that fuses trap beats with orchestral arrangements and spoken word poetry.",
    "A restaurant interior: exposed concrete, hanging Edison bulbs, reclaimed wood tables, open kitchen.",
    "A fashion line that combines Japanese streetwear silhouettes with traditional West African textiles.",
  ] : [
    "A carbon capture startup that turns CO2 into building materials for affordable housing.",
    "A city-wide program replacing school bus fleets with electric bikes and walking buses.",
    "A fast fashion brand launching a 'take-back' program where returned clothes become insulation.",
    "A vertical farm powered by waste heat from data centers, growing food in food deserts.",
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
      {/* Header */}
      <header className="flex justify-between items-center px-8 md:px-12 py-6 border-b border-[#0a0a0a]/10">
        <a href="/" className="hover:opacity-50 transition-opacity">
          <span className="font-serif text-xl font-bold tracking-tight">TasteAPI.</span>
        </a>
        <p className="text-xs uppercase tracking-[0.2em] opacity-40">Demo</p>
      </header>

      <main className="max-w-4xl mx-auto px-8 md:px-12 py-12 md:py-16">
        <form onSubmit={handleSubmit} className="space-y-12">

          {/* Category Tabs */}
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => { setActiveTab("culture"); setSearch(""); }}
              className={`text-xs uppercase tracking-[0.2em] font-medium pb-2 transition-all border-b-2 ${
                activeTab === "culture" ? "border-[#0a0a0a] opacity-100" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              Culture & Design ({cultureTastemakers.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("climate"); setSearch(""); }}
              className={`text-xs uppercase tracking-[0.2em] font-medium pb-2 transition-all border-b-2 ${
                activeTab === "climate" ? "border-[#0a0a0a] opacity-100" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              Climate & Sustainability ({climateTastemakers.length})
            </button>
          </div>

          {/* Quick Picks */}
          {selectedTastemakers.length === 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-40 mb-4">Quick picks</p>
              <div className="flex flex-wrap gap-2">
                {quickPicks.map((combo) => (
                  <button
                    key={combo.label}
                    type="button"
                    onClick={() => setSelectedTastemakers(combo.ids)}
                    className="px-4 py-2 text-xs uppercase tracking-[0.15em] border border-[#0a0a0a]/15 hover:border-[#0a0a0a]/40 transition-colors"
                  >
                    {combo.label} ({combo.ids.length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, domain, or philosophy..."
              className="w-full px-0 py-3 bg-transparent text-sm border-b border-[#0a0a0a]/15 outline-none focus:border-[#0a0a0a]/40 transition-colors placeholder:opacity-30"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-40">
                {selectedTastemakers.length > 0
                  ? `${selectedTastemakers.length} selected`
                  : `${filteredTastemakers.length} available`}
              </p>
              <div className="flex gap-4">
                {filteredTastemakers.length > 0 && (
                  <button type="button" onClick={() => {
                    const ids = filteredTastemakers.map((tm) => tm.id);
                    setSelectedTastemakers((prev) => [...new Set([...prev, ...ids])]);
                  }} className="text-xs uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition">
                    Select all
                  </button>
                )}
                {selectedTastemakers.length > 0 && (
                  <button type="button" onClick={() => setSelectedTastemakers([])}
                    className="text-xs uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tastemaker Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#0a0a0a]/10">
            {(showAll || search.trim() ? filteredTastemakers : filteredTastemakers.slice(0, 6)).map((tm) => {
              const isSelected = selectedTastemakers.includes(tm.id);
              return (
                <button
                  key={tm.id}
                  type="button"
                  onClick={() => toggleTastemaker(tm.id)}
                  className={`text-left p-5 bg-[#fafafa] transition-all ${
                    isSelected ? "bg-[#0a0a0a] text-[#fafafa]" : "hover:bg-[#f0f0f0]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-medium">{tm.name}</h3>
                      <p className={`text-xs mt-0.5 ${isSelected ? "opacity-50" : "opacity-40"}`}>{tm.domain}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected ? "border-[#fafafa] bg-[#fafafa]" : "border-[#0a0a0a]/20"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#0a0a0a]" />}
                    </div>
                  </div>
                  <p className={`text-xs italic leading-relaxed ${isSelected ? "opacity-60" : "opacity-40"}`}>
                    &ldquo;{tm.tagline}&rdquo;
                  </p>
                </button>
              );
            })}
          </div>

          {/* Show More */}
          {!search.trim() && filteredTastemakers.length > 6 && (
            <button type="button" onClick={() => setShowAll(!showAll)}
              className="text-xs uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition">
              {showAll ? "Show fewer" : `Show all ${filteredTastemakers.length}`}
            </button>
          )}

          {/* Selected Chips */}
          {selectedTastemakers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTastemakers.map((id) => {
                const tm = tastemakers.find((t) => t.id === id);
                if (!tm) return null;
                return (
                  <button key={id} type="button" onClick={() => toggleTastemaker(id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-[#0a0a0a] text-[#fafafa] hover:opacity-80 transition-opacity">
                    {tm.name} <span className="opacity-50">&times;</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Examples */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-40 mb-4">Or try an example</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((example, i) => (
                <button key={i} type="button" onClick={() => setWork(example)}
                  className="text-left p-4 text-sm font-light leading-relaxed border border-[#0a0a0a]/10 hover:border-[#0a0a0a]/30 transition-colors opacity-60 hover:opacity-100">
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label htmlFor="work" className="block text-xs uppercase tracking-[0.2em] opacity-40 mb-3">
              Describe your idea
            </label>
            <textarea
              id="work"
              rows={5}
              value={work}
              onChange={(e) => setWork(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.closest("form")?.requestSubmit();
                }
              }}
              placeholder={activeTab === "culture"
                ? "Describe the creative work or idea you want evaluated..."
                : "Describe your climate solution or environmental initiative..."}
              className="w-full px-4 py-4 bg-transparent text-sm leading-relaxed border border-[#0a0a0a]/15 outline-none focus:border-[#0a0a0a]/40 transition-colors resize-none placeholder:opacity-30"
            />
            <div className="flex justify-between mt-2">
              <p className="text-xs opacity-30">Be specific for better judgment.</p>
              <p className="text-xs opacity-30">
                {work.length > 0 && <>{work.length} chars · </>}&#8984;Enter
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-700 border-l-2 border-red-700 pl-4">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || selectedTastemakers.length === 0 || !work.trim()}
            className="w-full py-4 bg-[#0a0a0a] text-[#fafafa] text-xs uppercase tracking-[0.2em] font-medium hover:opacity-80 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {loading
              ? `Consulting ${selectedTastemakers.length} mind${selectedTastemakers.length > 1 ? "s" : ""}...`
              : selectedTastemakers.length === 0
                ? "Select minds first"
                : `Get judgment from ${selectedTastemakers.length} mind${selectedTastemakers.length > 1 ? "s" : ""}`
            }
          </button>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-20 space-y-12" ref={(el) => { if (el && loading) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl font-bold tracking-tight">Judgments.</h2>
              {!loading && (
                <button type="button" onClick={() => { setResults([]); setWork(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="text-xs uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition">
                  Ask another &rarr;
                </button>
              )}
            </div>

            {results.map((result) => {
              const tm = tastemakers.find((t) => t.id === result.id);
              return (
                <div key={result.id} className="result-card border-t border-[#0a0a0a]/10 pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-bold">{result.name}</h3>
                      <p className="text-xs uppercase tracking-[0.15em] opacity-40 mt-1">{tm?.domain}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {loading && !doneTastemakers.has(result.id) && (
                        <span className="text-xs uppercase tracking-[0.15em] opacity-40 streaming-cursor">Thinking</span>
                      )}
                      {loading && doneTastemakers.has(result.id) && (
                        <span className="text-xs uppercase tracking-[0.15em] opacity-30">Done</span>
                      )}
                      {!loading && result.response && (
                        <button type="button" onClick={() => {
                          navigator.clipboard.writeText(`${result.name}:\n\n${result.response}`);
                          const btn = document.getElementById(`copy-${result.id}`);
                          if (btn) { btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy"; }, 1500); }
                        }} id={`copy-${result.id}`}
                          className="text-xs uppercase tracking-[0.15em] opacity-30 hover:opacity-100 transition-opacity">
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                  {result.error ? (
                    <p className="text-sm text-red-700">{result.error}</p>
                  ) : (
                    <div className="text-sm leading-relaxed font-light opacity-80 max-w-2xl">
                      {renderMarkdown(result.response)}
                      {loading && result.response.length > 0 && (
                        <span className="inline-block w-0.5 h-4 bg-[#0a0a0a] ml-0.5 align-middle streaming-cursor" />
                      )}
                      {loading && result.response.length === 0 && (
                        <span className="opacity-30 italic">Thinking...</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!loading && results.length > 1 && (
              <div className="pt-4 border-t border-[#0a0a0a]/10">
                <button type="button" onClick={() => { setResults([]); setWork(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="text-xs uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition">
                  Ask another question &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-8 md:px-12 py-8 border-t border-[#0a0a0a]/10 mt-12">
        <div className="flex justify-between items-center">
          <a href="/" className="text-xs opacity-40 hover:opacity-100 transition-opacity">&larr; Back to TasteAPI</a>
          <p className="text-xs opacity-30">Responses represent interpretations, not actual opinions.</p>
        </div>
      </footer>
    </div>
  );
}
