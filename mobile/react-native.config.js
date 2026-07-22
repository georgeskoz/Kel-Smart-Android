module.exports = {
  dependencies: {
    // iOS-only native utilities pulled in as a peer dependency of zeego /
    // react-native-ios-context-menu. It has no Android implementation and
    // breaks Gradle autolinking ("No variants exist") if linked on Android.
    "react-native-ios-utilities": {
      platforms: {
        android: null,
      },
    },
  },
};
