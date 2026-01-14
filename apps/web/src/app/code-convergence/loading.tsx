import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';

export default function Loading() {
  return (
    <MemoryLoadingScreen
      isVisible={true}
      text="// Loading Code Convergence..."
      duration={2000}
    />
  );
}
