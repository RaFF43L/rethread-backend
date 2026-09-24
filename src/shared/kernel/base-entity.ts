// No ORM decorators (architecture rule): the domain entity does not know TypeORM.
// Fluent setters exist so the manual Schema -> Entity mapping can rebuild the
// persisted state in a readable way.
export abstract class BaseEntity {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  setId(id?: number): this {
    this.id = id;
    return this;
  }

  setCreatedAt(createdAt?: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  setUpdatedAt(updatedAt?: Date): this {
    this.updatedAt = updatedAt;
    return this;
  }

  setDeletedAt(deletedAt?: Date | null): this {
    this.deletedAt = deletedAt ?? null;
    return this;
  }
}
