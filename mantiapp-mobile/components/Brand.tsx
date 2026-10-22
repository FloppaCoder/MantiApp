import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, Image, StyleSheet } from "react-native";

const brandIcon = require("../assets/icon.png");

export default function Brand() {
  return (
        <View style={styles.container}>
          <Image
            source={brandIcon}
            style={styles.logo}
            accessibilityLabel="MantiApp Logo"
          />
          <Text style={{ color: "#ffffff", fontSize: 30 }}>MantiApp</Text>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});
