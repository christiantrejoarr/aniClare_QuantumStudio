import { IsBoolean, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ReviseServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(280)
  description!: string;

  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes!: number;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsInt()
  @Min(0)
  depositCents!: number;

  @IsBoolean()
  active!: boolean;
}
