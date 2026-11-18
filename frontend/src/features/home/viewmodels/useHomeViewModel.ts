import { useEffect, useState } from 'react';
import { useNavigationViewModel } from '../../../app/navigation/NavigationProvider';
import { useProfileModel } from '../../profile/providers/ProfileProvider';
import { useItineraryModel } from '../../itinerary/providers/ItineraryProvider';
import { useItineraryActions } from '../../itinerary/viewmodels/useItineraryActions';
import { placeRepository } from '../../explore/repositories/placeRepository';
import { useGameModel } from '../../game/providers/GameProvider';
import { useAuthModel } from '../../auth/providers/AuthProvider';
import { fetchDaNangWeather } from '../../../services/weather/weatherService';
import type { DaNangWeather } from '../../../services/weather/weatherService';
import { askGeminiWeatherAdvice } from '../../../services/ai/geminiService';

const INITIAL_WEATHER: DaNangWeather = {
  temperature: 28,
  conditionText: 'Nắng nhẹ',
  weatherCode: 1,
  isRaining: false,
  rainProbabilityMax: 20,
  hourly: [
    {
      time: '14:00',
      temp: 31,
      weatherCode: 1,
      icon: '☼',
      label: '14:00  ☼ 31°',
      rainProbability: 15,
    },
    {
      time: '16:00',
      temp: 30,
      weatherCode: 2,
      icon: '☼',
      label: '16:00  ☼ 30°',
      rainProbability: 20,
    },
    {
      time: '18:00',
      temp: 27,
      weatherCode: 61,
      icon: '☂',
      label: '18:00  ☂ 27°',
      rainProbability: 70,
    },
  ],
  updatedAt: '',
};

export function useHomeViewModel() {
  const { navigate, tab } = useNavigationViewModel();
  const { signedIn } = useAuthModel();
  const { name } = useProfileModel();
  const { itineraries } = useItineraryModel();
  const { startCreate } = useItineraryActions();
  const { quizIndex, quizCompleted, quizAnswers, points } = useGameModel();
  const [weather, setWeather] = useState<DaNangWeather>(INITIAL_WEATHER);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const goToLogin = () => navigate('login');
  const goToRegister = () => navigate('register');

  useEffect(() => {
    let active = true;
    fetchDaNangWeather().then((data) => {
      if (!active) return;
      setWeather(data);
      askGeminiWeatherAdvice(data.conditionText, data.temperature, data.isRaining).then((aiRes) => {
        if (!active) return;
        setAiAdvice(aiRes.text);
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const nextQuizIndex = quizAnswers.findIndex((answer) => answer === null);
  const displayQuestion = quizCompleted
    ? 5
    : Math.min(5, nextQuizIndex < 0 ? quizIndex + 1 : nextQuizIndex + 1);
  const recommendedPlaces = placeRepository.list().slice(0, 4);
  return {
    navigate,
    tab,
    name,
    itineraries,
    startCreate,
    recommendedPlaces,
    quizCompleted,
    displayQuestion,
    points,
    weather,
    aiAdvice,
    signedIn,
    goToLogin,
    goToRegister,
  };
}
