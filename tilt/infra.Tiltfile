# -*- mode: python -*-

load("./common.Tiltfile", "CI", "WORKSPACE_NAME", "ws_container")
load("ext://uibutton", "cmd_button", "location")

_prj_root = os.path.join(
    os.getcwd(),
    "..",
)

_infra_resource_deps = ["yarn:install"]

labels = ["infra"]

supabase_exclude = [
    "edge-runtime",
    "realtime",
    "logflare",
    "vector",
] + (["studio"] if CI else [])

# Port configuration - use env vars from .localnet.env or defaults
_supabase_api_port = os.getenv("SUPABASE_API_PORT", "54321")
_supabase_db_port = os.getenv("SUPABASE_DB_PORT", "54322")
_supabase_studio_port = os.getenv("SUPABASE_STUDIO_PORT", "54323")
_supabase_inbucket_port = os.getenv("SUPABASE_INBUCKET_PORT", "54324")
_supabase_inbucket_smtp_port = os.getenv("SUPABASE_INBUCKET_SMTP_PORT", "54325")
_supabase_inbucket_pop3_port = os.getenv("SUPABASE_INBUCKET_POP3_PORT", "54326")
_nextjs_port = os.getenv("NEXTJS_PORT", "3000")
_anvil_mainnet_port = os.getenv("ANVIL_MAINNET_PORT", "8545")
_anvil_base_port = os.getenv("ANVIL_BASE_PORT", "8546")
_bundler_port = os.getenv("BUNDLER_PORT", "3030")
_shovel_port = os.getenv("SHOVEL_PORT", "8383")
_otterscan_mainnet_port = os.getenv("OTTERSCAN_MAINNET_PORT", "5100")
_otterscan_base_port = os.getenv("OTTERSCAN_BASE_PORT", "5101")
_temporal_port = os.getenv("TEMPORAL_PORT", "7233")
_temporal_ui_port = os.getenv("TEMPORAL_UI_PORT", "8233")

# Set Supabase env vars with defaults if not already set (for developers not using gen-env)
if not os.getenv("SUPABASE_API_PORT"):
    os.putenv("SUPABASE_API_PORT", _supabase_api_port)
if not os.getenv("SUPABASE_DB_PORT"):
    os.putenv("SUPABASE_DB_PORT", _supabase_db_port)
if not os.getenv("SUPABASE_STUDIO_PORT"):
    os.putenv("SUPABASE_STUDIO_PORT", _supabase_studio_port)
if not os.getenv("SUPABASE_INBUCKET_PORT"):
    os.putenv("SUPABASE_INBUCKET_PORT", _supabase_inbucket_port)
if not os.getenv("SUPABASE_INBUCKET_SMTP_PORT"):
    os.putenv("SUPABASE_INBUCKET_SMTP_PORT", _supabase_inbucket_smtp_port)
if not os.getenv("SUPABASE_INBUCKET_POP3_PORT"):
    os.putenv("SUPABASE_INBUCKET_POP3_PORT", _supabase_inbucket_pop3_port)
if not os.getenv("SUPABASE_AUTH_SITE_URL"):
    os.putenv("SUPABASE_AUTH_SITE_URL", "http://localhost:" + _nextjs_port)

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
    links = [link("http://localhost:" + _supabase_studio_port + "/", "Supabase Studio")],
    resource_deps = _infra_resource_deps,
    serve_cmd = "while true; do docker logs -f -n 1 supabase_db_" + WORKSPACE_NAME + "; sleep 1; done",
    serve_dir = _prj_root,
)

cmd_button(
    "supabase:db reset",
    argv = [
        "/bin/sh",
        "-c",
        "yarn workspace @my/supabase reset && yarn workspace @my/supabase generate",
    ],
    dir = _prj_root,
    icon_name = "restart_alt",
    location = location.NAV,
    resource = "supabase",
    text = "supabase db reset",
)

cmd_button(
    "supabase:db migrate",
    argv = [
        "/bin/sh",
        "-c",
        "bunx supabase db push --local --include-all",
    ],
    dir = os.path.join("..", "supabase"),
    icon_name = "play_arrow",
    location = location.RESOURCE,
    resource = "supabase",
    text = "supabase db migrate",
)

cmd_button(
    "snaplet:seed",
    argv = [
        "/bin/sh",
        "-c",
        "yarn snaplet seed",
    ],
    dir = _prj_root,
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
        "yarn snaplet restore",
    ],
    dir = _prj_root,
    icon_name = "settings_backup_restore",
    location = location.NAV,
    resource = "supabase",
    text = "snaplet restore",
)

local_resource(
    "anvil:mainnet",
    allow_parallel = True,
    auto_init = False,
    labels = labels,
    readiness_probe = probe(
        exec = exec_action(
            command = [
                "cast",
                "bn",
                "--rpc-url=127.0.0.1:" + _anvil_mainnet_port,
            ],
        ),
        initial_delay_secs = 1,
        period_secs = 2,
        timeout_secs = 5,
    ),
    resource_deps = _infra_resource_deps + ["supabase"],
    serve_cmd = [cmd for cmd in [
        "anvil",
        "--host=0.0.0.0",
        "--port=" + _anvil_mainnet_port,
        "--chain-id=" + os.getenv("NEXT_PUBLIC_MAINNET_CHAIN_ID", "1337"),
        "--fork-url=" + os.getenv("ANVIL_MAINNET_FORK_URL", "https://eth-pokt.nodies.app"),
        "--block-time=" + os.getenv("ANVIL_BLOCK_TIME", "5"),
        "--no-storage-caching",
        "--prune-history",
        os.getenv("ANVIL_MAINNET_EXTRA_ARGS", "--silent"),
    ] if cmd],
    serve_dir = _prj_root,
)

local_resource(
    "otterscan:mainnet",
    allow_parallel = True,
    auto_init = False,
    labels = labels,
    links = [link("http://localhost:" + _otterscan_mainnet_port + "/", "Otterscan Mainnet")],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = int(_otterscan_mainnet_port),
        ),
        period_secs = 15,
        timeout_secs = 5,
    ),
    resource_deps = ["anvil:mainnet"],
    serve_cmd = """
    docker ps -a | grep {container_name} | awk '{{print $1}}' | xargs -r docker rm -f
    docker run --rm \
        --name {container_name} \
        -p {otterscan_port}:80 \
        --add-host=host.docker.internal:host-gateway \
        --env ERIGON_URL="http://host.docker.internal:{anvil_port}" \
        otterscan/otterscan:v2.3.0
    """.format(
        container_name = ws_container("otterscan-mainnet"),
        otterscan_port = _otterscan_mainnet_port,
        anvil_port = _anvil_mainnet_port,
    ),
    serve_dir = _prj_root,
)

local_resource(
    "anvil:base",
    allow_parallel = True,
    labels = labels,
    readiness_probe = probe(
        exec = exec_action(
            command = [
                "cast",
                "bn",
                "--rpc-url=127.0.0.1:" + _anvil_base_port,
            ],
        ),
        initial_delay_secs = 1,
        period_secs = 2,
        timeout_secs = 5,
    ),
    resource_deps = _infra_resource_deps + ["supabase"],
    serve_cmd = "ANVIL_BASE_PORT=" + _anvil_base_port + " yarn contracts dev:anvil-base-node",
    serve_dir = _prj_root,
)

local_resource(
    "anvil:anvil-add-send-merkle-drop-fixtures",
    "yarn contracts dev:anvil-add-send-merkle-drop-fixtures",
    auto_init = False,
    dir = _prj_root,
    labels = labels,
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "contracts:build",
    ],
    trigger_mode = TRIGGER_MODE_MANUAL,
)

local_resource(
    "anvil:anvil-token-paymaster-deposit",
    "yarn contracts dev:anvil-token-paymaster-deposit",
    dir = _prj_root,
    labels = labels,
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "contracts:build",
    ],
)

local_resource(
    "anvil:anvil-deploy-verifying-paymaster-fixtures",
    "yarn contracts dev:anvil-deploy-verifying-paymaster-fixtures",
    dir = _prj_root,
    labels = labels,
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "contracts:build",
    ],
)

local_resource(
    "anvil:anvil-add-send-check-fixtures",
    "yarn contracts dev:anvil-add-send-check-fixtures",
    auto_init = False,
    dir = _prj_root,
    labels = labels,
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "contracts:build",
    ],
)

local_resource(
    "anvil:fixtures",
    "echo 🥳",
    labels = labels,
    resource_deps = [
        "anvil:base",
        "anvil:anvil-token-paymaster-deposit",
        "anvil:anvil-deploy-verifying-paymaster-fixtures",
    ],
)

local_resource(
    "aa_bundler:base",
    allow_parallel = True,
    labels = labels,
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = int(_bundler_port),
        ),
    ),
    resource_deps = [
        "anvil:base",
    ],
    serve_cmd = """
    docker ps -a | grep {container_name} | awk '{{print $1}}' | xargs -r docker rm -f
    docker run --rm \
        --name {container_name} \
        --add-host=host.docker.internal:host-gateway \
        -p 0.0.0.0:{bundler_port}:{bundler_port} \
        -v ./keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:/app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        -v ./apps/aabundler/etc:/app/etc/aabundler \
        -e "DEBUG={bundler_debug}" \
        -e "DEBUG_COLORS=true" \
        -m 500m \
        --pull always \
        docker.io/0xbigboss/bundler:latest \
        --port {bundler_port} \
        --config /app/etc/aabundler/aabundler.config.json \
        --mnemonic /app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --network http://host.docker.internal:{anvil_port} \
        --entryPoint 0x0000000071727De22E5E9d8BAf0edAc6f37da032 \
        --beneficiary 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --unsafe
""".format(
        container_name = ws_container("aa-bundler"),
        bundler_debug = os.getenv("BUNDLER_DEBUG", "aa.rpc"),
        bundler_port = _bundler_port,
        anvil_port = _anvil_base_port,
    ),
    serve_dir = _prj_root,
)

local_resource(
    "shovel",
    allow_parallel = True,
    labels = labels,
    links = ["http://localhost:" + _shovel_port + "/"],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/diag",
            port = int(_shovel_port),
        ),
    ),
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "shovel:generate-config",
    ],
    serve_cmd = "SHOVEL_PORT=" + _shovel_port + " yarn run shovel:tilt",
    serve_dir = os.path.join(
        config.main_dir,
        "packages/shovel",
    ),
    deps = [
        os.path.join(
            config.main_dir,
            "packages/shovel/bin/shovel.tilt.ts",
        ),
        os.path.join(
            config.main_dir,
            "packages/shovel/etc/config.json",
        ),
    ],
)

cmd_button(
    "shovel:empty",
    argv = [
        "/bin/sh",
        "-c",
        "yarn workspace @my/shovel run empty",
    ],
    dir = _prj_root,
    icon_name = "delete_forever",
    location = location.RESOURCE,
    resource = "shovel",
    text = "shovel:empty",
)

local_resource(
    "otterscan:base",
    allow_parallel = True,
    auto_init = not CI,
    labels = labels,
    links = [link("http://localhost:" + _otterscan_base_port + "/", "Otterscan Base")],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = int(_otterscan_base_port),
        ),
        period_secs = 15,
        timeout_secs = 5,
    ),
    resource_deps = _infra_resource_deps + [
        "anvil:base",
    ],
    serve_cmd = """
    docker ps -a | grep {container_name} | awk '{{print $1}}' | xargs -r docker rm -f
    docker run --rm \
        --name {container_name} \
        -p {otterscan_port}:80 \
        --add-host=host.docker.internal:host-gateway \
        --env ERIGON_URL="http://host.docker.internal:{anvil_port}" \
        otterscan/otterscan:v2.3.0
    """.format(
        container_name = ws_container("otterscan-base"),
        otterscan_port = _otterscan_base_port,
        anvil_port = _anvil_base_port,
    ),
    serve_dir = _prj_root,
)

local_resource(
    name = "temporal",
    allow_parallel = True,
    labels = labels,
    links = [link("http://localhost:" + _temporal_ui_port, "Temporal Web UI")],
    resource_deps = [],
    serve_cmd = "temporal server start-dev --db-filename ./var/temporal.db --port " + _temporal_port + " --ui-port " + _temporal_ui_port,
    serve_dir = _prj_root,
)

cmd_button(
    "temporal:db reset",
    argv = [
        "/bin/sh",
        "-c",
        "rm -f ./var/temporal.db && tilt trigger temporal",
    ],
    dir = _prj_root,
    icon_name = "restart_alt",
    location = location.RESOURCE,
    resource = "temporal",
    text = "temporal db reset",
)

