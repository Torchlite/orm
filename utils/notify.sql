create or replace function notify() returns trigger as $$
declare
	msg_id integer;
	msg text;
	long_msg jsonb;
begin
	if tg_op = 'INSERT' then
		msg = json_build_object('op', tg_op, 'new', new, 'full', true)::text;
	elsif tg_op = 'UPDATE' then
		msg = json_build_object('op', tg_op, 'new', new, 'old', old, 'full', true)::text;
	else
		msg = json_build_object('op', tg_op, 'old', old, 'full', true)::text;
	end if;

	if bit_length(msg) > 64000 then
		long_msg = msg;

		insert into outbox (msg) values (long_msg) returning id into msg_id;

		msg = jsonb_build_object('op', tg_op, 'id', msg_id, 'full', false);
	end if;

	if tg_op = 'UPDATE' then
		if old is distinct from new then
			perform pg_notify(tg_table_name, msg);
		end if;
	else
		perform pg_notify(tg_table_name, msg);
	end if;
	return new;
end;
$$ LANGUAGE plpgsql;
