
# Tempting to include our SDKs, but they're not really "applications"
# brew "bun"
# brew "node@20"

CI = ENV["CI"].present?

puts "Installing applications... (this may take a while) CI=#{CI}"

# install tools if not present
brew "jq" unless system "jq --version"
brew "yj" unless system "yj -v"
brew "tilt" unless system "tilt version"
brew "caddy" unless system "caddy version"
brew "nss" unless system "type nss-policy-check"
brew "sqlfluff" unless CI or system "sqlfluff --version"
brew "postgresql@15" unless system "type pg_dump"
brew "gnu-sed" unless system "gsed --version"
