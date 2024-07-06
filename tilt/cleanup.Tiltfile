local("""
bun run ../bin/reset-supabase.ts || true
docker ps -a | grep aa-bundler | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep shovel | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep otterscan-mainnet | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep otterscan-base | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep next-app | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep sendapp-anvil-ethmainnet | awk '{{print $1}}' | xargs -r docker rm -f
docker ps -a | grep sendapp-anvil-base | awk '{{print $1}}' | xargs -r docker rm -f
pkill anvil || true
git clean -fxd ./var
""")

local("yarn clean || true")

