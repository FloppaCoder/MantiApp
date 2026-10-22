import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Brand from "../components/Brand";
import { supabase } from "../lib/supabaseClient";

interface LoginProps {
  onNavigateToRegister: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onNavigateToRegister, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError || !authData.user) {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("rol")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        setError("Error al obtener los permisos. Contacte a soporte.");
        setLoading(false);
        return;
      }

      if (userData.rol === "administrador") {
        await supabase.auth.signOut();
        setError("Acceso denegado: El administrador debe usar la web.");
        setLoading(false);
        return;
      }

      if (userData.rol === "tecnico") {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          alert("¡Acceso concedido al panel técnico!");
        }
      } else {
        await supabase.auth.signOut();
        setError("Rol no reconocido.");
      }
    } catch {
      setError("Error de conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardContainer}>
            <View>
              <Brand />
              <Text style={styles.panelSubtitle}>Panel Técnico</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.formLabel}>Correo Electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="admin@empresa.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.formLabel}>Contraseña</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Ingresar al sistema</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <Text style={styles.linkDescription}>¿No tienes una cuenta? </Text>
                <TouchableOpacity onPress={onNavigateToRegister}>
                  <Text style={styles.linkText}>Crea una aquí</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardContainer: {
    backgroundColor: "#17243d",
    width: "90%",
    borderRadius: 10,
    padding: 32,
    gap: 40,
  },
  panelSubtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    paddingTop: 10,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    gap: 16,
  },
  fieldGroup: {
    gap: 10,
  },
  formLabel: {
    color: "#cbd5e1",
    fontSize: 16,
    textAlign: "left",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#000000",
  },
  errorBox: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: "#fb7185",
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  linkDescription: {
    color: "#94a3b8",
    fontSize: 14,
  },
  linkText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "bold",
  },
});