import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';

export function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);

      if (offline) {
        setShowBanner(true);
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else if (showBanner) {
        // Show "Back online" briefly then hide
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            setShowBanner(false);
          });
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <Animated.View style={[styles.banner, isOffline ? styles.offline : styles.online, { opacity }]}>
      <Text style={styles.icon}>{isOffline ? '📡' : '✅'}</Text>
      <Text style={styles.text}>
        {isOffline ? 'No internet connection' : 'Back online'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offline: {
    backgroundColor: colors.danger,
  },
  online: {
    backgroundColor: colors.success,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    ...typography.labelSmall,
    color: '#fff',
    fontWeight: '700',
  },
});
