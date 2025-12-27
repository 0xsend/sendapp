# -*- mode: python -*-

load("./utils.Tiltfile", "files_matching")

contract_files = files_matching(
    os.path.join(
        config.main_dir,
        "packages",
        "contracts",
    ),
    lambda f: f.endswith(".sol") and f.find("cache") == -1 and f.find("lib") == -1,
)

DEBUG = os.getenv("DEBUG", "").find("tilt") != -1

CI = bool(os.getenv(
    "CI",
    config.tilt_subcommand == "ci",
))

# Workspace name for resource prefixing (avoids collisions between worktrees)
# Falls back to "sendapp" if WORKSPACE_NAME not set (for backwards compatibility)
WORKSPACE_NAME = os.getenv("WORKSPACE_NAME", "sendapp")

def ws_container(name):
    """Prefix a container name with the workspace name to avoid collisions.

    Example: ws_container("aa-bundler") -> "bb-dev-aa-bundler" (if WORKSPACE_NAME=bb-dev)
    """
    return WORKSPACE_NAME + "-" + name

run_id = str(local(
    "echo $RANDOM | shasum | head -c 10",
    echo_off = True,
    quiet = True,
)).strip()

def get_cfg():
    envcfg = os.getenv("TILT_CONFIGURED_PARSED")
    if envcfg == None:
        _cfg = None
    else:
        _cfg = decode_json(envcfg)
    if _cfg == None or _cfg.get("run_id") != run_id:
        config.define_string_list(
            "args",
            args = True,
        )

        config.define_bool("dockerize", False, "Whether to build and run the apps in docker")
        config.define_bool("skip_docker_compose", False, "Whether to skip running docker compose for next app")

        _cfg = config.parse()

        _cfg["run_id"] = run_id

        config.set_enabled_resources(_cfg.get("args", []))

        os.putenv("TILT_CONFIGURED_PARSED", encode_json(_cfg))

    return struct(
        args = _cfg.get("args", []),
        dockerize = _cfg.get("dockerize", CI),
        skip_docker_compose = _cfg.get("skip_docker_compose", False),
    )

CFG = get_cfg()

