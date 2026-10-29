import { IsString, MaxLength, MinLength } from 'class-validator';

export class TherapistNameDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  givenName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  familyName!: string;
}
