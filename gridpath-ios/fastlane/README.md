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

### ios build_only

```sh
[bundle exec] fastlane ios build_only
```

Build a signed .ipa only (no upload)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
