"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
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
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resLocation = gl.getUniformLocation(program, "uResolution");
    gl.uniform2f(resLocation, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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

const tastemakers = [
  {
    id: "rick-rubin",
    name: "Rick Rubin",
    domain: "Music",
    question: "What can be\nremoved?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="25" cy="25" r="18" />
        <path d="M 18 20 L 18 30 M 18 25 L 25 25 L 25 30 M 25 20 L 25 22" />
        <path d="M 30 20 L 30 30 M 30 20 L 35 25 L 30 30" />
      </svg>
    ),
  },
  {
    id: "brian-eno",
    name: "Brian Eno",
    domain: "Systems",
    question: "What constraints\nwould help?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="15" width="30" height="20" rx="2" />
        <path d="M 15 25 L 20 22 L 25 28 L 30 20 L 35 25" />
        <circle cx="18" cy="20" r="2" />
      </svg>
    ),
  },
  {
    id: "dieter-rams",
    name: "Dieter Rams",
    domain: "Design",
    question: "Less, but\nbetter?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12" y="10" width="26" height="30" rx="3" />
        <circle cx="25" cy="30" r="6" />
        <line x1="18" y1="18" x2="32" y2="18" />
      </svg>
    ),
  },
  {
    id: "steve-jobs",
    name: "Steve Jobs",
    domain: "Product",
    question: "Is this\ninsanely great?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 25 8 C 35 8, 40 18, 38 28 C 36 38, 28 42, 25 42 C 22 42, 14 38, 12 28 C 10 18, 15 8, 25 8" />
        <path d="M 25 8 Q 28 5, 32 8" />
        <path d="M 28 5 L 30 2" />
      </svg>
    ),
  },
  {
    id: "rei-kawakubo",
    name: "Rei Kawakubo",
    domain: "Fashion",
    question: "Is this\nsomething new?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 25 10 L 20 40 M 25 10 L 30 40" />
        <path d="M 15 20 L 35 20" />
        <path d="M 18 25 Q 25 35, 32 25" />
      </svg>
    ),
  },
  {
    id: "virgil-abloh",
    name: "Virgil Abloh",
    domain: "Culture",
    question: 'What\'s the\n3% change?',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12" y="12" width="26" height="26" />
        <line x1="12" y1="12" x2="38" y2="38" />
        <line x1="38" y1="12" x2="12" y2="38" />
        <text x="25" y="28" textAnchor="middle" fontSize="8" fill="#1e1d1b" stroke="none">&quot;&quot;</text>
      </svg>
    ),
  },
  {
    id: "bjork",
    name: "Bjork",
    domain: "Avant-garde",
    question: "Is this from\nthe future?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="25" cy="25" r="15" />
        <path d="M 25 10 Q 40 25, 25 40 Q 10 25, 25 10" />
        <circle cx="25" cy="25" r="5" />
      </svg>
    ),
  },
  {
    id: "tadao-ando",
    name: "Tadao Ando",
    domain: "Architecture",
    question: "Where is\nthe light?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="15" width="30" height="25" />
        <rect x="18" y="20" width="14" height="20" />
        <line x1="25" y1="5" x2="25" y2="15" />
        <line x1="20" y1="8" x2="25" y2="15" />
        <line x1="30" y1="8" x2="25" y2="15" />
      </svg>
    ),
  },
  {
    id: "rene-redzepi",
    name: "Rene Redzepi",
    domain: "Food",
    question: "Does this taste\nlike a place?",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 15 15 L 35 15 L 35 35 C 35 42, 15 42, 15 35 Z" />
        <path d="M 35 20 C 42 20, 42 30, 35 30" />
        <path d="M 20 10 Q 22 5 25 10" strokeWidth="1" />
        <path d="M 30 12 Q 32 7 35 12" strokeWidth="1" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTastemaker, setActiveTastemaker] = useState(tastemakers[0]);
  const [quoteOpacity, setQuoteOpacity] = useState(1);
  const [rotation, setRotation] = useState(-1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleTastemakerClick = (tm: typeof tastemakers[0]) => {
    setQuoteOpacity(0);
    setTimeout(() => {
      setActiveTastemaker(tm);
      setRotation(parseFloat((Math.random() * 2 - 1).toFixed(1)));
      setQuoteOpacity(1);
    }, 300);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <TextureCanvas />

      {/* SVG Filters */}
      <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="handdrawn" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center p-6 text-xl uppercase tracking-wider opacity-70">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none" stroke="#1e1d1b" strokeWidth="2" strokeLinecap="round">
              <circle cx="25" cy="25" r="20" />
              <path d="M 18 22 Q 25 35, 32 22" />
              <circle cx="18" cy="18" r="2" fill="#1e1d1b" />
              <circle cx="32" cy="18" r="2" fill="#1e1d1b" />
            </svg>
            <span>TasteAPI</span>
          </div>
          <a href="/demo" className="text-base opacity-80 hover:opacity-100 transition">Try Demo</a>
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-8 pb-16">
          {/* Mascot */}
          <div className="mascot-float w-32 h-32 mb-8">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              stroke="#1e1d1b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "url(#handdrawn)" }}
            >
              <path d="M 50 15 C 25 15, 15 40, 20 65 C 25 85, 45 90, 50 90 C 55 90, 75 85, 80 65 C 85 40, 75 15, 50 15 Z" />
              <circle cx="40" cy="45" r="3" fill="#1e1d1b" stroke="none" />
              <circle cx="60" cy="45" r="3" fill="#1e1d1b" stroke="none" />
              <path d="M 45 58 Q 50 62 55 58" />
              <path d="M 30 50 L 36 48 M 31 54 L 37 52" strokeWidth="1.5" />
              <path d="M 70 50 L 64 48 M 69 54 L 63 52" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Quote Box */}
          <div className="max-w-sm min-h-40 flex items-center justify-center mb-8">
            <div
              className="text-4xl md:text-5xl uppercase leading-tight tracking-wide transition-opacity duration-300"
              style={{ opacity: quoteOpacity, transform: `rotate(${rotation}deg)` }}
            >
              <span className="block text-2xl opacity-60 mb-2">{activeTastemaker.name} asks:</span>
              {activeTastemaker.question.split("\n").map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </div>
          </div>

          {/* Subtext */}
          <p className="text-xl md:text-2xl opacity-60 max-w-md mb-12 leading-relaxed">
            Access the creative judgment of history&apos;s greatest minds. Any idea, any domain — encoded into APIs you can query.
          </p>

          {/* CTA */}
          <a
            href="/demo"
            className="handdrawn-btn relative inline-flex items-center justify-center px-12 py-4 text-2xl uppercase tracking-wider transition-transform"
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 200 60"
              fill="none"
              stroke="#1e1d1b"
              strokeWidth="2"
              style={{ filter: "url(#handdrawn)" }}
              preserveAspectRatio="none"
            >
              <rect x="5" y="5" width="190" height="50" rx="25" />
            </svg>
            <span className="relative z-10">Try Demo</span>
          </a>
        </section>

        {/* Tastemakers Grid */}
        <section className="px-6 py-16">
          <h2 className="text-3xl uppercase tracking-wider text-center mb-2 opacity-70">Choose Your Judge</h2>
          <p className="text-xl text-center opacity-50 mb-12">tap a tastemaker</p>

          <div className="grid grid-cols-3 md:grid-cols-9 gap-6 max-w-4xl mx-auto justify-items-center">
            {tastemakers.map((tm) => (
              <button
                key={tm.id}
                onClick={() => handleTastemakerClick(tm)}
                className={`flex flex-col items-center gap-2 transition-opacity hover:opacity-100 ${
                  activeTastemaker.id === tm.id ? "opacity-100" : "opacity-50"
                }`}
              >
                <div style={{ filter: "url(#handdrawn)" }}>{tm.icon}</div>
                <span className="text-sm uppercase tracking-wide hidden md:block">{tm.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl uppercase tracking-wider text-center mb-12 opacity-70">How It Works</h2>

            <div className="space-y-8">
              {[
                { num: "1", title: "Encoding", desc: "We study interviews, books, and work to extract each mind's philosophy and judgment patterns." },
                { num: "2", title: "Modeling", desc: "Each becomes a Claude-powered agent with their distinct voice, values, and criteria." },
                { num: "3", title: "Querying", desc: "Submit any idea. Get judgment and reasoning in their authentic voice." },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="relative">
                    <svg className="w-16 h-16" viewBox="0 0 60 60" fill="none" stroke="#1e1d1b" strokeWidth="2" style={{ filter: "url(#handdrawn)" }}>
                      <circle cx="30" cy="30" r="25" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl uppercase tracking-wide mb-1">{step.title}</h3>
                    <p className="text-xl opacity-60">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="px-6 py-16">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl uppercase tracking-wider text-center mb-8 opacity-70">One API Call</h2>

            <div className="relative p-6 border-2 border-[#1e1d1b] rounded-lg" style={{ filter: "url(#handdrawn)" }}>
              <pre className="text-lg overflow-x-auto whitespace-pre-wrap opacity-80">
{`fetch('/api/judge', {
  tastemaker: 'rick-rubin',
  work: {
    type: 'product',
    description: '...'
  }
})`}
              </pre>
            </div>
          </div>
        </section>

        {/* Join */}
        <section className="px-6 py-16">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-3xl uppercase tracking-wider mb-4">Join the Beta</h2>
            <p className="text-xl opacity-60 mb-8">Get early access and founding rates.</p>

            {submitted ? (
              <div className="text-2xl opacity-70">Thanks! We&apos;ll be in touch.</div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 300 50"
                    fill="none"
                    stroke="#1e1d1b"
                    strokeWidth="1.5"
                    style={{ filter: "url(#handdrawn)" }}
                    preserveAspectRatio="none"
                  >
                    <rect x="2" y="2" width="296" height="46" rx="8" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3 bg-transparent text-xl text-center outline-none placeholder:opacity-40"
                  />
                </div>
                <button
                  type="submit"
                  className="handdrawn-btn relative py-3 text-xl uppercase tracking-wider transition-transform"
                >
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 200 50"
                    fill="none"
                    stroke="#1e1d1b"
                    strokeWidth="2"
                    style={{ filter: "url(#handdrawn)" }}
                    preserveAspectRatio="none"
                  >
                    <rect x="5" y="5" width="190" height="40" rx="20" />
                  </svg>
                  <span className="relative z-10">Request Access</span>
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 text-center opacity-50">
          <div className="text-lg uppercase tracking-wider mb-2">TasteAPI</div>
          <div className="text-base">A Radical Intelligence product</div>
          <div className="text-sm mt-4 max-w-md mx-auto">
            Responses represent interpretations, not actual opinions of the individuals referenced.
          </div>
        </footer>
      </div>
    </div>
  );
}
