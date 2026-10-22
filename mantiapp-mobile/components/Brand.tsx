import { View, Text, Image, StyleSheet } from "react-native";

const brandIcon = require("../assets/logo.png");

export default function Brand() {
  return (
        <View style={styles.container}>
          <Image
            source={brandIcon}
            style={styles.logo}
            accessibilityLabel="MantiApp Logo"
          />
          <Text style={styles.name}>Manti<Text style={styles.light}>App</Text></Text>
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
  name: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
  },
  light: {
    fontWeight: "400",
  },
});
