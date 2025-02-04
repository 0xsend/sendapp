alter table distributions
  add column tranche_id integer,
  drop constraint distributions_number_key;

-- tranche_id is 0-indexed whereas number is 1-indexed
update distributions set tranche_id = number - 1 where number < 11; -- distribution 11 got a new address and reset the tranche id
update distributions set tranche_id = 3 where number = 11; -- base merkle drop contracts started at 4

-- merkle drop address also changed for distribution 11
update distributions set merkle_drop_addr = '\x2c1630cd8f40d0458b7b5849e6cc2904a7d18a57' where number = 11;

alter table distributions
  alter column tranche_id set not null,
  add constraint distributions_tranche_id_key unique (merkle_drop_addr, tranche_id);
