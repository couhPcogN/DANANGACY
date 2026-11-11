import { createModelContext } from '../../../providers/createModelContext';
import { createProfileRepository } from '../repositories/profileRepository';

const context = createModelContext('Profile', createProfileRepository);
export const ProfileProvider = context.Provider;
export const useProfileModel = context.useModel;
