
# Tempting to include our SDKs, but they're not really "applications"
# brew "bun"
# brew "node@20"

CI = ENV["CI"].present?

puts "Installing applications... (this may take a while)"

# install tools if not present
brew "jq" unless system "jq --version"
brew "yj" unless system "yj -v"
# @todo github brew bundle is acting weird
brew "tilt" unless CI || system("tilt version")
brew "caddy" unless system "caddy version"
