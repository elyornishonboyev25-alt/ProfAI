CREATE OR REPLACE FUNCTION limit_learning_center_admins() RETURNS trigger AS $$
BEGIN
  IF NEW."role" = 'ADMIN' AND NEW."status" = 'ACTIVE' THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW."centerId"));
    IF (SELECT count(*) FROM "LearningCenterMember"
        WHERE "centerId" = NEW."centerId" AND "role" = 'ADMIN' AND "status" = 'ACTIVE' AND "id" <> NEW."id") >= 2 THEN
      RAISE EXCEPTION 'A class can have only two administrators besides its owner.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learning_center_admin_limit
BEFORE INSERT OR UPDATE OF "role", "status" ON "LearningCenterMember"
FOR EACH ROW EXECUTE FUNCTION limit_learning_center_admins();
