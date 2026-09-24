import { BaseEntity } from '../../../../shared/kernel/base-entity';

// Raw persistence shape (snake_case), consumed only by restore().
export interface UserRow {
  id?: number;
  email: string;
  name: string;
  cognito_id: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CreateUserProps {
  email: string;
  name: string;
  cognitoId: string;
}

// Pure domain entity for an application user. Free of ORM decorators; the
// Schema <-> Entity mapping lives in infra.
export class User extends BaseEntity {
  private constructor(
    public email: string,
    public name: string,
    public cognitoId: string,
  ) {
    super();
  }

  static create(props: CreateUserProps): User {
    return new User(props.email, props.name, props.cognitoId);
  }

  static restore(row: UserRow): User {
    return new User(row.email, row.name, row.cognito_id)
      .setId(row.id)
      .setCreatedAt(row.created_at)
      .setUpdatedAt(row.updated_at);
  }
}
