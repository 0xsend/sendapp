# -*- mode: python -*-

load("./utils.Tiltfile", "files_matching")

contract_files = files_matching(
    os.path.join("packages", "contracts"),
    lambda f: f.endswith(".sol") and f.find("cache") == -1 and f.find("lib") == -1,
)

DEBUG = os.getenv("DEBUG", "").find("tilt") != -1

CI = bool(os.getenv(
    "CI",
    config.tilt_subcommand == "ci",
))

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

        _cfg = config.parse()

        _cfg["run_id"] = run_id

        config.set_enabled_resources(_cfg.get("args", []))

        os.putenv("TILT_CONFIGURED_PARSED", encode_json(_cfg))

    return struct(
        args = _cfg.get("args", []),
        dockerize = _cfg.get("dockerize", CI),
    )

CFG = get_cfg()

