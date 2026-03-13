import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { colors } from '../../utils/colors';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
}

export function Input({ label, error, secureTextEntry, ...props }: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textHint}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{isSecure ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
    marginTop: 4,
  },
});
