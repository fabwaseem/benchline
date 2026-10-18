/** Browser stand-in so the client bundle does not pull in the native ONNX runtime. */
const onnxStub: Record<string, never> = {};

export default onnxStub;
