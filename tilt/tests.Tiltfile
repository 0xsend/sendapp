# -*- mode: python -*-

load("ext://uibutton", "cmd_button", "location")
load("./common.Tiltfile", "CI", "contract_files")
load("./utils.Tiltfile", "files_matching")

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
    "workers:test",
    allow_parallel = True,
    cmd = "yarn workspace @my/workflows test",
    labels = labels,
    resource_deps = [
        "yarn:install",
    ],
    deps = files_matching(
        os.path.join("packages", "workflows"),
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
        "distributor:test",
        "workers:test",
    ],
)

