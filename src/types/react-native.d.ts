declare module 'react-native' {
  import type { ComponentType, ReactNode } from 'react';

  export type StyleProp<T> = T | T[];
  export type ViewStyle = Record<string, any>;
  export type TextStyle = Record<string, any>;
  export type ImageStyle = Record<string, any>;

  interface BaseProps {
    style?: StyleProp<ViewStyle | TextStyle | ImageStyle>;
    children?: ReactNode;
    testID?: string;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    [key: string]: any;
  }

  export interface ViewProps extends BaseProps {
    pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  }

  export interface TextProps extends BaseProps {
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  }

  export interface TouchableOpacityProps extends ViewProps {
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
  }

  export interface ScrollViewProps extends ViewProps {
    horizontal?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  }

  export interface RefreshControlProps extends ViewProps {
    refreshing: boolean;
    onRefresh: () => void;
    tintColor?: string;
    title?: string;
    colors?: string[];
  }

  export interface KeyboardAvoidingViewProps extends ViewProps {
    behavior?: 'height' | 'position' | 'padding';
    keyboardVerticalOffset?: number;
  }

  export interface TextInputProps extends ViewProps {
    value?: string;
    defaultValue?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: string;
    inputMode?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: string;
    autoCorrect?: boolean;
    autoFocus?: boolean;
    importantForAutofill?: string;
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    editable?: boolean;
    returnKeyType?: string;
    textContentType?: string;
  }

  export interface ModalProps extends ViewProps {
    visible: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    presentationStyle?: string;
    onRequestClose?: () => void;
  }

  export interface ImageProps extends ViewProps {
    source: any;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const ScrollView: ComponentType<ScrollViewProps>;
  export const RefreshControl: ComponentType<RefreshControlProps>;
  export const TouchableOpacity: ComponentType<TouchableOpacityProps>;
  export const KeyboardAvoidingView: ComponentType<KeyboardAvoidingViewProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const Modal: ComponentType<ModalProps>;
  export const Image: ComponentType<ImageProps>;

  export const Platform: {
    OS: 'ios' | 'android' | 'web';
    select: <T>(options: { ios?: T; android?: T; web?: T; default?: T }) => T;
  };

  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale?: number; fontScale?: number };
  };

  export const Alert: {
    alert: (title: string, message?: string, buttons?: Array<{ text?: string; onPress?: () => void; style?: string }>, options?: { cancelable?: boolean }) => void;
  };

  export const StyleSheet: {
    create<T extends { [key: string]: ViewStyle | TextStyle | ImageStyle }>(styles: T): T;
  };

  export namespace Animated {
    class Value {
      constructor(value: number);
      setValue(value: number): void;
      interpolate(config: Record<string, any>): any;
    }
    const View: ComponentType<ViewProps>;
    function timing(value: any, config: any): any;
    function spring(value: any, config: any): any;
    function sequence(animations: any[]): any;
    function loop(animation: any, config?: Record<string, any>): any;
    function parallel(animations: any[]): any;
  }

  export const Linking: {
    openURL: (url: string) => Promise<void>;
    canOpenURL: (url: string) => Promise<boolean>;
  };
}
