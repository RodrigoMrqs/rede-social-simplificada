import { View, Text, StyleSheet } from 'react-native';

export default function NewPostScreen() {
  return (
    <View style={styles.container}>
      <Text>NewPostScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
