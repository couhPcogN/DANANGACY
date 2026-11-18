export type TabName = 'home' | 'explore' | 'itinerary' | 'game' | 'profile';
export type RouteName =
  | TabName
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot'
  | 'verify'
  | 'reset'
  | 'place'
  | 'map'
  | 'itineraryInfo'
  | 'itineraryPreferences'
  | 'itineraryPlaces'
  | 'itineraryReview'
  | 'itinerarySaved'
  | 'itineraryDetail'
  | 'itineraryEdit'
  | 'itineraryEditPlaces'
  | 'weather'
  | 'replacement'
  | 'replacementConfirm'
  | 'gameIntro'
  | 'quiz'
  | 'quizResult'
  | 'quizAnswers'
  | 'rewards'
  | 'rewardDetail'
  | 'redeemed'
  | 'myRewards'
  | 'editProfile'
  | 'favorites';
export type Route = { name: RouteName; id?: string };

const routeNames = new Set<RouteName>([
  'home',
  'explore',
  'itinerary',
  'game',
  'profile',
  'welcome',
  'login',
  'register',
  'forgot',
  'verify',
  'reset',
  'place',
  'map',
  'itineraryInfo',
  'itineraryPreferences',
  'itineraryPlaces',
  'itineraryReview',
  'itinerarySaved',
  'itineraryDetail',
  'itineraryEdit',
  'itineraryEditPlaces',
  'weather',
  'replacement',
  'replacementConfirm',
  'gameIntro',
  'quiz',
  'quizResult',
  'quizAnswers',
  'rewards',
  'rewardDetail',
  'redeemed',
  'myRewards',
  'editProfile',
  'favorites',
]);

export function isRouteName(value: unknown): value is RouteName {
  return typeof value === 'string' && routeNames.has(value as RouteName);
}
