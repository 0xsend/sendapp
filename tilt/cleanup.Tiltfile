# -*- mode: python -*-

load("./common.Tiltfile", "WORKSPACE_NAME", "ws_container")

local("""
bun run ../bin/reset-supabase.ts || true
docker ps -a | grep {aa_bundler} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {shovel} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {otterscan_mainnet} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {otterscan_base} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {next_app} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {anvil_mainnet} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {anvil_base} | awk '{{print $1}}' | xargs -r docker rm -f
git clean -fxd ./var
""".format(
    aa_bundler = ws_container("aa-bundler"),
    shovel = ws_container("shovel"),
    otterscan_mainnet = ws_container("otterscan-mainnet"),
    otterscan_base = ws_container("otterscan-base"),
    next_app = ws_container("next-app"),
    anvil_mainnet = ws_container("anvil-mainnet"),
    anvil_base = ws_container("anvil-base"),
))

local("yarn clean || true")

