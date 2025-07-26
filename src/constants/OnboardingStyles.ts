import { ViewStyle, TextStyle } from 'react-native';

export const ONBOARDING_BUTTON_STYLE: ViewStyle = {
  width: '100%',
  height: 60,
  borderRadius: 16,
  paddingVertical: 0,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 8,
};

export const ONBOARDING_CONTAINER_STYLE: ViewStyle = {
  padding: 16,
  backgroundColor: '#ffffff',
  borderTopWidth: 1,
  borderTopColor: '#f3f4f6',
};

export const ONBOARDING_FOOTER_TEXT_STYLE: TextStyle = {
  fontSize: 14,
  textAlign: 'center',
  lineHeight: 20,
  color: '#9ca3af',
  marginTop: 12,
};