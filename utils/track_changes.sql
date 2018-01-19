create or replace function track_changes(tablename text) returns void as $$
	begin
		execute format(
			'create trigger %I_notify after insert or update or delete on %I for each row execute procedure notify()',
			tablename,
			tablename
		);
	end;
$$ language plpgsql;
