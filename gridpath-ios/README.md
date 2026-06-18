# GridPath — iOS

Native SwiftUI app: type any U.S. address → see distance to the grid, connection cost,
and timeline on a real 3D MapKit map → get a clean-energy plan (solar, battery, heat
pump, EV). Runs fully on-device (Nominatim + Overpass + Turf-equivalent math + a
deterministic clean-energy model) — no backend or API key required.

## Build & run

```bash
cd gridpath-ios
xcodegen generate        # generates GridPath.xcodeproj from project.yml
open GridPath.xcodeproj   # then ⌘R, or:
xcodebuild -project GridPath.xcodeproj -scheme GridPath \
  -destination 'platform=iOS Simulator,name=iPhone 16' build
```

## Ship to TestFlight

Signing mirrors the proven TechScroll pipeline (fastlane + ASC API key, Team `Q4MU4GRWRD`).

**Step 1 — create the App Store Connect record (one time, YOU run this).**
The ASC API key cannot create app records, so this needs an interactive Apple-ID 2FA login:

```bash
cd gridpath-ios
fastlane produce \
  -a com.deonmenezes.gridpath \
  -q "GridPath" \
  -u <your-apple-id-email>
# enter the 2FA code when prompted
```

This registers the bundle ID and creates the app record.

**Step 2 — build, sign, and upload to TestFlight.**

```bash
cd gridpath-ios
fastlane beta
```

`beta` regenerates the project, pins a provisioning profile to the existing
distribution cert (`USCKLYK64F`), forces manual Apple Distribution signing,
archives a Release `app-store` build, and uploads to TestFlight. The internal
tester group receives it automatically once Apple finishes processing.

To build a signed `.ipa` without uploading: `fastlane build_only` → `build/GridPath.ipa`.

### Bumping the build for later uploads
Increment `CURRENT_PROJECT_VERSION` (and `MARKETING_VERSION` for a new version) in
`project.yml`, then `fastlane beta` again.
