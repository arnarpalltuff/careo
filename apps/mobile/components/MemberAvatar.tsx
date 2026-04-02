import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

const roleBadges: Record<string, { color: string; textColor: string }> = {
  ADMIN: { color: colors.primary, textColor: '#fff' },
  MEMBER: { color: colors.primaryLight, textColor: colors.primary },
  VIEWER: { color: colors.divider, textColor: colors.textSecondary },
};

interface MemberAvatarProps {
  member: any;
  size?: number;
}

export function MemberAvatar({ member, size = 40 }: MemberAvatarProps) {
  const badge = roleBadges[member.role];

  return (
    <View style={styles.container}>
      <Avatar
        name={`${member.user.firstName} ${member.user.lastName}`}
        uri={member.user.avatarUrl}
        size={size}
      />
      <View style={styles.info}>
        <Text style={styles.name}>
          {member.user.firstName} {member.user.lastName}
        </Text>
        <Badge label={member.role} color={badge.color} textColor={badge.textColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
});
