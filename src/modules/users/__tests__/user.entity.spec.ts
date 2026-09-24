import { User } from '../domain/entities/user.entity';

describe('User entity', () => {
  it('create builds a user from props', () => {
    const user = User.create({ email: 'a@test.com', name: 'Alice', cognitoId: 'sub-1' });

    expect(user.email).toBe('a@test.com');
    expect(user.name).toBe('Alice');
    expect(user.cognitoId).toBe('sub-1');
    expect(user.id).toBeUndefined();
  });

  it('restore rebuilds the entity from a persistence row', () => {
    const created = new Date('2024-01-01T00:00:00.000Z');
    const user = User.restore({
      id: 5,
      email: 'a@test.com',
      name: 'Alice',
      cognito_id: 'sub-1',
      created_at: created,
      updated_at: created,
    });

    expect(user.id).toBe(5);
    expect(user.cognitoId).toBe('sub-1');
    expect(user.createdAt).toBe(created);
  });
});
