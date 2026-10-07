import {
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  type INestApplication,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppErrorFilter } from '../../../shared/http/app-error.filter';
import { FakeUserRepository } from '../../auth/__tests__/fake-user.repository';
import { User } from '../domain/entities/user.entity';
import { UserNotFoundError } from '../domain/errors/user.error';
import { USER_REPOSITORY } from '../domain/ports/user.repository';
import { CurrentUserId } from '../http/decorators/current-user-id.decorator';
import { ResolveUserIdPipe } from '../http/pipes/resolve-user-id.pipe';

class FakeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const subject = req.headers['x-subject'];
    if (subject) req.user = { providerId: subject, groups: [] };
    return true;
  }
}

@Controller('probe')
@UseGuards(FakeAuthGuard)
class ProbeController {
  @Get()
  probe(@CurrentUserId() userId: number) {
    return { userId };
  }
}

describe('@CurrentUserId', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const users = new FakeUserRepository();
    await users.create(User.create({ email: 'a@test.com', name: 'Alice', providerId: 'sub-a' }));
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [{ provide: USER_REPOSITORY, useValue: users }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AppErrorFilter());
    await app.init();
  });

  afterAll(() => app.close());

  it('injects the resolved local user id into the handler', async () => {
    await request(app.getHttpServer())
      .get('/probe')
      .set('x-subject', 'sub-a')
      .expect(200, { userId: 1 });
  });

  it('responds 404 when the subject has no local user', async () => {
    await request(app.getHttpServer()).get('/probe').set('x-subject', 'unknown').expect(404);
  });
});

describe('ResolveUserIdPipe', () => {
  let pipe: ResolveUserIdPipe;

  beforeEach(async () => {
    const users = new FakeUserRepository();
    await users.create(User.create({ email: 'a@test.com', name: 'Alice', providerId: 'sub-a' }));
    await users.create(User.create({ email: 'b@test.com', name: 'Bob', providerId: 'sub-b' }));
    pipe = new ResolveUserIdPipe(users);
  });

  it('resolves the token subject to the local user id', async () => {
    await expect(pipe.transform({ providerId: 'sub-b', groups: [] })).resolves.toBe(2);
  });

  it('throws UserNotFoundError when no local user matches the subject', async () => {
    await expect(pipe.transform({ providerId: 'unknown', groups: [] })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it('throws UnauthorizedException when the request has no authenticated user', async () => {
    await expect(pipe.transform(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
