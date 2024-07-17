# -*- mode: python -*-

load("./common.Tiltfile", "CFG", "CI")
load("./utils.Tiltfile", "ts_files")

labels = ["apps"]

next_app_resource_deps = [
    "yarn:install",
    "supabase",
    "anvil:fixtures",
    "shovel",
    "temporal",
    "aa_bundler:base",
    "workers",
] + ([
    "supabase:generate",
    "wagmi:generate",
    "ui:build",
    "ui:generate-theme",
    "daimo-expo-passkeys:build",
] if not CFG.dockerize else [])

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
    docker_compose("../docker-compose.yml")
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
        "yarn turbo build --filter=next-app" if CI else "",  # In CI, only build the web app
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
    auto_init = False,  # TODO(@0xBigBoss) eventually we will want to remove this
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
    serve_cmd = "caddy run --watch --config ../dev.Caddyfile",
    trigger_mode = TRIGGER_MODE_MANUAL,
)

local_resource(
    "workers",
    allow_parallel = True,
    labels = labels,
    links = [
        link("http://localhost:8233", "Temporal Web UI"),
    ],
    resource_deps = [
        "yarn:install",
        "supabase",
        "supabase:generate",
        "wagmi:generate",
        "temporal",
    ],
    serve_cmd = "yarn workspace workers start",
    deps = ts_files(
        config.main_dir + "/packages/workflows/src",
        config.main_dir + "/apps/workers",
    ),
)

