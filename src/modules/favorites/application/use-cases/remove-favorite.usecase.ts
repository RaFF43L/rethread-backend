import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type IFavoriteRepository,
} from '../../domain/ports/favorite.repository';

@Injectable()
export class RemoveFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  execute(userId: number, productId: number): Promise<void> {
    return this.favoriteRepository.remove(userId, productId);
  }
}
