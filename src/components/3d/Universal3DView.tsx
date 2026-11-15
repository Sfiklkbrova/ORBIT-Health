import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export interface Universal3DViewRef {
  postMessage: (message: string) => void;
}

interface Universal3DViewProps {
  html: string;
  style?: StyleProp<ViewStyle>;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
}

export const Universal3DView = forwardRef<Universal3DViewRef, Universal3DViewProps>(
  ({ html, style, onMessage }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const webViewRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      postMessage: (msg: string) => {
        if (Platform.OS === 'web') {
          iframeRef.current?.contentWindow?.postMessage(msg, '*');
        } else {
          webViewRef.current?.postMessage(msg);
        }
      },
    }));

    useEffect(() => {
      if (Platform.OS !== 'web' || !onMessage) return;

      const handleWindowMessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          onMessage({ nativeEvent: { data: event.data } });
        }
      };

      window.addEventListener('message', handleWindowMessage);
      return () => {
        window.removeEventListener('message', handleWindowMessage);
      };
    }, [onMessage]);

    if (Platform.OS === 'web') {
      return (
        <View style={[styles.container, style]}>
          <iframe
            ref={iframeRef as any}
            srcDoc={html}
            title="3D Canvas Environment"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#010309',
              display: 'block',
              overflow: 'hidden',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        </View>
      );
    }

    return (
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={[styles.webView, style]}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
        onMessage={onMessage}
      />
    );
  }
);

Universal3DView.displayName = 'Universal3DView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010309',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#010309',
  },
});
