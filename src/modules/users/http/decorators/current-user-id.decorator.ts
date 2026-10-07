import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { ResolveUserIdPipe } from '../pipes/resolve-user-id.pipe';

// Requires the consuming module to import UsersModule (the pipe injects USER_REPOSITORY).
export const CurrentUserId = () => CurrentUser(ResolveUserIdPipe);
