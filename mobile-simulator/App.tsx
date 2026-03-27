import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Change "localhost" to your machine's LAN IP when testing on a physical device
// e.g. http://192.168.1.x:5173
const PRESET_URLS = [
  { label: 'Iframe Host', url: 'http://localhost:5180' },
  { label: 'Core App',    url: 'http://localhost:5173' },
  { label: 'Dashboard',  url: 'http://localhost:5175' },
  { label: 'OMS',        url: 'http://localhost:5174' },
];

const PHONE_WIDTH  = 320;
const PHONE_HEIGHT = 568;

export default function App() {
  const [activeUrl, setActiveUrl]       = useState(PRESET_URLS[0].url); // starts on iframe-host
  const [inputUrl, setInputUrl]         = useState(PRESET_URLS[0].url);
  const [loading, setLoading]           = useState(false);
  const [canGoBack, setCanGoBack]       = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const webviewRef = useRef<WebView>(null);

  const navigate = (url: string) => {
    const finalUrl = url.startsWith('http') ? url : `http://${url}`;
    setActiveUrl(finalUrl);
    setInputUrl(finalUrl);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

        {/* ── Top control bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Mobile Simulator</Text>

          <View style={styles.presets}>
            {PRESET_URLS.map((p) => (
              <TouchableOpacity
                key={p.url}
                style={[styles.chip, activeUrl === p.url && styles.chipActive]}
                onPress={() => navigate(p.url)}
              >
                <Text style={[styles.chipText, activeUrl === p.url && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.addressBar}>
            <TextInput
              style={styles.addressInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              onSubmitEditing={() => navigate(inputUrl)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              placeholder="Enter URL…"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.goBtn} onPress={() => navigate(inputUrl)}>
              <Text style={styles.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Phone frame (web only) / Fullscreen WebView (native) ── */}
        {Platform.OS === 'web' ? (
          <View style={styles.phoneFrame}>
            <View style={styles.notch} />
            <View style={styles.screen}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#0f3460" />
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              )}
              <iframe
                src={activeUrl}
                style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
                onLoad={() => setLoading(false)}
                title="simulator"
              />
            </View>
            <View style={styles.homeBarArea}>
              <View style={styles.homeBar} />
            </View>
          </View>
        ) : (
          <View style={styles.nativeScreen}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#0f3460" />
                <Text style={styles.loadingText}>Loading…</Text>
              </View>
            )}
            <WebView
              ref={webviewRef}
              source={{ uri: activeUrl }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onNavigationStateChange={(state) => {
                setCanGoBack(state.canGoBack);
                setCanGoForward(state.canGoForward);
                setCurrentTitle(state.title || '');
                setInputUrl(state.url);
              }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              mixedContentMode="always"
              applicationNameForUserAgent="MobileSimulator/1.0"
            />
          </View>
        )}

        {/* ── Browser navigation controls ── */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
            onPress={() => webviewRef.current?.goBack()}
            disabled={!canGoBack}
          >
            <Text style={styles.navBtnText}>‹ Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => webviewRef.current?.reload()}>
            <Text style={styles.navBtnText}>↻ Reload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            onPress={() => webviewRef.current?.goForward()}
            disabled={!canGoForward}
          >
            <Text style={styles.navBtnText}>Forward ›</Text>
          </TouchableOpacity>
        </View>

        {!!currentTitle && (
          <Text style={styles.titleText} numberOfLines={1}>{currentTitle}</Text>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    alignItems: 'center',
  },

  // Top bar
  topBar: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  appTitle: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a6a',
  },
  chipActive: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  chipText:       { color: '#aaa', fontSize: 11 },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: '#3a3a6a',
  },
  addressInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    paddingVertical: 6,
  },
  goBtn: {
    backgroundColor: '#e94560',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Phone frame
  phoneFrame: {
    marginTop: 16,
    width: PHONE_WIDTH + 20,
    height: PHONE_HEIGHT + 60,
    backgroundColor: '#1c1c2e',
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#3a3a5c',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  notch: {
    width: 100,
    height: 22,
    backgroundColor: '#1c1c2e',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginTop: 4,
    zIndex: 10,
  },
  screen: {
    width: PHONE_WIDTH,
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderRadius: 4,
    marginVertical: 2,
  },
  webview: { flex: 1 },
  nativeScreen: { flex: 1, width: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: { color: '#0f3460', marginTop: 8, fontSize: 13 },
  homeBarArea: {
    height: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBar: {
    width: 100,
    height: 4,
    backgroundColor: '#3a3a5c',
    borderRadius: 2,
  },

  // Nav controls
  navBar: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  navBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a6a',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#fff', fontSize: 12 },

  titleText: {
    color: '#555',
    fontSize: 11,
    marginTop: 6,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
