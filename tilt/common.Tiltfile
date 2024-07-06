# ~*~ mode: Python ~*~

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

def get_cfg():
    if os.getenv("TILT_CONFIGURED_PARSED") == None:
        config.define_string_list(
            "args",
            args = True,
        )

        config.define_bool("dockerize", False, "Whether to build and run the apps in docker")

        _cfg = config.parse()

        config.set_enabled_resources(_cfg.get("args", []))
        os.putenv("TILT_CONFIGURED_PARSED", encode_json(_cfg))
    else:
        _cfg = decode_json(os.getenv("TILT_CONFIGURED_PARSED"))

    return struct(
        args = _cfg.get("args", []),
        dockerize = _cfg.get("dockerize", CI),
    )

CFG = get_cfg()

