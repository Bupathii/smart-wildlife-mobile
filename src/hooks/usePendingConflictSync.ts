import {
  useEffect,
  useRef,
} from "react";

import NetInfo from "@react-native-community/netinfo";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  syncPendingConflictReports,
} from "@/services/pendingConflict.service";

export function usePendingConflictSync() {
  const {
    token,
    user,
  } = useAuth();

  const syncing =
    useRef(false);

  useEffect(() => {
    /*
     * Only Community Member reports
     * use this synchronization flow.
     */
    if (
      !token ||
      user?.role !==
        "COMMUNITY_MEMBER"
    ) {
      return;
    }

    async function attemptSync() {
      if (
        syncing.current ||
        !token
      ) {
        return;
      }

      try {
        const network =
          await NetInfo.fetch();

        const hasConnection =
          network.isConnected ===
            true &&
          network
            .isInternetReachable !==
            false;

        if (!hasConnection) {
          return;
        }

        syncing.current = true;

        const result =
          await syncPendingConflictReports(
            token
          );

        if (result.synced > 0) {
          console.log(
            `${result.synced} pending conflict report(s) synchronized`
          );
        }

        if (
          result.remaining > 0
        ) {
          console.log(
            `${result.remaining} conflict report(s) are still pending`
          );
        }
      } catch (error) {
        console.log(
          "Pending conflict synchronization failed:",
          error
        );
      } finally {
        syncing.current =
          false;
      }
    }

    /*
     * Try immediately when Community
     * Member section loads.
     */
    attemptSync();

    /*
     * Try again whenever network
     * becomes available.
     */
    const unsubscribe =
      NetInfo.addEventListener(
        (state) => {
          const connected =
            state.isConnected ===
              true &&
            state
              .isInternetReachable !==
              false;

          if (connected) {
            attemptSync();
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    token,
    user?.role,
  ]);
}