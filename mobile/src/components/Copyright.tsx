import React from 'react';
import { Text, StyleSheet } from 'react-native';

export function Copyright() {
  return (
    <Text style={styles.copyright}>© 2026 K.E.L. All rights reserved.</Text>
  );
}

const styles = StyleSheet.create({
  copyright: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
