import { View, Text, StyleSheet } from 'react-native';

export default function PostDetailScreen() {
  return (
    <View style={styles.container}>
      <Text>PostDetailScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
