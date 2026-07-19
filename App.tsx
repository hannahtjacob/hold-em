import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>REACT NATIVE + TYPESCRIPT</Text>
        <Text style={styles.title}>Hold Em</Text>
        <Text style={styles.body}>
          Your mobile app is ready. Start building by editing App.tsx.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => console.log('Ready to build!')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Let&apos;s build</Text>
        </Pressable>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081c15',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#f7f3e8',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  eyebrow: {
    color: '#2d6a4f',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#081c15',
    fontSize: 48,
    fontWeight: '800',
    marginTop: 8,
  },
  body: {
    color: '#40534a',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#d62828',
    borderRadius: 14,
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
