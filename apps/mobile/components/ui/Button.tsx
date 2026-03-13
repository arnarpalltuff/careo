import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../utils/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle[] = [styles.base];
  const textStyles: TextStyle[] = [styles.text];

  switch (variant) {
    case 'primary':
      buttonStyles.push(styles.primary);
      textStyles.push(styles.primaryText);
      break;
    case 'outline':
      buttonStyles.push(styles.outline);
      textStyles.push(styles.outlineText);
      break;
    case 'danger':
      buttonStyles.push(styles.danger);
      textStyles.push(styles.primaryText);
      break;
    case 'ghost':
      buttonStyles.push(styles.ghost);
      textStyles.push(styles.outlineText);
      break;
  }

  if (isDisabled) buttonStyles.push(styles.disabled);

  return (
    <TouchableOpacity
      style={[...buttonStyles, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
