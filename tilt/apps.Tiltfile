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
] if not CFG.dockerize else [])

# Next (disabled for now)
if False and CFG.dockerize:
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

    # Only run docker compose and dc_resource if skip_docker_compose is False
    if not CFG.skip_docker_compose:
        docker_compose(
            configPaths = ["../docker-compose.yml"],
            env_file = "../.env.local" if os.path.exists("../.env.local") else None,
        )
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
        links = ["http://localhost:" + os.getenv("NEXTJS_PORT", 3000)],
        readiness_probe = None if CI else probe(
            http_get = http_get_action(
                path = "/api/healthz",
                port = int(os.getenv("NEXTJS_PORT", 3000)),
            ),
            period_secs = 15,
        ),
        resource_deps = next_app_resource_deps,
        serve_cmd =
            "" if CI else "yarn next-app dev -p $NEXTJS_PORT",  # In CI, playwright tests start the web server
        serve_env = {"NEXTJS_PORT": os.getenv("NEXTJS_PORT", 3000)},
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
        "temporal:build",
        "temporal",
        "workflows:build",
    ],
    serve_cmd = "yarn workspace workers start",
    deps = ts_files(
        config.main_dir + "/packages/workflows/src",
        config.main_dir + "/apps/workers",
    ),
)

