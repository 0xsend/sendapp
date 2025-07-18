# -*- mode: python -*-

load("./common.Tiltfile", "CI", "contract_files")
load("./utils.Tiltfile", "files_matching")
load("ext://uibutton", "cmd_button", "location")

labels = ["test"]

max_workers = str(local(
    "./.devops/bin/worker-count",
    dir = config.main_dir,
    echo_off = True,
    env = {"WORKER_PERCENT": os.environ.get("WORKER_PERCENT", "100%")},
    quiet = True,
)).strip()

local_resource(
    "app:test",
    """
    echo "Running with $MAX_WORKERS workers" && yarn workspace app test --maxWorkers=$MAX_WORKERS
    """,
    allow_parallel = True,
    env = {"MAX_WORKERS": max_workers},
    labels = labels,
    resource_deps = [
        "yarn:install",
        "contracts:build",
        "wagmi:generate",
        "supabase:generate",
        "snaplet:sync",
        "ui:build",
        "ui:generate-theme",
        "webauthn-authenticator:build",
        "shovel:generate-config",
    ],
    deps =
        files_matching(
            os.path.join(
                config.main_dir,
                "packages",
                "app",
            ),
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
            os.path.join(
                config.main_dir,
                "packages",
                "webauthn-authenticator",
            ),
            lambda f: f.endswith(".ts"),
        ),
)

local_resource(
    "playwright:deps",
    "echo 🥳",
    labels = labels,
    resource_deps = [
        "anvil:base",
        "anvil:fixtures",
        "aa_bundler:base",
        "snaplet:sync",
        "supabase",
        "shovel",
    ] + (["next:web"] if not CI else []),  # in CI, we will let playwright test start the web server
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
        "webauthn-authenticator:build",
    ],
    trigger_mode = CI and TRIGGER_MODE_AUTO or TRIGGER_MODE_MANUAL,
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "packages",
            "playwright",
        ),
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
    auto_init = False,  # TODO(@0xBigBoss) eventually we will want to remove this
    labels = labels,
    resource_deps = [
        "yarn:install",
        "supabase",
        "supabase:generate",
        "wagmi:generate",
    ],
    deps =
        files_matching(
            os.path.join(
                config.main_dir,
                "apps",
                "distributor",
                "test",
            ),
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
        "snaplet:sync",  # hack to ensure snaplet doesn't include test pg_tap schema
    ],
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "supabase",
            "tests",
        ),
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

# failing for now... the amounts differ when run in coverage mode
# local_resource(
#     "contracts:cov",
#     "yarn contracts test:cov -vvv",
#     allow_parallel = True,
#     auto_init = False,
#     labels = labels,
#     resource_deps = [
#         "yarn:install",
#         "contracts:build",
#         "contracts:test",
#     ],
#     deps = contract_files,
# )

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
        os.path.join(
            config.main_dir,
            "packages",
            "shovel",
            "etc",
        ),
        lambda f: f.endswith(".json"),
    ),
)

local_resource(
    "workers:test",
    allow_parallel = True,
    cmd = "yarn workspace @my/workflows test",
    labels = labels,
    resource_deps = [
        "yarn:install",
    ],
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "packages",
            "workflows",
        ),
        lambda f: f.endswith(".ts"),
    ),
)

local_resource(
    "next:test",
    """
    echo "Running with $MAX_WORKERS workers" && yarn workspace next-app test --maxWorkers=$MAX_WORKERS
    """,
    allow_parallel = True,
    env = {"MAX_WORKERS": max_workers},
    labels = labels,
    resource_deps = [
        "yarn:install",
        "supabase:generate",
        "wagmi:generate",
        "ui:build",
        "ui:generate-theme",
    ],
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "apps",
            "next",
        ),
        lambda f: f.endswith(".ts") or f.endswith(".tsx"),
    ),
)

cmd_button(
    "next:test:update-snapshots",
    argv = [
        "yarn",
        "workspace",
        "next-app",
        "test",
        "-u",
    ],
    icon_name = "update",
    location = location.RESOURCE,
    resource = "next:test",
    text = "update snapshots",
)

local_resource(
    "snaplet:test",
    "yarn workspace @my/snaplet test",
    allow_parallel = True,
    labels = labels,
    resource_deps = [
        "yarn:install",
        "supabase",
        "snaplet:sync",
    ],
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "packages",
            "snaplet",
        ),
        lambda f: f.endswith(".ts"),
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
        "workers:test",
        "next:test",
        "snaplet:test",
    ],
)

