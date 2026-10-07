import { Inject, Injectable, PipeTransform, UnauthorizedException } from '@nestjs/common';
import type { RequestUser } from '../../../../common/decorators/current-user.decorator';
import { UserNotFoundError } from '../../domain/errors/user.error';
import { type IUserRepository, USER_REPOSITORY } from '../../domain/ports/user.repository';

@Injectable()
export class ResolveUserIdPipe implements PipeTransform<RequestUser | undefined, Promise<number>> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async transform(requestUser: RequestUser | undefined): Promise<number> {
    if (requestUser === undefined) {
      throw new UnauthorizedException();
    }
    const user = await this.userRepository.findByProviderId(requestUser.providerId);
    if (user?.id === undefined) {
      throw new UserNotFoundError();
    }
    return user.id;
  }
}
