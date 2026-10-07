import { SetMetadata } from '@nestjs/common';

export const IS_ANY_AUTHENTICATED_KEY = 'isAnyAuthenticated';
// Opts a route out of the admin group requirement: any signed-in user may call it.
export const AnyAuthenticated = () => SetMetadata(IS_ANY_AUTHENTICATED_KEY, true);
