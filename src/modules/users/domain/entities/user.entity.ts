import { BaseEntity } from '../../../../shared/kernel/base-entity';

// Raw persistence shape (snake_case), consumed only by restore().
export interface UserRow {
  id?: number;
  email: string;
  name: string;
  cognito_id: string;
  picture_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface CreateUserProps {
  email: string;
  name: string;
  cognitoId: string;
  pictureUrl?: string | null;
}

export class User extends BaseEntity {
  private constructor(
    public email: string,
    public name: string,
    public cognitoId: string,
    public pictureUrl: string | null,
  ) {
    super();
  }

  static create(props: CreateUserProps): User {
    return new User(props.email, props.name, props.cognitoId, props.pictureUrl ?? null);
  }

  static restore(row: UserRow): User {
    return new User(row.email, row.name, row.cognito_id, row.picture_url ?? null)
      .setId(row.id)
      .setCreatedAt(row.created_at)
      .setUpdatedAt(row.updated_at);
  }
}
