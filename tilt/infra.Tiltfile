# -*- mode: python -*-

load("./common.Tiltfile", "CI", "WORKSPACE_NAME", "ws_container")
load("ext://color", "color")
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
_anvil_base_port = os.getenv("ANVIL_BASE_PORT", "8546")
_bundler_port = os.getenv("BUNDLER_PORT", "3030")
_shovel_port = os.getenv("SHOVEL_PORT", "8383")
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

# ===========================================
# LOCALNET INFRASTRUCTURE (Docker Compose)
# ===========================================
# Provides connection-pooled anvil via nginx proxy to prevent
# CLOSE_WAIT exhaustion from bundler, shovel, and E2E tests.

# Ensure .localnet.env exists (copy from template if not)
if not os.path.exists("../.localnet.env"):
    local("cp .localnet.env.template .localnet.env", dir="..")
    print(color.green("📝 Created .localnet.env from template"))

# Fetch fork block height if not already set (current block - 30 to avoid reorgs)
_anvil_fork_url = os.getenv("ANVIL_BASE_FORK_URL", "")
if _anvil_fork_url and not os.getenv("ANVIL_BASE_FORK_BLOCK"):
    _current_block = int(str(local("cast bn --rpc-url " + _anvil_fork_url, quiet=True)).strip())
    _fork_block = str(_current_block - 30)
    os.putenv("ANVIL_BASE_FORK_BLOCK", _fork_block)

docker_compose(
    configPaths = ["../compose.localnet.yaml"],
    env_file = "../.localnet.env",
    project_name = WORKSPACE_NAME,
)

# Map compose services to Tilt resources
# anvil-base: Internal anvil node (not directly accessible)
# Note: Docker Compose resources don't depend on yarn:install since they run in containers
dc_resource(
    "anvil-base",
    labels = labels,
    new_name = "anvil:base-node",
    resource_deps = [],  # No deps - anvil container is self-contained
)

# anvil-proxy: Nginx reverse proxy with connection pooling
# This is what clients (bundler, shovel, E2E tests) connect to
dc_resource(
    "anvil-proxy",
    labels = labels,
    links = [link("http://localhost:" + _anvil_base_port + "/", "Anvil Base RPC")],
    new_name = "anvil:base",
    resource_deps = ["anvil:base-node"],
)

# aa-bundler: ERC-4337 bundler
# Depends on anvil:fixtures to ensure paymaster is funded before bundler starts
dc_resource(
    "aa-bundler",
    labels = labels,
    links = [link("http://localhost:" + _bundler_port + "/", "AA Bundler")],
    new_name = "aa_bundler:base",
    resource_deps = ["anvil:fixtures"],
)

# shovel: Blockchain indexer
# Depends on supabase for database and anvil for RPC
# Config is pre-generated and mounted from packages/shovel/etc/config.json
dc_resource(
    "shovel",
    labels = labels,
    links = [link("http://localhost:" + _shovel_port + "/", "Shovel")],
    resource_deps = ["anvil:base", "supabase"],  # Needs both anvil proxy and database
)

# otterscan-base: Block explorer (optional profile in compose, not started by default)
# To enable: docker compose -f compose.localnet.yaml --profile explorer up
# The dc_resource is not defined here because otterscan uses the "explorer" profile
# and is not included in the default compose services.

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

# Shovel empty button (clears indexed data)
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

