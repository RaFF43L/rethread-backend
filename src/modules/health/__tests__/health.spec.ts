import { GetHealthStatusUseCase } from '../application/use-cases/get-health-status.usecase';
import { HealthController } from '../http/health.controller';

describe('Health', () => {
  describe('GetHealthStatusUseCase', () => {
    it('returns an ok status', () => {
      const useCase = new GetHealthStatusUseCase();
      expect(useCase.execute()).toEqual({ status: 'ok' });
    });
  });

  describe('HealthController', () => {
    it('delegates to the use case', () => {
      const useCase = { execute: jest.fn().mockReturnValue({ status: 'ok' }) };
      const controller = new HealthController(useCase as never);

      expect(controller.checkHealth()).toEqual({ status: 'ok' });
      expect(useCase.execute).toHaveBeenCalled();
    });
  });
});
