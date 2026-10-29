import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UserCredentialsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsBoolean()
  administrator?: boolean;
}

export class ReviseUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  username!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password?: string;
}
