CREATE TABLE IF NOT EXISTS scheduling.journal (
  id boolean PRIMARY KEY DEFAULT true,
  opens_minute smallint NOT NULL,
  closes_minute smallint NOT NULL,
  sunday boolean NOT NULL DEFAULT false,
  monday boolean NOT NULL DEFAULT true,
  tuesday boolean NOT NULL DEFAULT true,
  wednesday boolean NOT NULL DEFAULT true,
  thursday boolean NOT NULL DEFAULT true,
  friday boolean NOT NULL DEFAULT true,
  saturday boolean NOT NULL DEFAULT false,
  allow_weekends boolean NOT NULL DEFAULT false,
  allow_holidays boolean NOT NULL DEFAULT false,
  allow_half_days boolean NOT NULL DEFAULT false,
  CONSTRAINT journal_singleton CHECK (id),
  CONSTRAINT journal_span CHECK (closes_minute > opens_minute AND opens_minute >= 0 AND closes_minute <= 1440)
);

INSERT INTO scheduling.journal (
  id, opens_minute, closes_minute,
  sunday, monday, tuesday, wednesday, thursday, friday, saturday,
  allow_weekends, allow_holidays, allow_half_days
)
VALUES (true, 600, 1140, false, true, true, true, true, true, false, false, false, false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS scheduling.special_days (
  day date PRIMARY KEY,
  kind text NOT NULL,
  opens_minute smallint,
  closes_minute smallint,
  CONSTRAINT special_day_kind CHECK (kind IN ('holiday', 'half_day')),
  CONSTRAINT special_day_hours CHECK (
    (kind = 'holiday' AND opens_minute IS NULL AND closes_minute IS NULL)
    OR (
      kind = 'half_day'
      AND opens_minute IS NOT NULL
      AND closes_minute IS NOT NULL
      AND closes_minute > opens_minute
    )
  )
);
