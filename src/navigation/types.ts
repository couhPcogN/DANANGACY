export type TabName = 'home' | 'explore' | 'itinerary' | 'game' | 'profile';
export type RouteName = TabName | 'welcome' | 'login' | 'register' | 'forgot' | 'verify' | 'reset' | 'place' | 'map' | 'tripInfo' | 'tripPreferences' | 'tripPlaces' | 'tripReview' | 'tripSaved' | 'tripDetail' | 'tripEdit' | 'tripEditPlaces' | 'weather' | 'replacement' | 'replacementConfirm' | 'gameIntro' | 'quiz' | 'quizResult' | 'quizAnswers' | 'rewards' | 'rewardDetail' | 'redeemed' | 'myRewards' | 'editProfile' | 'favorites';
export type Route = { name: RouteName; id?: string };

