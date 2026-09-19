const fs = require('fs');

let content = fs.readFileSync('src/components/PlateScannerModal.tsx', 'utf8');

const oldCode = `  const handlePlateCapture = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (Math.random() > 0.3) {
        processDetectedPlate('1234BBB', 'Ford Focus');
      } else {
        setError('No se pudo leer la matrícula correctamente.');
      }
    } catch (err) {
      setError('Error al procesar la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };`;

const newCode = `  const handlePlateCapture = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64Image = await convertFileToBase64(file);
      
      const response = await fetch('/api/plate-recognizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, region: 'es' })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al procesar la matrícula');
      }
      
      if (result.data && result.data.results && result.data.results.length > 0) {
        const detectedPlate = result.data.results[0].plate.toUpperCase();
        processDetectedPlate(detectedPlate, 'Vehículo (detectado)');
      } else {
        setError('No se encontró ninguna matrícula en la imagen.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor OCR.');
    } finally {
      setIsProcessing(false);
    }
  };`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('src/components/PlateScannerModal.tsx', content);
