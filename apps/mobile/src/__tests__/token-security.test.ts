describe('Token Security', () => {
  it('tokenStorage uses SecureStore, not AsyncStorage', () => {
    const storageSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/storage.ts'),
      'utf-8',
    );
    expect(storageSource).toContain('expo-secure-store');
    expect(storageSource).not.toContain('AsyncStorage');
    expect(storageSource).not.toContain('@react-native-async-storage');
  });

  it('API client does not log tokens', () => {
    const clientSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../api/client.ts'),
      'utf-8',
    );
    expect(clientSource).not.toContain('console.log');
    expect(clientSource).not.toContain('console.debug');
  });
});
