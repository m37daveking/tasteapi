"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { tastemakers } from "@/lib/tastemakers";

interface TastemakerResponse {
  id: string;
  name: string;
  response: string;
  error?: string;
}

type Category = "culture" | "climate";

const TextureCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      depth: false,
      antialias: false,
    });
    if (!gl) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
      gl.viewport(0, 0, canvas.width, canvas.height);
      render();
    };

    const render = () => {
      const resLocation = gl.getUniformLocation(program!, "uResolution");
      gl.uniform2f(resLocation, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() { gl_Position = aVertexPosition; }
    `;
    const fsSource = `
      precision lowp float;
      uniform vec2 uResolution;
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      void main() {
        vec2 st = gl_FragCoord.xy / uResolution;
        float n = random(st * 100.0);
        vec3 baseColor = vec3(242.0/255.0, 236.0/255.0, 224.0/255.0);
        vec3 finalColor = baseColor - (n * 0.05);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram();
    if (!program) return;

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (vs) gl.attachShader(program, vs);
    if (fs) gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    window.addEventListener("resize", resize);
    resize();

    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.8,
      }}
    />
  );
};

export default function Demo() {
  const [activeTab, setActiveTab] = useState<Category>("culture");
  const [selectedTastemakers, setSelectedTastemakers] = useState<string[]>([]);
  const [work, setWork] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TastemakerResponse[]>([]);
  const [error, setError] = useState("");

  const filteredTastemakers = useMemo(() => {
    return tastemakers.filter((tm) => tm.category === activeTab);
  }, [activeTab]);

  const cultureTastemakers = useMemo(() => tastemakers.filter(tm => tm.category === "culture"), []);
  const climateTastemakers = useMemo(() => tastemakers.filter(tm => tm.category === "climate"), []);

  const toggleTastemaker = (id: string) => {
    setSelectedTastemakers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTastemakers.length === 0) {
      setError("Please select at least one tastemaker");
      return;
    }
    if (!work.trim()) {
      setError("Please describe your idea");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tastemakerIds: selectedTastemakers,
          work: work.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResults(data.results);
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <TextureCanvas />

      {/* SVG Filters */}
      <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="handdrawn" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b-2 border-[#1e1d1b]/20">
          <a href="/" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition">
            <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="2" strokeLinecap="round">
              <circle cx="25" cy="25" r="20" />
              <path d="M 18 22 Q 25 35, 32 22" />
              <circle cx="18" cy="18" r="2" fill="#1e1d1b" />
              <circle cx="32" cy="18" r="2" fill="#1e1d1b" />
            </svg>
            <div>
              <span className="text-xl uppercase tracking-wider">TasteAPI</span>
              <p className="text-sm opacity-60">Access the judgment of history&apos;s greatest minds</p>
            </div>
          </a>
          <span className="text-lg uppercase tracking-wider opacity-60">Demo</span>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Category Tabs */}
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setActiveTab("culture")}
                className={`relative px-6 py-3 text-xl uppercase tracking-wider transition-all handdrawn-btn ${
                  activeTab === "culture" ? "opacity-100" : "opacity-50 hover:opacity-70"
                }`}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 150 50"
                  fill="none"
                  stroke="#1e1d1b"
                  strokeWidth={activeTab === "culture" ? "2" : "1"}
                  style={{ filter: "url(#handdrawn)" }}
                  preserveAspectRatio="none"
                >
                  <rect x="3" y="3" width="144" height="44" rx="22" />
                </svg>
                <span className="relative z-10 flex items-center gap-2">
                  Culture & Design
                  <span className="text-sm opacity-60">({cultureTastemakers.length})</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("climate")}
                className={`relative px-6 py-3 text-xl uppercase tracking-wider transition-all handdrawn-btn ${
                  activeTab === "climate" ? "opacity-100" : "opacity-50 hover:opacity-70"
                }`}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 200 50"
                  fill="none"
                  stroke="#1e1d1b"
                  strokeWidth={activeTab === "climate" ? "2" : "1"}
                  style={{ filter: "url(#handdrawn)" }}
                  preserveAspectRatio="none"
                >
                  <rect x="3" y="3" width="194" height="44" rx="22" />
                </svg>
                <span className="relative z-10 flex items-center gap-2">
                  Climate & Sustainability
                  <span className="text-sm opacity-60">({climateTastemakers.length})</span>
                </span>
              </button>
            </div>

            {/* Tab Description */}
            <div className="text-center text-xl opacity-60 max-w-2xl mx-auto">
              {activeTab === "culture" ? (
                <p>Music producers, architects, fashion icons, filmmakers. Get judgment on creative work and ideas.</p>
              ) : (
                <p>Activists, scientists, entrepreneurs, policymakers. Evaluate climate solutions and environmental initiatives.</p>
              )}
            </div>

            {/* Selected Count */}
            <div className="flex items-center justify-between">
              <p className="text-lg opacity-60">
                {selectedTastemakers.length > 0
                  ? `${selectedTastemakers.length} mind${selectedTastemakers.length > 1 ? 's' : ''} selected`
                  : "Select minds to consult"}
              </p>
              {selectedTastemakers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTastemakers([])}
                  className="text-lg opacity-50 hover:opacity-100 transition uppercase tracking-wider"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Tastemaker Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTastemakers.map((tm) => {
                const isSelected = selectedTastemakers.includes(tm.id);
                return (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => toggleTastemaker(tm.id)}
                    className={`relative text-left p-5 transition-all ${
                      isSelected ? "opacity-100" : "opacity-60 hover:opacity-80"
                    }`}
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 200 120"
                      fill="none"
                      stroke="#1e1d1b"
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      style={{ filter: "url(#handdrawn)" }}
                      preserveAspectRatio="none"
                    >
                      <rect x="3" y="3" width="194" height="114" rx="8" />
                    </svg>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xl uppercase tracking-wide">{tm.name}</h3>
                          <p className="text-base opacity-50">{tm.domain}</p>
                        </div>
                        <div className="relative w-6 h-6 flex-shrink-0">
                          <svg
                            className="w-full h-full"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1e1d1b"
                            strokeWidth="2"
                            style={{ filter: "url(#handdrawn)" }}
                          >
                            <circle cx="12" cy="12" r="10" />
                            {isSelected && (
                              <path d="M 7 12 L 10 15 L 17 8" strokeWidth="2.5" />
                            )}
                          </svg>
                        </div>
                      </div>
                      <p className="mt-3 text-lg italic opacity-70">
                        &ldquo;{tm.tagline}&rdquo;
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Work Description */}
            <div>
              <label htmlFor="work" className="block text-xl uppercase tracking-wider opacity-70 mb-3">
                Describe Your Idea
              </label>
              <div className="relative">
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 600 200"
                  fill="none"
                  stroke="#1e1d1b"
                  strokeWidth="1.5"
                  style={{ filter: "url(#handdrawn)" }}
                  preserveAspectRatio="none"
                >
                  <rect x="3" y="3" width="594" height="194" rx="8" />
                </svg>
                <textarea
                  id="work"
                  rows={6}
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  placeholder={activeTab === "culture"
                    ? "Describe the creative work or idea you want evaluated..."
                    : "Describe your climate solution or environmental initiative..."
                  }
                  className="relative z-10 w-full px-5 py-4 bg-transparent text-xl resize-none outline-none placeholder:opacity-40"
                />
              </div>
              <p className="mt-2 text-base opacity-50">
                Be specific. The more context, the better the judgment.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="relative p-4">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 600 60"
                  fill="none"
                  stroke="#8b0000"
                  strokeWidth="2"
                  style={{ filter: "url(#handdrawn)" }}
                  preserveAspectRatio="none"
                >
                  <rect x="3" y="3" width="594" height="54" rx="8" />
                </svg>
                <p className="relative z-10 text-xl text-center" style={{ color: "#8b0000" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 text-2xl uppercase tracking-wider transition-all handdrawn-btn disabled:opacity-50"
            >
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 600 60"
                fill="none"
                stroke="#1e1d1b"
                strokeWidth="2"
                style={{ filter: "url(#handdrawn)" }}
                preserveAspectRatio="none"
              >
                <rect x="3" y="3" width="594" height="54" rx="27" />
              </svg>
              <span className="relative z-10">
                {loading ? "Consulting minds..." : "Get Judgment"}
              </span>
            </button>
          </form>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-16 space-y-8">
              <h2 className="text-3xl uppercase tracking-wider text-center opacity-70">Judgments</h2>
              {results.map((result) => {
                const tm = tastemakers.find((t) => t.id === result.id);
                return (
                  <div key={result.id} className="relative p-6">
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 800 400"
                      fill="none"
                      stroke="#1e1d1b"
                      strokeWidth="2"
                      style={{ filter: "url(#handdrawn)" }}
                      preserveAspectRatio="none"
                    >
                      <rect x="3" y="3" width="794" height="394" rx="12" />
                    </svg>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-12 h-12">
                          <svg
                            className="w-full h-full"
                            viewBox="0 0 50 50"
                            fill="none"
                            stroke="#1e1d1b"
                            strokeWidth="2"
                            style={{ filter: "url(#handdrawn)" }}
                          >
                            <circle cx="25" cy="25" r="22" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl">
                            {result.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl uppercase tracking-wide">{result.name}</h3>
                          <p className="text-base opacity-50">{tm?.domain}</p>
                        </div>
                      </div>
                      {result.error ? (
                        <p style={{ color: "#8b0000" }}>{result.error}</p>
                      ) : (
                        <div className="text-xl leading-relaxed whitespace-pre-wrap opacity-80">
                          {result.response}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 text-center border-t-2 border-[#1e1d1b]/20 mt-12">
          <p className="text-base opacity-50 mb-2">
            Responses represent interpretations, not actual opinions.
          </p>
          <p className="text-lg">
            <a href="/" className="opacity-70 hover:opacity-100 transition">
              &larr; Back to TasteAPI
            </a>
            <span className="opacity-30 mx-3">·</span>
            <span className="opacity-50">A Radical Intelligence product</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
