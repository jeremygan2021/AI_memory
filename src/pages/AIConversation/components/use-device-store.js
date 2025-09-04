// 设备状态管理
import { create } from "zustand";
import { WavRecorder, WavStreamPlayer } from "wavtools";

const useDeviceStore = create(() => {
  return {
    wavRecorder: new WavRecorder({ sampleRate: 24000 }),
    wavStreamPlayer: new WavStreamPlayer({ sampleRate: 24000 }),
  };
});

export default useDeviceStore;
export { useDeviceStore };
