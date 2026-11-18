import { createModelContext } from '../../../shared/state/createModelContext';
import { createAuthRepository } from '../repositories/authRepository';

const context = createModelContext('Auth', createAuthRepository);
export const AuthProvider = context.Provider;
export const useAuthModel = context.useModel;
