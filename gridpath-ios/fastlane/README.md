fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios gen

```sh
[bundle exec] fastlane ios gen
```

Regenerate the Xcode project from project.yml

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Archive with App Store signing (API key) and upload to TestFlight

### ios tf_info

```sh
[bundle exec] fastlane ios tf_info
```

Show TestFlight build state + beta groups + testers

### ios distribute

```sh
[bundle exec] fastlane ios distribute
```

Create internal group, add tester, attach latest build (raw ASC API)

### ios verify_tester

```sh
[bundle exec] fastlane ios verify_tester
```

Deliver the latest build to a tester: internal if they're a team user, else external group + beta review

### ios finalize_appstore

```sh
[bundle exec] fastlane ios finalize_appstore
```

Raw-API prep: attach latest VALID build, content rights, age rating (4+), upload screenshots

### ios age_rating

```sh
[bundle exec] fastlane ios age_rating
```

Set the app age rating to 4+ via the fastlane update_app_age_rating action (new ASC age-rating API)

### ios set_age_rating

```sh
[bundle exec] fastlane ios set_age_rating
```

Raw-API: set the age-rating declaration (4+, all None) via the live relationship id

### ios submit_review

```sh
[bundle exec] fastlane ios submit_review
```

Raw-API: create a review submission for the editable version and submit (surfaces blockers)

### ios upload_meta

```sh
[bundle exec] fastlane ios upload_meta
```

Upload App Store metadata + screenshots to the editable version (no binary, no submit)

### ios asc_status

```sh
[bundle exec] fastlane ios asc_status
```

Dump App Store Connect state: app, versions+states, builds, agreements signal

### ios build_only

```sh
[bundle exec] fastlane ios build_only
```

Build a signed .ipa only (no upload)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
