import Link from "next/link";
import { LogoFull } from "@/components/Logo";

export const metadata = {
  title: "Privacy Policy — GridPath",
  description: "How GridPath handles your data.",
};

export default function Privacy() {
  return (
    <div className="legal">
      <header className="legal-nav">
        <Link href="/" aria-label="GridPath home">
          <LogoFull size={34} tagline={false} />
        </Link>
      </header>
      <main className="legal-body">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: June 16, 2026</p>

        <p>
          GridPath (&ldquo;we&rdquo;, &ldquo;our&rdquo;) helps you estimate the cost, distance,
          and timeline to connect a property to the electrical grid, and explore clean-energy
          options. This policy explains what happens to your data when you use the GridPath
          website or iOS app.
        </p>

        <h2>What we collect</h2>
        <p>
          <strong>We do not require an account, and we do not sell your data.</strong> GridPath
          does not maintain user profiles or track you across apps or websites.
        </p>
        <ul>
          <li>
            <strong>Address you enter.</strong> When you type an address, it is sent to
            third-party mapping services to find its location and nearby grid infrastructure
            (see below). We do not store your address on our own servers beyond the request
            needed to return your estimate.
          </li>
          <li>
            <strong>Lead form (website only).</strong> If you choose to start a connection
            application, the name, email, phone, and property type you submit are stored only to
            process that request. The iOS app does not include this form.
          </li>
        </ul>

        <h2>Third-party services</h2>
        <p>To produce an estimate, your selected location is sent to:</p>
        <ul>
          <li><strong>OpenStreetMap / Nominatim</strong> — to convert an address to coordinates.</li>
          <li><strong>Overpass API (OpenStreetMap)</strong> — to find nearby power infrastructure.</li>
          <li>
            <strong>Google Maps / Solar API and Anthropic (Claude)</strong> — only on the
            website, and only when configured, to render maps and generate clean-energy
            recommendations. The iOS app runs these calculations on-device and does not use them.
          </li>
        </ul>
        <p>Each service handles data under its own privacy policy.</p>

        <h2>Data we do not collect</h2>
        <p>
          The iOS app does not collect analytics, advertising identifiers, contacts, photos, or
          precise device location. Estimates are computed on your device using public map data.
        </p>

        <h2>Children</h2>
        <p>GridPath is not directed at children under 13 and does not knowingly collect their data.</p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href="mailto:deonmenezescodes@gmail.com">deonmenezescodes@gmail.com</a>.
        </p>
      </main>
      <footer className="legal-foot">© 2026 GridPath</footer>
    </div>
  );
}
