create type activity_feed_user as
(
    id uuid,
    name text,
    avatar_url text,
    send_id integer,
    tags text []
);

create or replace view activity_feed with (security_barrier = on) as
select a.created_at                  as created_at,
       a.event_name                  as event_name,
       case when a.from_user_id = from_p.id then (case when a.from_user_id = ( select auth.uid() )
                                                           then ( select auth.uid() ) end,
                                                  from_p.name,
                                                  from_p.avatar_url,
                                                  from_p.send_id,
                                                  ( select array_agg(name)
                                                    from tags
                                                    where user_id = from_p.id and status = 'confirmed' )
           )::activity_feed_user end as from_user,
       case when a.to_user_id = to_p.id then (case when a.to_user_id = ( select auth.uid() )
                                                       then ( select auth.uid() ) end,
                                              to_p.name,
                                              to_p.avatar_url,
                                              to_p.send_id,
                                              ( select array_agg(name)
                                                from tags
                                                where user_id = to_p.id and status = 'confirmed' )
           )::activity_feed_user end as to_user,
       a.data                        as data
from activity a
         left join profiles from_p on a.from_user_id = from_p.id
         left join profiles to_p on a.to_user_id = to_p.id
where a.from_user_id = ( select auth.uid() )
   or a.to_user_id = ( select auth.uid() )
group by a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url,
         from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data;
