load("ext://color", "color")
load("ext://dotenv", "dotenv")
load("ext://uibutton", "cmd_button", "location")
load("./tilt/common.tiltfile", "CFG", "CI", "contract_files")
load("./tilt/utils.tiltfile", "files_matching", "require_tools")

print(color.green("███████╗███████╗███╗   ██╗██████╗     ██╗████████╗"))

print(color.green("██╔════╝██╔════╝████╗  ██║██╔══██╗    ██║╚══██╔══╝"))

print(color.green("███████╗█████╗  ██╔██╗ ██║██║  ██║    ██║   ██║"))

print(color.green("╚════██║██╔══╝  ██║╚██╗██║██║  ██║    ██║   ██║"))

print(color.green("███████║███████╗██║ ╚████║██████╔╝    ██║   ██║"))

print(color.green("╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝     ╚═╝   ╚═╝"))

require_tools("yarn", "docker", "jq", "yj", "forge", "anvil", "caddy", "node", "bun")

DEBUG = os.getenv("DEBUG", "").find("tilt") != -1

print(color.cyan("Config: " + str(CFG)))

if CI:
    print(color.magenta("Running in CI mode"))

# check if .env.local exists if not create it
if not os.path.exists(".env.local"):
    local("cp .env.local.template .env.local", echo_off = True, quiet = True)

for dotfile in [
    ".env",
    ".env.local",  # last one wins
]:
    if os.path.exists(dotfile):
        print(color.green("Loading environment from " + dotfile))
        dotenv(fn = dotfile)

include("tilt/infra.tiltfile")

include("tilt/deps.tiltfile")

# APPS
labels = ["apps"]

# Next
if CI or CFG.get("dockerize"):
    GIT_HASH = str(local("git rev-parse --short=10 HEAD")).strip()
    os.putenv("GIT_HASH", GIT_HASH)
    docker_build(
        "0xsend/sendapp/next-app",
        ".",
        dockerfile = "apps/next/Dockerfile",
        extra_tag = ["latest", GIT_HASH],
        secret = [
            "id=NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
            "id=NEXT_PUBLIC_SUPABASE_URL",
            "id=SUPABASE_SERVICE_ROLE",
            "id=NEXT_PUBLIC_SUPABASE_ANON_KEY",
        ],
    )
    docker_compose("./docker-compose.yml")
    dc_resource("next-app", labels = ["apps"], new_name = "next:web")
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
        resource_deps = [
            "yarn:install",
            "supabase",
            "supabase:generate",
            "wagmi:generate",
            "ui:build",
            "ui:generate-theme",
            "daimo-expo-passkeys:build",
            "anvil:fixtures",
        ] + ([
            "aa_bundler:base",
        ] if not CI else []),
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
    serve_cmd = "caddy run --watch --config Caddyfile.dev",
    trigger_mode = TRIGGER_MODE_MANUAL,
    deps = [
        "Caddyfile.dev",
    ],
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
    auto_init = CI == True,
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

