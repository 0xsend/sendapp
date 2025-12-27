# -*- mode: python -*-

load("./common.Tiltfile", "ws_container")

local("""
bun run ../bin/reset-supabase.ts || true
docker ps -a | grep {aa_bundler} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep shovel | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {otterscan_mainnet} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep {otterscan_base} | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep next-app | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep sendapp-anvil-ethmainnet | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep sendapp-anvil-base | awk '{{print $1}}' | xargs -r docker rm -f
pkill anvil || true
git clean -fxd ./var
""".format(
    aa_bundler = ws_container("aa-bundler"),
    otterscan_mainnet = ws_container("otterscan-mainnet"),
    otterscan_base = ws_container("otterscan-base"),
))

local("yarn clean || true")

