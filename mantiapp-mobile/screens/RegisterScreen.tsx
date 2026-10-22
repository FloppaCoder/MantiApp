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

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onNavigateToLogin }: RegisterProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      // 1. Crear en auth.users
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            rol: "tecnico",
          },
        },
      });

      if (signUpError || !authData.user) {
        setError(signUpError?.message || "Error al crear la cuenta.");
        setLoading(false);
        return;
      }

      // 2. Insertar en public.users
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        rol: "tecnico",
      });

      if (dbError) {
        console.log("Error insert users:", dbError);
        setError("Error al registrar datos del usuario.");
        setLoading(false);
        return;
      }
      
      onNavigateToLogin();
    } catch {
      setError("No se pudo completar el registro.");
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
              <Text style={styles.panelSubtitle}>Registro Técnico</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.formLabel}>Nombre</Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  style={styles.input}
                  placeholder="Juan"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.formLabel}>Apellido</Text>
                <TextInput
                  value={apellido}
                  onChangeText={setApellido}
                  style={styles.input}
                  placeholder="Pérez"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.formLabel}>Correo Electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="tecnico@empresa.com"
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

              <View style={styles.fieldGroup}>
                <Text style={styles.formLabel}>Confirmar Contraseña</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Crear cuenta</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <Text style={styles.linkDescription}>¿Ya tienes una cuenta? </Text>
                <TouchableOpacity onPress={onNavigateToLogin}>
                  <Text style={styles.linkText}>Ingresa aquí</Text>
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
    gap: 24,
  },
  panelSubtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    paddingTop: 10,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  formLabel: {
    color: "#cbd5e1",
    fontSize: 14,
    textAlign: "left",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    marginTop: 6,
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