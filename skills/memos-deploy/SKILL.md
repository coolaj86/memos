---
name: memos-deploy
description: Build and deploy a Memos binary with its embedded frontend and correct version metadata.
---

# Memos deployment

Use this skill for source builds of Memos. The Go binary embeds files from
`server/router/frontend/dist`, so the frontend must be built before compiling
Memos.

## Build

Run from the repository root:

```sh
corepack pnpm --dir web install --frozen-lockfile
corepack pnpm --dir web release
```

Build for the target OS and architecture. Memos reads build metadata from the
`internal/version` package, not from `main`:

```sh
build_version=$(git describe --tags --always --dirty 2>/dev/null || echo dev)
build_commit=$(git rev-parse --short HEAD)
build_date=$(date '+%F %T %Z')
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build \
  -ldflags="-s -w \
    -X github.com/usememos/memos/internal/version.Version=${build_version} \
    -X github.com/usememos/memos/internal/version.Commit=${build_commit}" \
  -o ./build/memos-linux-amd64 ./cmd/memos
```

Confirm that `server/router/frontend/dist/index.html` exists before the Go
build. A binary built without it fails with `No embeddable frontend found`.

The binary exposes metadata through:

```sh
./build/memos-linux-amd64 version
```

There is no `-V` or `--version` flag in the current CLI.

## Deploy

First verify SSH access using the same identity mode used for copy operations:

```sh
ssh -o IdentitiesOnly=no <user>@<host> 'echo connected'
```

Upload to a temporary name. Check its version before replacing the running
binary:

```sh
scp -o IdentitiesOnly=no ./build/memos-linux-amd64 \
  <user>@<host>:~/bin/memos.new
ssh -o IdentitiesOnly=no <user>@<host> '~/bin/memos.new version'
```

Before replacement, inspect the old binary with `version`, `-V`, `-v`, and
`--help` as available. Use the old version and commit in the rollback name.
If no useful version information is exposed, use a short descriptive reason.
Never use an opaque `.old` name.

Examples:

```text
memos.before-v0.31.0-rc.1-abc1234.bin
memos.before-feat-unlisted.bin
```

Replace the placeholders with the actual old binary identity and deployment
reason:

```sh
ssh -o IdentitiesOnly=no <user>@<host> 'set -eu
chmod 0755 ~/bin/memos.new
mv ~/bin/memos ~/bin/memos.before-<old-version>-<old-commit>.bin
mv ~/bin/memos.new ~/bin/memos
. ~/.config/envman/PATH.env
serviceman restart memos
sleep 2
~/bin/memos version
'
```

The service should bind to the deployment’s configured plain HTTP port when a
TLS router terminates TLS upstream. Do not add TLS termination to Memos.

## Verify

```sh
ssh -o IdentitiesOnly=no <user>@<host> 'set -eu
ps -o pid,args -C memos
curl -fsSI http://127.0.0.1:<port>/ | head -n 10
. ~/.config/envman/PATH.env
serviceman logs memos | tail -n 20
'
```

Check for a successful startup message, the expected version, and HTTP 200.
Keep the rollback binary on the host until the deployment is accepted.
