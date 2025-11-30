export default {
  expo: {
    name: "HailO",
    slug: "hailo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "hailo",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: "com.hailo.app"
    },
    android: {
      package: "com.hailo.app"
    },
    plugins: [
      "expo-router"
    ],
    extra: {
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || ""
    }
  }
};
