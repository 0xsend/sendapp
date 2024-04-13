load("ext://color", "color")
load("ext://dotenv", "dotenv")
load("ext://uibutton", "cmd_button", "location")
load("./etc/tilt/utils.tiltfile", "files_matching", "require_tools")

require_tools("yarn", "docker", "jq", "yj", "forge", "anvil", "caddy", "node", "bun")

CI = os.getenv("CI") != None

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

# DEPS
labels = ["deps"]

local_resource(
    "yarn:install",
    "yarn install" if not CI else "yarn install --immutable",
    labels = labels,
    deps = [
        "package.json",
        "yarn.lock",
    ],
)

local_resource(
    "lint",
    "yarn lint",
    allow_parallel = True,
    labels = labels,
)

cmd_button(
    "lint:fix",
    argv = [
        "yarn",
        "lint:fix",
    ],
    icon_name = "handyman",
    location = location.RESOURCE,
    resource = "lint",
    text = "yarn lint:fix",
)

contract_files = files_matching(
    os.path.join("packages", "contracts"),
    lambda f: f.endswith(".sol") and f.find("cache") == -1 and f.find("lib") == -1,
)

local_resource(
    name = "contracts:build",
    allow_parallel = True,
    cmd = "yarn contracts build --sizes",
    labels = labels,
    resource_deps = ["yarn:install"],
    deps = contract_files,
)

local_resource(
    name = "wagmi:generate",
    allow_parallel = True,
    cmd = "yarn wagmi generate",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "contracts:build",
        "anvil:send-account-fixtures",
    ],
    deps =
        [os.path.join("packages", "wagmi", "wagmi.config.ts")] +
        files_matching(
            os.path.join("packages", "wagmi", "src"),
            lambda f: f.endswith(".ts") and f.find("generated.ts") == -1,
        ) + files_matching(
            os.path.join("packages", "contracts", "broadcast"),
            lambda f: f.endswith("run-latest.json"),
        ),
)

local_resource(
    name = "supabase:generate",
    allow_parallel = True,
    cmd = "yarn supabase g",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "supabase",
    ],
    deps = files_matching(
        os.path.join("supabase", "migrations"),
        lambda f: f.endswith(".sql"),
    ),
)

local_resource(
    name = "snaplet:generate",
    allow_parallel = True,
    cmd = "bunx snaplet generate",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "supabase",
    ],
    deps = files_matching(
        os.path.join("supabase", "migrations"),
        lambda f: f.endswith(".sql"),
    ),
)

ui_theme_dir = os.path.join("packages", "ui", "src", "themes")

ui_theme_files = files_matching(
    ui_theme_dir,
    lambda f: (f.endswith(".tsx") or f.endswith(".ts")) and f.find("generated.ts") == -1,
)

ui_files = files_matching(
    os.path.join("packages", "ui", "src"),
    lambda f: (f.endswith(".tsx") or f.endswith(".ts")) and (f.find("generated.ts") == -1 and f.find(ui_theme_dir) == -1),
)

local_resource(
    name = "ui:build",
    allow_parallel = True,
    cmd = "yarn workspace @my/ui build",
    labels = labels,
    resource_deps = [
        "yarn:install",
    ],
    deps = ui_files,
)

local_resource(
    name = "ui:generate-theme",
    allow_parallel = True,
    cmd = "yarn workspace @my/ui generate-theme",
    labels = labels,
    resource_deps = [
        "yarn:install",
    ],
    deps = ui_theme_files,
)

local_resource(
    name = "daimo-expo-passkeys:build",
    allow_parallel = True,
    cmd = "yarn workspace @daimo/expo-passkeys build",
    labels = labels,
    resource_deps = [
        "yarn:install",
    ],
    deps = files_matching(
               os.path.join("packages", "daimo-expo-passkeys", "src"),
               lambda f: (f.endswith(".tsx") or f.endswith(".ts")),
           ) +
           files_matching(
               os.path.join("packages", "daimo-expo-passkeys", "ios"),
               lambda f: f.endswith(".swift"),
           ) +
           files_matching(
               os.path.join("packages", "daimo-expo-passkeys", "android"),
               lambda f: f.endswith(".kt"),
           ),
)

local_resource(
    name = "webauthn-authenticator:build",
    allow_parallel = True,
    cmd = "yarn workspace @0xsend/webauthn-authenticator build",
    labels = labels,
    resource_deps = ["yarn:install"],
    deps =
        files_matching(
            os.path.join("packages", "webauthn-authenticator", "src"),
            lambda f: f.endswith(".ts"),
        ),
)

local_resource(
    name = "shovel:generate-config",
    allow_parallel = True,
    cmd = "yarn workspace shovel generate",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "wagmi:generate",
    ],
    deps = files_matching(
        os.path.join("packages", "shovel"),
        lambda f: f.endswith(".ts"),
    ),
)

local_resource(
    name = "shovel:test",
    allow_parallel = True,
    auto_init = not CI,
    cmd = "yarn workspace shovel test",
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

cmd_button(
    name = "shovel:update-config",
    argv = [
        "/bin/sh",
        "-c",
        "yarn workspace shovel test --update-snapshots && yarn workspace shovel generate",
    ],
    icon_name = "restart_alt",
    location = location.RESOURCE,
    resource = "shovel:test",
    text = "shovel update-snapshot",
)

# INFRA
labels = ["infra"]

supabase_exclude = [
    "edge-runtime",
    "realtime",
    "logflare",
    "vector",
] + (["studio"] if CI else [])

local_resource(
    "supabase",
    [
        "yarn",
        "supabase",
        "start",
        "--exclude",
    ] + supabase_exclude,
    allow_parallel = True,
    labels = labels,
    links = [link("http://localhost:54323/", "Supabase Studio")],
    resource_deps = ["yarn:install"],
    serve_cmd = "while true; do docker logs -f -n 1 supabase_db_send; sleep 1; done",
)

if config.tilt_subcommand == "down":
    local("""
    yarn supabase stop --no-backup
    # can be removed once supabase stop --no-backup is fixed
    docker volume ls --filter label=com.supabase.cli.project=send | awk 'NR>1 {print $2}' | xargs -I {} docker volume rm {}
    docker ps -a | grep aa-bundler | awk '{{print $1}}' | xargs -r docker rm -f
    """)
    local("yarn clean")

cmd_button(
    "supabase:db reset",
    argv = [
        "/bin/sh",
        "-c",
        "yarn workspace @my/supabase reset && yarn workspace @my/supabase generate",
    ],
    icon_name = "restart_alt",
    location = location.NAV,
    resource = "supabase",
    text = "supabase db reset",
)

cmd_button(
    "snaplet:seed",
    argv = [
        "/bin/sh",
        "-c",
        "yarn snaplet:seed",
    ],
    icon_name = "compost",
    location = location.NAV,
    resource = "supabase",
    text = "snaplet seed",
)

cmd_button(
    "snaplet:snapshot:restore",
    argv = [
        "/bin/sh",
        "-c",
        "yarn snaplet:snapshot:restore",
    ],
    icon_name = "settings_backup_restore",
    location = location.NAV,
    resource = "supabase",
    text = "snaplet snapshot restore",
)

mainnet_fork_block_number = str(local(
    "cat packages/contracts/foundry.toml | yj -tj | jq .profile.mainnet.fork_block_number",
    echo_off = True,
    quiet = True,
)).strip()

if (mainnet_fork_block_number == ""):
    fail("mainnet_fork_block_number is empty")

local_resource(
    "anvil:mainnet",
    allow_parallel = True,
    labels = labels,
    readiness_probe = probe(
        exec = exec_action(
            command = [
                "cast",
                "bn",
                "--rpc-url=127.0.0.1:8545",
            ],
        ),
        initial_delay_secs = 1,
        period_secs = 2,
        timeout_secs = 5,
    ),
    serve_cmd = [cmd for cmd in [
        "anvil",
        "--host=0.0.0.0",
        "--port=8545",
        "--chain-id=" + os.getenv("NEXT_PUBLIC_MAINNET_CHAIN_ID", "1337"),
        "--fork-url=" + os.getenv("ANVIL_MAINNET_FORK_URL", "https://eth-pokt.nodies.app"),
        "--fork-block-number=" + mainnet_fork_block_number,
        "--block-time=" + os.getenv("ANVIL_BLOCK_TIME", "5"),
        os.getenv("ANVIL_MAINNET_EXTRA_ARGS", "--silent"),
    ] if cmd],
)

local_resource(
    "otterscan:mainnet",
    allow_parallel = True,
    auto_init = False,
    labels = labels,
    links = [link("http://localhost:5100/", "Otterscan Mainnet")],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = 5100,
        ),
        period_secs = 15,
        timeout_secs = 5,
    ),
    resource_deps = [
        "yarn:install",
        "anvil:base",
    ],
    serve_cmd = """
    docker ps -a | grep otterscan-mainnet | awk '{print $1}' | xargs -r docker rm -f
    docker run --rm \
        --name otterscan-mainnet \
        -p 5100:80 \
        --add-host=host.docker.internal:host-gateway \
        --env ERIGON_URL="http://host.docker.internal:8545" \
        otterscan/otterscan:v2.3.0
    """,
)

base_fork_block_number = str(local(
    "cat packages/contracts/foundry.toml | yj -tj | jq .profile.base.fork_block_number",
    echo_off = True,
    quiet = True,
)).strip()

if (base_fork_block_number == ""):
    fail("base_fork_block_number is empty")

local_resource(
    "anvil:base",
    allow_parallel = True,
    labels = labels,
    readiness_probe = probe(
        exec = exec_action(
            command = [
                "cast",
                "bn",
                "--rpc-url=127.0.0.1:8546",
            ],
        ),
        initial_delay_secs = 1,
        period_secs = 2,
        timeout_secs = 5,
    ),
    serve_cmd = [cmd for cmd in [
        "anvil",
        "--host=0.0.0.0",
        "--port=8546",
        "--chain-id=" + os.getenv("NEXT_PUBLIC_BASE_CHAIN_ID", "845337"),
        "--fork-url=" + os.getenv("ANVIL_BASE_FORK_URL", "https://base-pokt.nodies.app"),
        "--fork-block-number=" + base_fork_block_number,
        "--block-time=" + os.getenv("ANVIL_BASE_BLOCK_TIME", "2"),
        os.getenv("ANVIL_BASE_EXTRA_ARGS", "--silent"),
    ] if cmd],
)

local_resource(
    "anvil:send-account-fixtures",
    "yarn contracts dev:anvil-add-send-account-factory-fixtures",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "anvil:mainnet",
        "anvil:base",
        "contracts:build",
    ],
    trigger_mode = TRIGGER_MODE_MANUAL,
)

local_resource(
    "anvil:anvil-add-send-merkle-drop-fixtures",
    "yarn contracts dev:anvil-add-send-merkle-drop-fixtures",
    auto_init = False,
    labels = labels,
    resource_deps = [
        "yarn:install",
        "anvil:mainnet",
        "anvil:base",
        "contracts:build",
    ],
    trigger_mode = TRIGGER_MODE_MANUAL,
)

local_resource(
    "anvil:anvil-add-token-paymaster-fixtures",
    "yarn contracts dev:anvil-add-token-paymaster-fixtures",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "anvil:mainnet",
        "anvil:base",
        "contracts:build",
    ],
    trigger_mode = TRIGGER_MODE_MANUAL,
)

local_resource(
    "aa_bundler:base",
    allow_parallel = True,
    labels = labels,
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = 3030,
        ),
    ),
    resource_deps = [
        "yarn:install",
        "anvil:base",
    ],
    serve_cmd = """
    docker ps -a | grep aa-bundler | awk '{{print $1}}' | xargs -r docker rm -f
    docker run --rm \
        --name aa-bundler \
        --add-host=host.docker.internal:host-gateway \
        -p 3030:3030 \
        -v ./keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:/app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        -v ./etc/aa-bundler:/app/etc/aa-bundler \
        -e "DEBUG={bundler_debug}" \
        -e "DEBUG_COLORS=true" \
        docker.io/0xbigboss/bundler:0.7.0 \
        --port 3030 \
        --config /app/etc/aa-bundler/aa-bundler.config.json \
        --mnemonic /app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --network http://host.docker.internal:8546 \
        --entryPoint 0x0000000071727De22E5E9d8BAf0edAc6f37da032 \
        --beneficiary 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --unsafe
""".format(
        bundler_debug = os.getenv("BUNDLER_DEBUG", "aa.rpc"),
    ),
)

local_resource(
    "shovel",
    allow_parallel = True,
    auto_init = False,  # shovel eats a lot of RPCs, so we don't want it to start automatically
    labels = labels,
    links = ["http://localhost:8383/"],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/diag",
            port = 8383,
        ),
    ),
    resource_deps = [
        "yarn:install",
        "anvil:base",
        "supabase:test",
        "shovel:generate-config",
    ],
    serve_cmd = """
    docker ps -a | grep shovel | awk '{{print $1}}' | xargs -r docker rm -f
    docker pull docker.io/indexsupply/shovel:latest || true
    docker run --rm \
        --name shovel \
        --add-host=host.docker.internal:host-gateway \
        -p 8383:80 \
        --env DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres \
        --env BASE_NAME=base \
        --env BASE_RPC_URL=http://host.docker.internal:8546 \
        --env BASE_CHAIN_ID={chain_id} \
        --env BASE_BLOCK_START={bn} \
        --env DASHBOARD_ROOT_PASSWORD=shoveladmin \
        -v ./packages/shovel/etc:/etc/shovel \
        --entrypoint /usr/local/bin/shovel \
        -w /usr/local/bin \
        docker.io/indexsupply/shovel -l :80 -config /etc/shovel/config.json
    """.format(
        bn = base_fork_block_number,
        chain_id = os.getenv("NEXT_PUBLIC_BASE_CHAIN_ID", "845337"),
    ),
    trigger_mode = TRIGGER_MODE_MANUAL,
    deps = [
        "packages/shovel/etc/config.json",
    ],
)

local_resource(
    "otterscan:base",
    allow_parallel = True,
    auto_init = False,
    labels = labels,
    links = [link("http://localhost:5101/", "Otterscan Base")],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = 5101,
        ),
        period_secs = 15,
        timeout_secs = 5,
    ),
    resource_deps = [
        "yarn:install",
        "anvil:base",
    ],
    serve_cmd = """
    docker ps -a | grep otterscan-base | awk '{print $1}' | xargs -r docker rm -f
    docker run --rm \
        --name otterscan-base \
        -p 5101:80 \
        --add-host=host.docker.internal:host-gateway \
        --env ERIGON_URL="http://host.docker.internal:8546" \
        otterscan/otterscan:v2.3.0
    """,
)

# APPS
labels = ["apps"]

# Next
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
    ] + ([
        "anvil:mainnet",
        "anvil:base",
        "aa_bundler:base",
        "anvil:send-account-fixtures",
        # "anvil:anvil-add-send-merkle-drop-fixtures",
        "anvil:anvil-add-token-paymaster-fixtures",
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
        "anvil:send-account-fixtures",
        "aa_bundler:base",
        "snaplet:generate",
        "next:web",
        "supabase",
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
    labels = labels,
    resource_deps = [
        "yarn:install",
        "contracts:build",
        "contracts:test",
    ],
    deps = contract_files,
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
        "contracts:cov",
        "distributor:test",
    ],
)

