import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';

export default function Loading() {
  return (
    <MemoryLoadingScreen
      isVisible={true}
      text="// Loading cheat sheet..."
      duration={2000}
    />
  );
}
