import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class WorkingHoursDto {
  @IsString()
  @Matches(TIME)
  opensAt!: string;

  @IsString()
  @Matches(TIME)
  closesAt!: string;

  @IsBoolean()
  sunday!: boolean;

  @IsBoolean()
  monday!: boolean;

  @IsBoolean()
  tuesday!: boolean;

  @IsBoolean()
  wednesday!: boolean;

  @IsBoolean()
  thursday!: boolean;

  @IsBoolean()
  friday!: boolean;

  @IsBoolean()
  saturday!: boolean;

  @IsBoolean()
  allowWeekends!: boolean;

  @IsBoolean()
  allowHolidays!: boolean;

  @IsBoolean()
  allowHalfDays!: boolean;
}

export class SpecialDayDto {
  @IsString()
  @Matches(DAY)
  day!: string;

  @IsIn(['holiday', 'half_day'])
  kind!: 'holiday' | 'half_day';

  @IsOptional()
  @IsString()
  @Matches(TIME)
  opensAt?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME)
  closesAt?: string;
}
