import Link from "next/link";
import { LogoFull, LogoMark } from "@/components/Logo";

export default function Landing() {
  return (
    <div className="landing">
      {/* ---------------- Nav ---------------- */}
      <header className="lp-nav">
        <LogoFull size={38} tagline={false} />
        <nav className="lp-links">
          <a href="#how">How it works</a>
          <a href="#advisor">Clean energy</a>
          <a href="#why">Why GridPath</a>
        </nav>
        <Link href="/app" className="nav-cta">
          Launch app →
        </Link>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Energy · Grid connection</span>
          <h1 className="hero-h1">
            The fastest way to get <em>clean energy.</em>
          </h1>
          <p className="hero-sub">
            Connecting to the grid is a black box of phone calls and weeks of waiting.
            GridPath turns it into a 30-second address lookup — then shows you the best
            ways to make your energy clean.
          </p>
          <div className="hero-cta">
            <Link href="/app" className="btn-primary">
              Check your address →
            </Link>
            <Link href="/app?demo=1" className="btn-ghost">
              See a live demo
            </Link>
          </div>
          <div className="hero-trust">
            Three honest numbers · works for any U.S. address · no signup
          </div>
        </div>

        <div className="hero-art">
          <div className="hero-card">
            <div className="hc-top">
              <LogoMark size={30} />
              <span>123 Vine Creek Rd</span>
            </div>
            <div className="hc-rows">
              <div className="hc-row">
                <span>Distance to grid</span>
                <b>288 ft</b>
              </div>
              <div className="hc-row">
                <span>Estimated cost</span>
                <b className="green">$7,760</b>
              </div>
              <div className="hc-row">
                <span>Timeline</span>
                <b>6–12 weeks</b>
              </div>
            </div>
            <div className="hc-plan">
              <span className="hc-chip">☀️ Solar</span>
              <span className="hc-chip">🔋 Battery</span>
              <span className="hc-chip">♨️ Heat pump</span>
            </div>
            <div className="hc-foot">Clean energy starts with clear connections.</div>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="section">
        <h2 className="section-h2">From address to action in three steps</h2>
        <div className="steps">
          <div className="step-card">
            <span className="step-num">1</span>
            <h3>Type your address</h3>
            <p>
              We geocode it and find the nearest real grid infrastructure from open map
              data — power lines, poles, transformers, substations.
            </p>
          </div>
          <div className="step-card">
            <span className="step-num">2</span>
            <h3>See three honest numbers</h3>
            <p>
              Distance to the grid, estimated cost, and timeline — every figure traced
              transparently to one measured input: distance. No black box.
            </p>
          </div>
          <div className="step-card">
            <span className="step-num">3</span>
            <h3>Make your energy clean</h3>
            <p>
              GridPath ranks the best options for your property — rooftop solar, battery,
              heat pump, EV charging — with real cost, savings, and payback.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Clean energy advisor ---------------- */}
      <section id="advisor" className="band">
        <div className="band-inner">
          <div className="band-copy">
            <span className="eyebrow">AI clean-energy advisor</span>
            <h2 className="section-h2">The best path to clean, for your roof.</h2>
            <p>
              Enter an address and GridPath analyzes your roof, local sun, and utility
              rates — using real rooftop solar data — then recommends a ranked plan to
              cut your carbon and your bill.
            </p>
            <ul className="band-list">
              <li>☀️ Rooftop solar sized to your roof and usage</li>
              <li>🔋 Battery for outage resilience and time-of-use savings</li>
              <li>♨️ Heat-pump electrification of heating + hot water</li>
              <li>🔌 EV charging fueled by your own solar</li>
            </ul>
            <Link href="/app" className="btn-primary">
              Build my clean-energy plan →
            </Link>
          </div>
          <div className="band-stat-grid">
            <div className="bstat">
              <b>30s</b>
              <span>address to estimate</span>
            </div>
            <div className="bstat">
              <b>96/100</b>
              <span>achievable clean score</span>
            </div>
            <div className="bstat">
              <b>$5,960</b>
              <span>typical yearly savings</span>
            </div>
            <div className="bstat">
              <b>~7 tons</b>
              <span>CO₂ cut per year</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Why ---------------- */}
      <section id="why" className="section">
        <h2 className="section-h2">Built to be explainable, not a black box</h2>
        <div className="features">
          <div className="feature">
            <span className="f-icon">📐</span>
            <h3>Transparent math</h3>
            <p>Every dollar and week traces back to one measured number — distance to the grid.</p>
          </div>
          <div className="feature">
            <span className="f-icon">🗺️</span>
            <h3>Real map data</h3>
            <p>Live OpenStreetMap power infrastructure, with optional Google 3D and Solar data.</p>
          </div>
          <div className="feature">
            <span className="f-icon">✦</span>
            <h3>Claude-powered advice</h3>
            <p>An AI advisor turns your property's signals into a ranked, honest clean-energy plan.</p>
          </div>
          <div className="feature">
            <span className="f-icon">⚡</span>
            <h3>One click to apply</h3>
            <p>Go from "I have an address" to "I've started my connection application" in minutes.</p>
          </div>
        </div>
      </section>

      {/* ---------------- CTA band ---------------- */}
      <section className="cta-band">
        <h2>See where the grid is — and how to go clean.</h2>
        <Link href="/app" className="btn-primary big">
          Check your address →
        </Link>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="lp-footer">
        <LogoFull size={34} tagline={false} />
        <div className="lp-foot-links">
          <a href="#how">How it works</a>
          <a href="#advisor">Clean energy</a>
          <Link href="/app">Launch app</Link>
        </div>
        <div className="lp-foot-copy">© 2026 GridPath · Estimates from public data; actual figures vary by utility.</div>
      </footer>
    </div>
  );
}
