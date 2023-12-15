
# Tempting to include our SDKs, but they're not really "applications"
# brew "bun"
# brew "node@20"

CI = ENV["CI"].present?

puts "Installing applications... (this may take a while)"

# install tools if not present
brew "jq" unless system "jq --version"
unless system "yj -v"
  tap "bruceadams/utilities"
  brew "bruceadams/utilities/yj"
end
brew "tilt" unless system "which tilt"
brew "caddy" unless system "which caddy"
