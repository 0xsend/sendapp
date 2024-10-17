# -*- mode: python -*-

load("./common.Tiltfile", "CI", "contract_files")
load("./utils.Tiltfile", "files_matching")
load("ext://uibutton", "cmd_button", "location")

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
    resource_deps = [
        "yarn:install",
        "contracts:build",
        "ui:build",
    ],
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
        "anvil:fixtures",
    ],
    deps =
        [os.path.join(
            config.main_dir,
            "packages",
            "wagmi",
            "wagmi.config.ts",
        )] +
        files_matching(
            os.path.join(
                config.main_dir,
                "packages",
                "wagmi",
                "src",
            ),
            lambda f: f.endswith(".ts") and f.find("generated.ts") == -1,
        ) + files_matching(
            os.path.join(
                config.main_dir,
                "packages",
                "contracts",
                "broadcast",
            ),
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
        os.path.join(
            config.main_dir,
            "supabase",
            "migrations",
        ),
        lambda f: f.endswith(".sql"),
    ),
)

local_resource(
    name = "snaplet:sync",
    allow_parallel = True,
    cmd = "yarn snaplet sync",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "supabase",
    ],
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "supabase",
            "migrations",
        ),
        lambda f: f.endswith(".sql"),
    ),
)

ui_theme_dir = os.path.join(
    config.main_dir,
    "packages",
    "ui",
    "src",
    "themes",
)

ui_theme_files = files_matching(
    ui_theme_dir,
    lambda f: (f.endswith(".tsx") or f.endswith(".ts")) and f.find("generated.ts") == -1,
)

ui_files = files_matching(
    os.path.join(
        config.main_dir,
        "packages",
        "ui",
        "src",
    ),
    lambda f: (f.endswith(".tsx") or f.endswith(".ts")) and (f.endswith("theme-generated.ts") or f.find(ui_theme_dir) == -1),
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
               os.path.join(
                   config.main_dir,
                   "packages",
                   "daimo-expo-passkeys",
                   "src",
               ),
               lambda f: (f.endswith(".tsx") or f.endswith(".ts")),
           ) +
           files_matching(
               os.path.join(
                   config.main_dir,
                   "packages",
                   "daimo-expo-passkeys",
                   "ios",
               ),
               lambda f: f.endswith(".swift"),
           ) +
           files_matching(
               os.path.join(
                   config.main_dir,
                   "packages",
                   "daimo-expo-passkeys",
                   "android",
               ),
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
            os.path.join(
                config.main_dir,
                "packages",
                "webauthn-authenticator",
                "src",
            ),
            lambda f: f.endswith(".ts"),
        ),
)

local_resource(
    name = "temporal:build",
    allow_parallel = True,
    cmd = "yarn workspace @my/temporal build",
    labels = labels,
    resource_deps = [
        "yarn:install",
    ],
    deps = ui_files,
)

local_resource(
    name = "shovel:generate-config",
    allow_parallel = True,
    cmd = "yarn workspace @my/shovel generate",
    labels = labels,
    resource_deps = [
        "yarn:install",
        "wagmi:generate",
    ],
    deps = files_matching(
        os.path.join(
            config.main_dir,
            "packages",
            "shovel",
        ),
        lambda f: f.endswith(".ts"),
    ),
)

cmd_button(
    name = "shovel:update-snapshot",
    argv = [
        "/bin/sh",
        "-c",
        "yarn workspace @my/shovel test --update-snapshots && yarn workspace @my/shovel generate",
    ],
    icon_name = "restart_alt",
    location = location.RESOURCE,
    resource = "shovel:test",
    text = "shovel update-snapshot",
)

