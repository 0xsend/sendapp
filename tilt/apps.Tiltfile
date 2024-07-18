# -*- mode: python -*-

load("./common.Tiltfile", "CFG", "CI")
load("./utils.Tiltfile", "ts_files", "require_tools")
load("ext://color", "color")



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
    NEXT_COMPOSE_IMAGE = str("sendapp/next-app-{}:{}".format(GIT_BRANCH, GIT_HASH))
    print(color.blue("Checking if {} exists locally".format(NEXT_COMPOSE_IMAGE)))
    inspect_output = str(local("docker image inspect {NEXT_COMPOSE_IMAGE} --format='FYSI' 2>/dev/null || echo 'Nope'".format(NEXT_COMPOSE_IMAGE=NEXT_COMPOSE_IMAGE), quiet=True, echo_off=True)).strip()
    if inspect_output != "FYSI":
        print(color.yellow("{} does not exist locally, Building docker image".format(NEXT_COMPOSE_IMAGE)))
        local_resource(
            "next-docker-build",
            cmd="make docker-web",
            trigger_mode=TRIGGER_MODE_MANUAL or TRIGGER_MODE_AUTO,
            auto_init=False,
            labels=["apps"],
            deps = require_tools(
                "make",
            ),
            resource_deps = [
                "next-docker-build:update",
            ],
            )
    else:
        print(color.green("{} exists locally".format(NEXT_COMPOSE_IMAGE)))
    os.putenv("NEXT_COMPOSE_IMAGE", NEXT_COMPOSE_IMAGE)

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

