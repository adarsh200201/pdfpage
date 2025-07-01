// Simple test to verify OCR functionality
export const testOcrFunctionality = async (): Promise<boolean> => {
  try {
    // Test if Tesseract.js can be imported
    const { createWorker } = await import("tesseract.js");

    // Test worker creation
    const worker = await createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    // Simple test with a small canvas
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d")!;

    // Draw simple text
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("TEST", 50, 30);

    // Test OCR recognition
    const { data } = await worker.recognize(canvas);
    await worker.terminate();

    // Check if it recognized something close to "TEST"
    const recognizedText = data.text.trim().toUpperCase();
    return recognizedText.includes("TEST") || data.confidence > 50;
  } catch (error) {
    console.error("OCR test failed:", error);
    return false;
  }
};
