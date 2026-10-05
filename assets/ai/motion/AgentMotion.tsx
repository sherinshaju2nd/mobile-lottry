import Animated, {useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming} from 'react-native-reanimated';

export function useAgentMotion(state) {
  const v = useSharedValue(0);

  const start = () => {
    if (state === 'idle')
      v.value = withRepeat(withSequence(withTiming(1,{duration:1200}),withTiming(0,{duration:1200})),-1,true);
    else if (state === 'listening' || state === 'speaking')
      v.value = withRepeat(withSequence(withTiming(1,{duration:350}),withTiming(0,{duration:450})),-1,true);
    else if (['thinking','searching','processing'].includes(state))
      v.value = withRepeat(withSequence(withTiming(1,{duration:600}),withTiming(0,{duration:600})),-1,true);
    else
      v.value = withTiming(1,{duration:300});
  };

  return useAnimatedStyle(() => ({
    transform: [
      {translateY: state === 'idle' ? -6*v.value : 0},
      {scale: ['listening','speaking'].includes(state) ? 1+0.035*v.value : 1}
    ],
    opacity: .94 + .06*v.value
  }));
}
