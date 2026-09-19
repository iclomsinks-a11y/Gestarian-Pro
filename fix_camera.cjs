const fs = require('fs');

let content = fs.readFileSync('src/components/PlateScannerModal.tsx', 'utf8');

const replacement = `
  const startCamera = async () => {
    try {
      if (stream) return;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("Error al acceder a la cámara", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
`;

content = content.replace(/  const startCamera = async \(\) => \{[\s\S]*?  const stopCamera = \(\) => \{[\s\S]*?    \}\n  \};/m, replacement);

fs.writeFileSync('src/components/PlateScannerModal.tsx', content);
