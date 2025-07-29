import 'dotenv/config';

export default {
  expo: {
    name: "rundown-mobile",
    slug: "rundown-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rundown",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rundown.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.rundown.mobile"
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/Inter-Regular.ttf",
            "./assets/fonts/Inter-Medium.ttf",
            "./assets/fonts/Inter-SemiBold.ttf"
          ]
        }
      ]
    ],
    extra: {
      stravaClientId: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID,
      stravaClientSecret: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET,
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
      env: process.env.EXPO_PUBLIC_ENV || 'development'
    }
  }
};