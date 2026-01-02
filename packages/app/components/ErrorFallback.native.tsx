import { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'solito/router'

interface Props {
  error?: Error
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  const router = useRouter()

  const handleGoHome = useCallback(() => {
    router.replace('/(tabs)/home')
    // Reset after navigation to avoid immediately re-rendering the crashing tree
    setTimeout(() => resetError?.(), 0)
  }, [router, resetError])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>An unexpected error occurred.</Text>
      {__DEV__ && error && <Text style={styles.error}>{error.message}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleGoHome}>
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  message: { fontSize: 14, color: '#666', marginBottom: 16 },
  error: { fontSize: 12, color: 'red', fontFamily: 'monospace', marginBottom: 16 },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: '600' },
})
