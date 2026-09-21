import React, { useEffect, useRef } from 'react';
import { Modal as RNModal, View, Pressable, Platform, Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  children,
  className = '',
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const openedAtRef = useRef(0);

  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle vertical gestures that are moving downward
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down, not up (beyond the starting position)
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 100px or with high velocity, dismiss the modal
        if (gestureState.dy > 100 || (gestureState.vy > 0.5 && gestureState.dy > 0)) {
          closeModal();
        } else {
          // Otherwise, snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Combined animation value for slide and drag
  const translateY = Animated.add(slideAnim, dragY);

  // Function to close the modal with animation
  const closeModal = (source: 'backdrop' | 'swipe' | 'request' = 'request') => {
    if (
      source === 'backdrop' &&
      openedAtRef.current > 0 &&
      Date.now() - openedAtRef.current < 300
    ) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose();
      dragY.setValue(0);
    });
  };

  useEffect(() => {
    if (isVisible) {
      openedAtRef.current = Date.now();

      // Reset the drag position
      dragY.setValue(0);
      
      // Start fade-in animation immediately
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Slide up animation with natural spring physics
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset animations when modal is hidden
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get('window').height);
    }
  }, [isVisible]);

  return (
    <RNModal
      transparent={true}
      visible={isVisible}
      onRequestClose={() => closeModal('request')}
      statusBarTranslucent={Platform.OS === 'android'}
      animationType="none"
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <Animated.View 
        className="flex-1"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingTop: insets.top,
          opacity: fadeAnim,
          // Adding a subtle backdrop filter effect using native shadows
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={() => closeModal('backdrop')}
        />
        
        <Animated.View 
          className={`flex-1 ${className}`}
          style={{
            marginTop: 'auto',
            maxHeight: '95%',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            transform: [{ translateY: translateY }],
          }}
        >
          {/* Content container with gesture handler at the top */}
          <View className="flex-1">
            {/* Gesture handler container - covers header and handle area */}
            <View 
              style={{ 
                height: 80, // Height to cover header + handle
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
              }}
              {...panResponder.panHandlers}
            />
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}; 
