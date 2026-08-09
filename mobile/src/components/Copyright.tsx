import React from 'react';
import { Text, StyleSheet } from 'react-native';

export function Copyright() {
  return (
    <>
      <Text style={styles.copyright}>© 2026 K.E.L. All rights reserved.</Text>
      <Text style={styles.builtBy}>Built by EzeTech Inc.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  copyright: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingTop: 12,
  },
  builtBy: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#26335F',
    textAlign: 'center',
    paddingBottom: 12,
  },
});
