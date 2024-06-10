update profiles set name = substring(name, 1, 63);
update profiles set about = substring(about, 1, 255);
alter table profiles add constraint profiles_about_update check (length(about) < 255);
alter table profiles add constraint profiles_name_update check (length(name) < 63);
