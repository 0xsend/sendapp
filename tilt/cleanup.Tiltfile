# -*- mode: python -*-

load("./common.Tiltfile", "WORKSPACE_NAME", "ws_container")

# Stop localnet compose services (anvil, bundler, shovel, otterscan)
local("""
docker compose -f ../compose.localnet.yaml -p {project} down --remove-orphans 2>/dev/null || true
""".format(
    project = WORKSPACE_NAME,
))

# Stop any legacy containers that might still exist
local("""
docker ps -a | grep {next_app} | awk '{{print $1}}' | xargs -r docker rm -f
""".format(
    next_app = ws_container("next-app"),
))

# Reset Supabase and clean var directory
local("""
bun run ../bin/reset-supabase.ts || true
git clean -fxd ./var
""")

local("yarn clean || true")

