import { useEffect, useRef, useState } from "react";

const BadgePreview = ({
  templateImage,
  config,
  qrCodeImageSrc,
  onConfigChange,
}) => {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState({});
  const [draggingElement, setDraggingElement] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Efeito para desenhar tudo no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const template = new Image();
    template.crossOrigin = "anonymous";
    template.src = templateImage;

    template.onload = () => {
      canvas.width = template.width;
      canvas.height = template.height;

      ctx.drawImage(template, 0, 0);

      // Define a baseline para o topo, facilitando o cálculo de coordenadas
      ctx.textBaseline = "top";

      // Configurações e desenho do Nome
      const nameConfig = {
        x: config.nameX || 20,
        y: config.nameY || 20,
        fontSize: config.nameFontSize || 24,
        color: config.nameColor || "#000000",
        text: "Seu Nome Completo Aqui",
      };
      ctx.fillStyle = nameConfig.color;
      ctx.font = `bold ${nameConfig.fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(nameConfig.text);
      ctx.fillText(nameConfig.text, nameConfig.x, nameConfig.y);

      // Configurações e desenho do QR Code
      const qrConfig = {
        x: config.qrX || 20,
        y: config.qrY || 60,
        size: config.qrSize || 100,
      };
      const qrCode = new Image();
      qrCode.src = qrCodeImageSrc;
      qrCode.onload = () => {
        ctx.drawImage(
          qrCode,
          qrConfig.x,
          qrConfig.y,
          qrConfig.size,
          qrConfig.size
        );
        // Armazena as áreas clicáveis dos elementos
        setElements({
          name: {
            ...nameConfig,
            width: textMetrics.width,
            height: nameConfig.fontSize,
          },
          qr: { ...qrConfig, width: qrConfig.size, height: qrConfig.size },
        });
      };
    };

    template.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = "16px sans-serif";
      ctx.fillText("Erro ao carregar a imagem do modelo.", 10, 30);
    };
  }, [templateImage, config, qrCodeImageSrc]);

  // Funções para o Drag and Drop
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (const key in elements) {
      const el = elements[key];
      if (
        mouseX >= el.x &&
        mouseX <= el.x + el.width &&
        mouseY >= el.y &&
        mouseY <= el.y + el.height
      ) {
        setDraggingElement(key);
        setOffset({ x: mouseX - el.x, y: mouseY - el.y });
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingElement) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const newX = Math.round(mouseX - offset.x);
    const newY = Math.round(mouseY - offset.y);

    if (draggingElement === "name") {
      onConfigChange({ ...config, nameX: newX, nameY: newY });
    } else if (draggingElement === "qr") {
      onConfigChange({ ...config, qrX: newX, qrY: newY });
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  return (
    <div>
      <h4 className="font-medium mb-2">Pré-visualização</h4>
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {templateImage ? (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              height: "auto",
              cursor: draggingElement ? "grabbing" : "grab",
              backgroundcolor: "#ccc",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Para o drag se o mouse sair do canvas
          />
        ) : (
          <div className="text-center text-gray-500 h-48 flex items-center">
            <p>Envie uma imagem de fundo para ver a pré-visualização.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgePreview;
