load("ext://color", "color")
load("ext://dotenv", "dotenv")
load("./tilt/common.Tiltfile", "CFG", "CI", "DEBUG")
load("./tilt/utils.Tiltfile", "require_env", "require_tools")

print(color.green("███████╗███████╗███╗   ██╗██████╗     ██╗████████╗"))

print(color.green("██╔════╝██╔════╝████╗  ██║██╔══██╗    ██║╚══██╔══╝"))

print(color.green("███████╗█████╗  ██╔██╗ ██║██║  ██║    ██║   ██║"))

print(color.green("╚════██║██╔══╝  ██║╚██╗██║██║  ██║    ██║   ██║"))

print(color.green("███████║███████╗██║ ╚████║██████╔╝    ██║   ██║"))

print(color.green("╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝     ╚═╝   ╚═╝"))

require_tools("yarn", "docker", "jq", "yj", "forge", "anvil", "caddy", "node", "bun")

print(color.cyan("Config: " + str(CFG)))

if CI:
    print(color.magenta("Running in CI mode"))

# check if .env.local exists if not create it
if not os.path.exists(".env.local"):
    local("cp .env.local.template .env.local")
    print(color.green("📝 Created .env.local"))
    if CFG.dockerize:
        sed = str(local("which gsed || which sed")).strip()
        if sed == "":
            print(color.red("Could not find sed. Please install it and try again."))
            exit(1)

        # replace NEXT_PUBLIC_SUPABASE_URL with the dockerized supabase url
        local(sed + " -i 's/localhost/host.docker.internal/' .env.local")

        # except NEXT_PUBLIC_URL
        local(sed + " -i 's/NEXT_PUBLIC_URL=http:\\/\\/host.docker.internal/NEXT_PUBLIC_URL=http:\\/\\/localhost/' .env.local")
        print(color.green("📝 Dockerized .env.local"))

for dotfile in [
    ".env",
    ".env.development",
    ".env.local",  # last one wins
]:
    if os.path.exists(dotfile):
        print(color.green("Loading environment from " + dotfile))
        dotenv(fn = dotfile)

require_env(
    "ANVIL_BASE_FORK_URL",
    "ANVIL_MAINNET_FORK_URL",
)

# ensure .env matches what's in .env.local.template
for line in str(read_file(".env.local.template")).split("\n"):
    if line.startswith("#") or line == "":
        continue
    key, _ = line.split("=", 1)
    print(color.blue("checking for " + key)) if DEBUG else None
    require_env(key)

# dockerize checks
if CFG.dockerize:
    # ensure host.docker.internal is resolvable
    host_docker_rdy = str(local("ping -c 1 host.docker.internal || true", echo_off = True, quiet = True)).strip()
    if host_docker_rdy.find("server can't find host.docker.interna") != -1:
        print(color.red("Could not resolve host.docker.internal domain.") + """
    
Add the following to your /etc/hosts file:
    
127.0.0.1 host.docker.internal
        """)
        fail(color.red("Could not resolve host.docker.internal domain."))

    # ensure NEXT_PUBLIC_SUPABASE_URL is pointing to the correct host
    if not os.getenv("NEXT_PUBLIC_SUPABASE_URL").startswith("http://host.docker.internal"):
        print(color.red("NEXT_PUBLIC_SUPABASE_URL is not pointing to host.docker.internal. Please update your environment to point to a local supabase instance."))
        fail(color.red("NEXT_PUBLIC_SUPABASE_URL is not pointing to host.docker.internal"))

include("tilt/infra.Tiltfile")

include("tilt/deps.Tiltfile")

include("./tilt/apps.Tiltfile")

include("./tilt/tests.Tiltfile")

if config.tilt_subcommand == "down":
    include("./tilt/cleanup.Tiltfile")

