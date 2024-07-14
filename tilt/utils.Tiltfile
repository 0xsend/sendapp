# -*- mode: python -*-

load("ext://color", "color")

def require_tools(*tools):
    """
    Ensures that the given tool is available in the PATH.
    If not, an exception is raised.
    """
    for tool in tools:
        msg = "%s is required but was not found in PATH" % tool
        tool = shlex.quote(tool)
        local(
            command = 'command -v %s >/dev/null 2>&1 || { echo >&2 "%s"; exit 1; }' % (tool, msg),
            command_bat = [
                "powershell.exe",
                "-Noninteractive",
                "-Command",
                '& {{if (!(Get-Command %s -ErrorAction SilentlyContinue)) {{ Write-Error "%s"; exit 1 }}}}' % (tool, msg),
            ],
            echo_off = True,
            quiet = True,
        )

def require_env(*envs):
    """
    Ensures that the given environment variables are set.
    If not, an exception is raised.
    """
    for env in envs:
        msg = "%s is required but was not found in ENV" % env
        if os.getenv(env, "") == "":
            fail(color.red("Missing required environment variable: " + env))

def files_matching(dir, lambda_):
    return [f for f in listdir(dir, recursive = True) if lambda_(f)]

def ts_files(*paths):
    """Returns a list of all TypeScript files in the given paths, excluding spec and test files."""
    files = []
    for path in paths:
        files = (files +
                 str(local("find %s -name '*.ts' -not \\( -name '*spec.ts' -o -name '*test.ts' \\)" % path, echo_off = True, quiet = True)).strip().splitlines() +
                 str(local("find %s -name '*.tsx' -not \\( -name '*spec.tsx' -o -name '*test.tsx' \\)" % path, echo_off = True, quiet = True)).strip().splitlines())
    return files

def replace_in_file(file, pattern, replacement, echo_off = True, quiet = True):
    """Replaces a pattern in a file with a replacement."""
    sed = str(local("which gsed || which sed", echo_off = echo_off, quiet = quiet)).strip()
    if sed == "":
        print(color.red("Could not find sed. Please install it and try again."))
        exit(1)
    local("{} -i 's/{}/{}/g' {}".format(sed, pattern, replacement, file), echo_off = echo_off, quiet = quiet)

