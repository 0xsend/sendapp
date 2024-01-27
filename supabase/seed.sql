insert into auth.users(id, phone)
  values (gen_random_uuid(), '15555555555');

update
  profiles
set
  name = 'test',
  about = 'Test user',
  avatar_url = 'https://example.com/avatar.png'
where
  id =(
    select
      id
    from
      auth.users
    where
      phone = '15555555555'
    limit 1);

insert into tags(name, status, user_id)
  values ('tag1', 'confirmed',(
      select
        id
      from
        auth.users
      where
        phone = '15555555555'
      limit 1));

insert into send_accounts(address, chain_id, init_code, user_id)
  values ('0x1234567890ABCDEF1234567890ABCDEF12345678', 8453, '\x1234',(
      select
        id
      from
        auth.users
      where
        phone = '15555555555'
      limit 1));
