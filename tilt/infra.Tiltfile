# -*- mode: python -*-

load("./common.Tiltfile", "CI")
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
    resource_deps = _infra_resource_deps,
    serve_cmd = "while true; do docker logs -f -n 1 supabase_db_send; sleep 1; done",
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
                "--rpc-url=127.0.0.1:8545",
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
        "--port=8545",
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
    links = [link("http://localhost:5100/", "Otterscan Mainnet")],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = 5100,
        ),
        period_secs = 15,
        timeout_secs = 5,
    ),
    resource_deps = ["anvil:mainnet"],
    serve_cmd = """
    docker ps -a | grep otterscan-mainnet | awk '{print $1}' | xargs -r docker rm -f
    docker run --rm \
        --name otterscan-mainnet \
        -p 5100:80 \
        --add-host=host.docker.internal:host-gateway \
        --env ERIGON_URL="http://host.docker.internal:8545" \
        otterscan/otterscan:v2.3.0
    """,
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
                "--rpc-url=127.0.0.1:8546",
            ],
        ),
        initial_delay_secs = 1,
        period_secs = 2,
        timeout_secs = 5,
    ),
    resource_deps = _infra_resource_deps + ["supabase"],
    serve_cmd = "yarn contracts dev:anvil-base-node",
    serve_dir = _prj_root,
)

local_resource(
    "anvil:anvil-deploy-send-merkle-drop-fixtures",
    "yarn contracts dev:deploy-send-merkle-drop",
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
    "anvil:anvil-add-send-merkle-drop-fixtures",
    "yarn contracts dev:anvil-add-send-merkle-drop-fixtures",
    auto_init = False,
    dir = _prj_root,
    labels = labels,
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "contracts:build",
        "anvil:anvil-deploy-send-merkle-drop-fixtures",
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
    "anvil:fixtures",
    "echo 🥳",
    labels = labels,
    resource_deps = [
        "anvil:base",
        "anvil:anvil-token-paymaster-deposit",
    ],
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
        "anvil:base",
    ],
    serve_cmd = """
    docker ps -a | grep aa-bundler | awk '{{print $1}}' | xargs -r docker rm -f
    docker run --rm \
        --name aa-bundler \
        --add-host=host.docker.internal:host-gateway \
        -p 0.0.0.0:3030:3030 \
        -v ./keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:/app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        -v ./apps/aabundler/etc:/app/etc/aabundler \
        -e "DEBUG={bundler_debug}" \
        -e "DEBUG_COLORS=true" \
        -m 200m \
        docker.io/0xbigboss/bundler:0.7.1-9ae4952 \
        --port 3030 \
        --config /app/etc/aabundler/aabundler.config.json \
        --mnemonic /app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --network http://host.docker.internal:8546 \
        --entryPoint 0x0000000071727De22E5E9d8BAf0edAc6f37da032 \
        --beneficiary 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --unsafe
""".format(
        bundler_debug = os.getenv("BUNDLER_DEBUG", "aa.rpc"),
    ),
    serve_dir = _prj_root,
)

local_resource(
    "shovel",
    allow_parallel = True,
    labels = labels,
    links = ["http://localhost:8383/"],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/diag",
            port = 8383,
        ),
    ),
    resource_deps = _infra_resource_deps + [
        "anvil:base",
        "shovel:generate-config",
    ],
    serve_cmd = "yarn run shovel:tilt",
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
    links = [link("http://localhost:5101/", "Otterscan Base")],
    readiness_probe = probe(
        http_get = http_get_action(
            path = "/",
            port = 5101,
        ),
        period_secs = 15,
        timeout_secs = 5,
    ),
    resource_deps = _infra_resource_deps + [
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
    serve_dir = _prj_root,
)

local_resource(
    name = "temporal",
    allow_parallel = True,
    labels = labels,
    links = [link("http://localhost:8233", "Temporal Web UI")],
    resource_deps = [],
    serve_cmd = "temporal server start-dev --db-filename ./var/temporal.db",
    serve_dir = _prj_root,
)

