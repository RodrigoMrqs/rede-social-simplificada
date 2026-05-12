import { View, Text, StyleSheet } from 'react-native';

export default function ModerationScreen() {
  return (
    <View style={styles.container}>
      <Text>ModerationScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
