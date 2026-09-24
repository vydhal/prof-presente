import { useEffect, useRef, useState } from "react";

const CertificatePreview = ({ templateImage, config, onConfigChange }) => {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState({});
  const [draggingElement, setDraggingElement] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Efeito para desenhar tudo no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = (img = null) => {
      // Se não houver imagem, usa o tamanho padrão A4 landscape aprox
      if (!img) {
        canvas.width = 842;
        canvas.height = 595;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Borda leve para delimitar
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      }

      ctx.textBaseline = "top";

      const newElements = {};

      // 0. Logo (Sempre desenha se configurado ou se for fundo branco)
      const logoConfig = {
          x: config.logoX || 40,
          y: config.logoY || 40,
          size: config.logoSize || 80,
          text: "LOGO"
      };
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(logoConfig.x, logoConfig.y, logoConfig.size, logoConfig.size);
      ctx.strokeStyle = "#9ca3af";
      ctx.strokeRect(logoConfig.x, logoConfig.y, logoConfig.size, logoConfig.size);
      ctx.fillStyle = "#6b7280";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LOGO", logoConfig.x + logoConfig.size/2, logoConfig.y + logoConfig.size/2 - 6);
      ctx.textAlign = "left";
      newElements.logo = { ...logoConfig, width: logoConfig.size, height: logoConfig.size };

      // 1. Nome
      const nameConfig = {
        x: config.nameX || 20,
        y: config.nameY || 100,
        fontSize: config.nameFontSize || 32,
        color: config.nameColor || "#000000",
        text: "Nome do Participante (Exemplo)",
      };
      ctx.fillStyle = nameConfig.color;
      ctx.font = `bold ${nameConfig.fontSize}px sans-serif`;
      const nameMetrics = ctx.measureText(nameConfig.text);
      ctx.fillText(nameConfig.text, nameConfig.x, nameConfig.y);
      newElements.name = { ...nameConfig, width: nameMetrics.width, height: parseInt(nameConfig.fontSize) };

      // 2. Horas
      const hoursConfig = {
        x: config.hoursX || 20,
        y: config.hoursY || 180,
        fontSize: config.hoursFontSize || 20,
        color: config.hoursColor || "#333333",
        text: "Carga Horária: XX h",
      };
      ctx.fillStyle = hoursConfig.color;
      ctx.font = `${hoursConfig.fontSize}px sans-serif`;
      const hoursMetrics = ctx.measureText(hoursConfig.text);
      ctx.fillText(hoursConfig.text, hoursConfig.x, hoursConfig.y);
      newElements.hours = { ...hoursConfig, width: hoursMetrics.width, height: parseInt(hoursConfig.fontSize) };

      // 3. Data (NOVO)
      const dateConfig = {
        x: config.dateX || 20,
        y: config.dateY || 220,
        fontSize: config.dateFontSize || 18,
        color: config.dateColor || "#333333",
        text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      };
      ctx.fillStyle = dateConfig.color;
      ctx.font = `${dateConfig.fontSize}px sans-serif`;
      const dateMetrics = ctx.measureText(dateConfig.text);
      ctx.fillText(dateConfig.text, dateConfig.x, dateConfig.y);
      newElements.date = { ...dateConfig, width: dateMetrics.width, height: parseInt(dateConfig.fontSize) };

      // 4. Frase Customizada (Placeholders e Wrapping)
      if (config.phraseText) {
          let phraseText = config.phraseText;
          phraseText = phraseText.replace(/{nome}/g, "Nome do Aluno");
          phraseText = phraseText.replace(/{horas}/g, "10");
          phraseText = phraseText.replace(/{data}/g, new Date().toLocaleDateString("pt-BR"));
          phraseText = phraseText.replace(/{evento}/g, "Título do Evento");

          const phraseFontSize = config.phraseFontSize || 16;
          const phraseColor = config.phraseColor || "#000000";
          const phraseMaxWidth = config.phraseMaxWidth || 600;
          const phraseX = config.phraseX || 20;
          const phraseY = config.phraseY || 280;

          ctx.fillStyle = phraseColor;
          ctx.font = `${phraseFontSize}px sans-serif`;

          const words = phraseText.split(' ');
          let line = '';
          let yOffset = 0;
          let maxLineWidth = 0;

          for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > phraseMaxWidth && n > 0) {
                  ctx.fillText(line, phraseX, phraseY + yOffset);
                  maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
                  line = words[n] + ' ';
                  yOffset += phraseFontSize * 1.3;
              } else {
                  line = testLine;
              }
          }
          ctx.fillText(line, phraseX, phraseY + yOffset);
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          
          newElements.phrase = { 
              x: phraseX, 
              y: phraseY, 
              width: maxLineWidth || phraseMaxWidth, 
              height: yOffset + parseInt(phraseFontSize),
              isPhrase: true 
          };
      }

      setElements(newElements);
    };

    if (templateImage) {
      const template = new Image();
      template.crossOrigin = "anonymous";
      template.src = templateImage;
      template.onload = () => draw(template);
      template.onerror = () => draw(null);
    } else {
      draw(null);
    }
  }, [templateImage, config]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    const updatedConfig = { ...config };
    if (draggingElement === "name") {
      updatedConfig.nameX = newX;
      updatedConfig.nameY = newY;
    } else if (draggingElement === "hours") {
      updatedConfig.hoursX = newX;
      updatedConfig.hoursY = newY;
    } else if (draggingElement === "date") {
      updatedConfig.dateX = newX;
      updatedConfig.dateY = newY;
    } else if (draggingElement === "logo") {
      updatedConfig.logoX = newX;
      updatedConfig.logoY = newY;
    } else if (draggingElement === "phrase") {
      updatedConfig.phraseX = newX;
      updatedConfig.phraseY = newY;
    }
    onConfigChange(updatedConfig);
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Pré-visualização Interativa</h4>
        <span className="text-xs text-muted-foreground">Arraste os elementos para posicionar</span>
      </div>
      <div className="w-full bg-gray-50 border rounded-lg flex items-center justify-center overflow-hidden p-4">
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%",
            height: "auto",
            cursor: draggingElement ? "grabbing" : "grab",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            backgroundColor: "white"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default CertificatePreview;
