// 音频处理工具集

function arrayBufferToBase64(arrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += Array.from(chunk)
      .map((number) => String.fromCharCode(number))
      .join("");
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function mergeInt16Arrays(left, right) {
  if (left instanceof ArrayBuffer) {
    left = new Int16Array(left);
  }
  if (right instanceof ArrayBuffer) {
    right = new Int16Array(right);
  }
  if (!(left instanceof Int16Array) || !(right instanceof Int16Array)) {
    throw new Error("Both items must be Int16Array");
  }
  const newValues = new Int16Array(left.length + right.length);

  for (let i = 0; i < left.length; i++) {
    newValues[i] = left[i];
  }
  for (let j = 0; j < right.length; j++) {
    newValues[left.length + j] = right[j];
  }
  return newValues;
}

function float32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return int16Array;
}

function splitInt16Array(input, chunkSize) {
  const result = [];
  const totalLength = input.length;

  for (let i = 0; i < totalLength; i += chunkSize) {
    const chunk = input.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

function splitFloat32Array(input, chunkSize) {
  const result = [];
  const totalLength = input.length;

  for (let i = 0; i < totalLength; i += chunkSize) {
    const chunk = input.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

/**
 * 生成指定时长的静音 PCM16 数据
 * @param durationMs 静音时长（毫秒）
 * @param sampleRate 采样率，默认 24000Hz
 */
function generateSilencePCM(durationMs, sampleRate = 24000) {
  const numSamples = Math.max(1, Math.floor((durationMs * sampleRate) / 1000));
  return new Int16Array(numSamples);
}

export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  mergeInt16Arrays,
  float32ToInt16,
  splitInt16Array,
  splitFloat32Array,
  generateSilencePCM,
};
