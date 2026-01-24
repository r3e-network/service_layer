# Decouple MiniApps Design

## Goal

Make the miniapp platform repo fully miniapp-agnostic by removing all local
miniapp sources, build artifacts, and tooling. Miniapps live in the
`r3e-network/miniapps` repo and use the platform SDK and submission pipeline.

## Scope

- Remove local miniapp assets and tools from the platform repo:
  `miniapps/`, `miniapps-scripts/`, `deploy-miniapps-live`,
  `platform/host-app/public/miniapps/`.
- Update active docs/READMEs to point to the external miniapps repo and
  submission workflow.
- Keep CDN path conventions (e.g. `/miniapps/<app>/...`) unchanged.
- Leave historical plans/reports untouched.

## Architecture

The platform repo becomes a pure submission/registry/hosting layer. Internal
miniapps are handled through the same submission pipeline with auto-approval,
but the platform does not contain any miniapp source code or build tooling.
The miniapps repo owns all miniapp source, per-app contracts, and build/publish
pipelines that upload bundles to the CDN.

## Data Flow

1. Miniapp repo submits a build via the external submission pipeline.
2. Internal repos are auto-approved by whitelist logic.
3. Build outputs are published to the CDN under `/miniapps/<app>/<version>/`.
4. Host app resolves and serves miniapps by `entry_url` from the registry view.

## Testing and Validation

- Add tests that assert local miniapp directories are absent.
- Keep docs checks that prevent `miniapps-uniapp` references in active docs.
- Ensure host-app routing tests referencing `/miniapps/...` continue to pass.

## Out of Scope

- SDK publishing details.
- Changes to historical plan or audit documents.
