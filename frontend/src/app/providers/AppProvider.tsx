import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuthModel } from '../../features/auth/providers/AuthProvider';
import {
  FavoritesProvider,
  useFavoritesModel,
} from '../../features/explore/providers/FavoritesProvider';
import { GameProvider, useGameModel } from '../../features/game/providers/GameProvider';
import {
  ItineraryProvider,
  useItineraryModel,
} from '../../features/itinerary/providers/ItineraryProvider';
import { initialItinerary } from '../../features/itinerary/data/demoItineraries';
import { cloneItinerary } from '../../features/itinerary/models/itinerary';
import type { Itinerary } from '../../features/itinerary/types';
import { ProfileProvider, useProfileModel } from '../../features/profile/providers/ProfileProvider';
import { appStateRepository } from '../../services/storage/appStateRepository';
import type { SavedAppState } from '../../services/storage/appStateRepository';
import {
  GUEST_ITINERARIES_KEY,
  getAccountStorageKey,
  itineraryPersistence,
  itineraryStorage,
} from '../../services/storage/itineraryStorage';
import type { AccountContext } from '../../services/storage/itineraryStorage';
import { NavigationProvider } from '../navigation/NavigationProvider';
import { orchestrateRemoteFetchItineraries } from '../../features/itinerary/viewmodels/itineraryFetchOrchestrator';
import { invalidateAuthSession } from '../../features/itinerary/viewmodels/itinerarySyncCoordinator';

/**
 * AccountItineraryScope: Khung bao bọc cách ly trạng thái lịch trình theo tài khoản.
 *
 * Cơ chế Hydration Gate & Key Boundary:
 * 1. Khi active account thay đổi (ví dụ Logout hoặc đổi tài khoản),
 *    accountKey đổi ngay lập tức ở Render Frame đầu tiên.
 * 2. Điều kiện hydratedState.key !== accountKey trở thành TRUE:
 *    Component lập tức trả về null (hoặc loading view) ngay trong render frame này.
 *    Cây ItineraryProvider của tài khoản cũ bị unmount triệt để, triệt tiêu 100% rủi ro Flash of Stale Data.
 * 3. Effect chạy: flush dữ liệu cũ, nạp dữ liệu mới, sau đó cập nhật hydratedState.
 * 4. ItineraryProvider mới được mount với key={hydratedState.key} và initialState={loaded}.
 */
function AccountItineraryScope({
  initialAccountKey,
  initialItineraries,
  children,
}: {
  initialAccountKey: string;
  initialItineraries: Itinerary[];
  children: ReactNode;
}) {
  const { signedIn, user } = useAuthModel();
  const accountCtx: AccountContext = { signedIn, user };
  const accountKey = getAccountStorageKey(accountCtx);

  const [hydratedState, setHydratedState] = useState<{
    key: string;
    itineraries: Itinerary[];
  }>({
    key: initialAccountKey,
    itineraries: initialItineraries,
  });

  useEffect(() => {
    if (hydratedState.key === accountKey) {
      return;
    }

    let cancelled = false;
    const targetKey = accountKey;
    invalidateAuthSession();

    // Flush toàn bộ các write đang chờ của tài khoản trước trước khi hydrate tài khoản mới
    itineraryPersistence
      .flush()
      .then(() => itineraryStorage.loadItinerariesForAccount(accountCtx))
      .then((loaded) => {
        if (!cancelled) {
          setHydratedState({ key: targetKey, itineraries: loaded });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHydratedState({ key: targetKey, itineraries: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountKey, signedIn, user]);

  // HYDRATION GATE:
  // Nếu dữ liệu trong state chưa khớp với accountKey đang kích hoạt,
  // tuyệt đối không render Provider với state cũ!
  if (hydratedState.key !== accountKey) {
    return null;
  }

  return (
    <ItineraryProvider key={hydratedState.key} initialState={hydratedState.itineraries}>
      <RemoteItinerarySyncTrigger />
      {children}
    </ItineraryProvider>
  );
}

function RemoteItinerarySyncTrigger() {
  const auth = useAuthModel();
  const model = useItineraryModel();

  useEffect(() => {
    if (!auth.signedIn || !auth.token) return;

    orchestrateRemoteFetchItineraries({
      model,
      auth,
      getCurrentAuth: () => auth,
      isInitialFetch: true,
    }).catch(() => {});
  }, [auth.signedIn, auth.token, auth.user?.uid || auth.user?.id]);

  return null;
}

function PersistLocalState({ children }: { children: ReactNode }) {
  const { signedIn, token, user } = useAuthModel();
  const { name, email, phone } = useProfileModel();
  const { favorites } = useFavoritesModel();
  const { itineraries } = useItineraryModel();
  const { quizCompleted, quizAnswers, points, rewardRedeemed } = useGameModel();

  const accountCtx: AccountContext = { signedIn, user };
  const currentAccountKey = getAccountStorageKey(accountCtx);

  // Lưu trữ dữ liệu với debouncing và tuần tự hoá an toàn qua Persistence Coordinator
  useEffect(() => {
    const timer = setTimeout(() => {
      itineraryStorage.saveItinerariesForAccount(accountCtx, itineraries).catch(() => {});

      appStateRepository
        .save({
          signedIn,
          token,
          user,
          name,
          email,
          phone,
          favorites,
          quizCompleted,
          quizAnswers,
          points,
          rewardRedeemed,
        })
        .catch(() => {});
    }, 100);

    return () => {
      clearTimeout(timer);
      // Trên unmount: đảm bảo flush pending write của tài khoản hiện tại
      itineraryPersistence.flush(accountCtx).catch(() => {});
    };
  }, [
    currentAccountKey,
    signedIn,
    token,
    user,
    name,
    email,
    phone,
    favorites,
    itineraries,
    quizCompleted,
    quizAnswers,
    points,
    rewardRedeemed,
  ]);

  return children;
}

// Composition and persistence only. Each feature owns its repository and model state.
export function AppProvider({ children }: { children: ReactNode }) {
  const [initial, setInitial] = useState<Partial<SavedAppState> | null>(null);
  const [initialItineraries, setInitialItineraries] = useState<Itinerary[] | null>(null);
  const [initialAccountKey, setInitialAccountKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    appStateRepository
      .load()
      .then(async (saved) => {
        if (!active) return;
        const state = saved ?? {};
        const isActuallySignedIn = Boolean(state.signedIn === true && state.token);
        const authCtx: AccountContext = {
          signedIn: isActuallySignedIn,
          user: isActuallySignedIn ? state.user : null,
        };
        const key = getAccountStorageKey(authCtx);
        const itins = await itineraryStorage.loadItinerariesForAccount(authCtx);
        if (active) {
          setInitial(state);
          setInitialAccountKey(key);
          setInitialItineraries(itins);
        }
      })
      .catch(() => {
        if (active) {
          setInitial({});
          setInitialAccountKey(GUEST_ITINERARIES_KEY);
          setInitialItineraries([cloneItinerary(initialItinerary)]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (!initial || !initialItineraries || !initialAccountKey) return null;

  const isActuallySignedIn = Boolean(initial.signedIn === true && initial.token);
  const authInitialState = {
    signedIn: isActuallySignedIn,
    token: isActuallySignedIn ? (initial.token ?? null) : null,
    user: isActuallySignedIn ? (initial.user ?? null) : null,
  };
  const profileInitialState = {
    ...initial,
    name: isActuallySignedIn && initial.name ? initial.name : 'Khách tham quan',
    email: isActuallySignedIn && initial.email ? initial.email : '',
  };

  return (
    <NavigationProvider initialState={{ name: 'home' }}>
      <AuthProvider initialState={authInitialState}>
        <ProfileProvider initialState={profileInitialState}>
          <FavoritesProvider initialState={initial.favorites}>
            <AccountItineraryScope
              initialAccountKey={initialAccountKey}
              initialItineraries={initialItineraries}
            >
              <GameProvider initialState={initial}>
                <PersistLocalState>{children}</PersistLocalState>
              </GameProvider>
            </AccountItineraryScope>
          </FavoritesProvider>
        </ProfileProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}
