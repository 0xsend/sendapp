load("ext://color", "color")
load("ext://dotenv", "dotenv")
load("ext://uibutton", "cmd_button", "location")
load("./tilt/common.tiltfile", "CFG", "CI", "DEBUG", "contract_files")
load("./tilt/utils.tiltfile", "files_matching", "require_env", "require_tools")

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

include("tilt/infra.tiltfile")

include("tilt/deps.tiltfile")

# APPS
labels = ["apps"]

next_app_resource_deps = [
    "yarn:install",
    "supabase",
    "supabase:generate",
    "wagmi:generate",
    "ui:build",
    "ui:generate-theme",
    "daimo-expo-passkeys:build",
    "anvil:fixtures",
    "shovel",
] + ([
    "aa_bundler:base",
] if not CI else [])

# Next
if CFG.dockerize:
    GIT_BRANCH = str(local("git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD")).strip()
    GIT_HASH = str(local("git rev-parse --short=10 HEAD")).strip()

    # FIXME: when we support dev mode and dockerize.
    # docker_build(
    #     "0xsend/sendapp/next-app",
    #     ".",
    #     dockerfile = "apps/next/Dockerfile",
    #     extra_tag = ["latest", GIT_HASH],
    #     platform = "linux/amd64",
    #     secret = [
    #         "id=SUPABASE_DB_URL,src=./var/SUPABASE_DB_URL.txt",
    #         "id=SUPABASE_SERVICE_ROLE,src=./var/SUPABASE_SERVICE_ROLE.txt",
    #     ],
    #     build_args=[

    #     ]
    # )
    docker_compose("./docker-compose.yml")
    dc_resource(
        "next-app",
        labels = ["apps"],
        new_name = "next:web",
        resource_deps = [
            "yarn:install",
            "supabase",
            "anvil:fixtures",
            "aa_bundler:base",
            "shovel",
        ],
    )
else:
    local_resource(
        "next:web",
        "yarn workspace next-app next:build" if CI else "",  # In CI, only build the web app
        labels = labels,
        links = ["http://localhost:3000"],
        readiness_probe = None if CI else probe(
            http_get = http_get_action(
                path = "/api/healthz",
                port = 3000,
            ),
            period_secs = 15,
        ),
        resource_deps = next_app_resource_deps,
        serve_cmd =
            "" if CI else "yarn next-app dev",  # In CI, playwright tests start the web server
    )

local_resource(
    "distributor:web",
    allow_parallel = True,
    labels = labels,
    links = ["http://localhost:3050"],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = 3050,
        ),
        period_secs = 15,
    ),
    resource_deps = [
        "yarn:install",
        "anvil:mainnet",
        "supabase",
        "supabase:generate",
        "wagmi:generate",
    ],
    serve_cmd =
        "yarn run distributor start" if CI else "yarn run distributor dev",
)

local_resource(
    "caddy:web",
    auto_init = not CI,
    labels = labels,
    serve_cmd = "caddy run --watch --config dev.Caddyfile",
    trigger_mode = TRIGGER_MODE_MANUAL,
)

# TESTS
labels = ["test"]

local_resource(
    "app:test",
    "yarn workspace app test",
    allow_parallel = True,
    labels = labels,
    resource_deps = [
        "yarn:install",
        "contracts:build",
        "wagmi:generate",
        "supabase:generate",
        "snaplet:generate",
        "ui:build",
        "ui:generate-theme",
        "daimo-expo-passkeys:build",
        "webauthn-authenticator:build",
        "shovel:generate-config",
    ],
    deps =
        files_matching(
            os.path.join("packages", "app"),
            lambda f: f.endswith(".ts") or f.endswith(".tsx"),
        ),
)

cmd_button(
    "app:test:update-snapshots",
    argv = [
        "yarn",
        "workspace",
        "app",
        "test",
        "-u",
    ],
    icon_name = "update",
    location = location.RESOURCE,
    resource = "app:test",
    text = "update snapshots",
)

local_resource(
    "webauthn-authenticator:test",
    "yarn workspace @0xsend/webauthn-authenticator test:coverage --run",
    allow_parallel = True,
    labels = labels,
    resource_deps = ["yarn:install"],
    deps =
        files_matching(
            os.path.join("packages", "webauthn-authenticator"),
            lambda f: f.endswith(".ts"),
        ),
)

local_resource(
    "playwright:deps",
    "echo 🥳",
    labels = labels,
    resource_deps = [
        "anvil:mainnet",
        "anvil:base",
        "anvil:fixtures",
        "aa_bundler:base",
        "snaplet:generate",
        "next:web",
        "supabase",
        "shovel",
    ],
)

local_resource(
    "playwright:test",
    "yarn playwright test",
    allow_parallel = True,
    auto_init = CI,
    labels = labels,
    resource_deps = [
        "next:web",
        "playwright:deps",
    ],
    trigger_mode = CI and TRIGGER_MODE_AUTO or TRIGGER_MODE_MANUAL,
    deps = files_matching(
        os.path.join("packages", "playwright"),
        lambda f: f.endswith(".ts"),
    ),
)

cmd_button(
    "playwright:show-report",
    argv = [
        "yarn",
        "playwright",
        "playwright",
        "show-report",
    ],
    icon_name = "info",
    location = location.RESOURCE,
    resource = "playwright:test",
    text = "playwright report",
)

cmd_button(
    "playwright:test:ui",
    argv = [
        "yarn",
        "playwright",
        "test",
        "--ui",
    ],
    icon_name = "bug_report",
    location = location.RESOURCE,
    resource = "playwright:test",
    text = "playwright test --ui",
)

local_resource(
    "distributor:test",
    "yarn workspace distributor test --run",
    allow_parallel = True,
    labels = labels,
    resource_deps = [
        "yarn:install",
        "anvil:mainnet",
        "supabase",
        "supabase:generate",
        "wagmi:generate",
    ],
    deps =
        files_matching(
            os.path.join("apps", "distributor", "test"),
            lambda f: f.endswith(".ts"),
        ),
)

local_resource(
    "supabase:test",
    "yarn supabase test",
    allow_parallel = True,
    labels = labels,
    resource_deps = [
        "supabase",
        "snaplet:generate",  # hack to ensure snaplet doesn't include test pg_tap schema
    ],
    deps = files_matching(
        os.path.join("supabase", "tests"),
        lambda f: f.endswith(".sql"),
    ),
)

local_resource(
    "contracts:test",
    "yarn contracts test",
    allow_parallel = True,
    labels = labels,
    resource_deps = [
        "yarn:install",
        "contracts:build",
    ],
    deps = contract_files,
)

local_resource(
    "contracts:cov",
    "yarn contracts test:cov -vvv",
    allow_parallel = True,
    auto_init = False,
    labels = labels,
    resource_deps = [
        "yarn:install",
        "contracts:build",
        "contracts:test",
    ],
    deps = contract_files,
)

local_resource(
    name = "shovel:test",
    allow_parallel = True,
    auto_init = not CI,
    cmd = "yarn workspace @my/shovel test",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "shovel:generate-config",
    ],
    trigger_mode = CI and TRIGGER_MODE_MANUAL or TRIGGER_MODE_AUTO,
    deps = files_matching(
        os.path.join("packages", "shovel", "etc"),
        lambda f: f.endswith(".json"),
    ),
)

local_resource(
    name = "unit-tests",
    allow_parallel = True,
    cmd = "echo 🥳",
    labels = labels,
    resource_deps = [
        # messy but create a single resource that runs all the tests
        "app:test",
        "webauthn-authenticator:test",
        "supabase:test",
        "contracts:test",
        "distributor:test",
    ],
)

if config.tilt_subcommand == "down":
    include("./tilt/cleanup.tiltfile")

