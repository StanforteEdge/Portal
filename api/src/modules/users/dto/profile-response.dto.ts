export class ProfileResponseDto {
  id!: string;
  username!: string;
  email!: string;
  type!: string;
  status!: string;
  first_name!: string | null;
  last_name!: string | null;
  phone!: string | null;
  avatar!: string | null;
  primary_organization_id!: string | null;
  created_at!: Date;
  updated_at!: Date;
  organizations!: Array<{
    id: string;
    name: string;
    code: string;
    is_primary: boolean;
  }>;
}
