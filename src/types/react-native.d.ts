declare module 'react-native' {
  import { ComponentType, ReactNode } from 'react';

  export interface ViewProps {
    style?: any;
    children?: ReactNode;
  }

  export interface TextProps {
    style?: any;
    children?: ReactNode;
  }

  export interface TouchableOpacityProps {
    style?: any;
    onPress?: () => void;
    children?: ReactNode;
  }

  export interface ScrollViewProps {
    style?: any;
    children?: ReactNode;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    horizontal?: boolean;
    contentContainerStyle?: any;
  }

  export interface KeyboardAvoidingViewProps extends ViewProps {
    behavior?: 'height' | 'position' | 'padding';
    keyboardVerticalOffset?: number;
  }

  export interface TextInputProps {
    style?: any;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    editable?: boolean;
    onFocus?: (e: any) => void;
    onBlur?: (e: any) => void;
    secureTextEntry?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    keyboardType?: string;
    returnKeyType?: string;
    blurOnSubmit?: boolean;
    onSubmitEditing?: () => void;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const TouchableOpacity: ComponentType<TouchableOpacityProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const ScrollView: ComponentType<ScrollViewProps>;
  export const KeyboardAvoidingView: ComponentType<KeyboardAvoidingViewProps>;
  export const Platform: {
    OS: 'ios' | 'android' | 'web';
    select: <T extends Record<string, any>>(obj: T) => T[keyof T];
  };
  export const Animated: {
    Value: any;
    View: ComponentType<any>;
    timing: (value: any, config: any) => any;
    sequence: (animations: any[]) => any;
  };
  export const StyleSheet: {
    create<T extends { [key: string]: any }>(styles: T): T;
  };

  export type StyleProp<T> = T | T[];
  export type ViewStyle = any;
  export type TextStyle = any;
} 