import { useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://eduagenda.simplisoft.com.br/api';

const BadgeGenerator = ({ badge, onClose }) => {
  const badgeRef = useRef(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownload = async () => {
    try {
      if (!badgeRef.current) return;

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
      });

      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `cracha-${badge.enrollment?.user?.name || badge.id}.png`;
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Crachá baixado com sucesso!");
      });
    } catch (error) {
      console.error("Erro ao baixar crachá:", error);
      toast.error(`Erro ao baixar crachá: ${error.message}`);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const badgeHTML = badgeRef.current.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Crachá</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
          </style>
        </head>
        <body>
          ${badgeHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Crachá Virtual</h3>
            <Button variant="ghost" onClick={onClose} size="sm">
              ✕
            </Button>
          </div>

          {/* Crachá para visualização/impressão */}
          <div
            ref={badgeRef}
            style={{
              width: "400px",
              minHeight: "550px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
              backgroundColor: "#4F46E5",
              color: "#ffffff",
              padding: "32px",
              borderRadius: "16px",
              marginBottom: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* Header do Crachá */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "112px",
                height: "112px",
                backgroundColor: "#ffffff",
                borderRadius: "50%",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
              }}>
                {badge.enrollment?.user?.photoUrl ? (
                  <img
                    src={badge.enrollment.user.photoUrl}
                    alt={badge.enrollment.user.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "30px",
                      fontWeight: "bold",
                      background: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)",
                      backgroundColor: "#818CF8"
                    }}
                  >
                    {badge.enrollment?.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <h4 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "4px", color: "#ffffff" }}>
                {badge.enrollment?.user?.name}
              </h4>
              <p style={{ fontSize: "14px", color: "rgba(199, 210, 254, 0.9)" }}>
                {badge.enrollment?.user?.email}
              </p>
            </div>

            {/* Divisor */}
            <div style={{ margin: "24px 0", borderTop: "2px solid rgba(255, 255, 255, 0.3)", height: "0" }}></div>

            {/* Informações do Evento */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h5 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "rgba(199, 210, 254, 0.9)" }}>
                  Evento
                </h5>
                <p style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff" }}>
                  {badge.enrollment?.event?.title}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
                <div>
                  <p style={{ marginBottom: "4px", color: "rgba(199, 210, 254, 0.9)" }}>Data</p>
                  <p style={{ fontWeight: "600", color: "#ffffff" }}>
                    {formatDate(badge.enrollment?.event?.startDate)}
                  </p>
                </div>
                <div>
                  <p style={{ marginBottom: "4px", color: "rgba(199, 210, 254, 0.9)" }}>Local</p>
                  <p style={{ fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#ffffff" }}>
                    {badge.enrollment?.event?.location}
                  </p>
                </div>
              </div>

              <div>
                <p style={{ fontSize: "12px", marginBottom: "4px", color: "rgba(199, 210, 254, 0.9)" }}>ID do Crachá</p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    wordBreak: "break-all"
                  }}
                >
                  {badge.id}
                </p>
              </div>
              {badge.badgeCode && (
                <div>
                  <p style={{ fontSize: "12px", marginBottom: "4px", color: "rgba(199, 210, 254, 0.9)" }}>Código do Crachá</p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "16px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      color: "#ffffff",
                      fontWeight: "bold",
                      textAlign: "center",
                      letterSpacing: "1px"
                    }}
                  >
                    {badge.badgeCode}
                  </p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div style={{ marginTop: "24px" }}>
              <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#ffffff" }}>
                {badge.qrCodeUrl ? (
                  <img
                    src={`${API_BASE_URL.replace('/api', '')}${badge.qrCodeUrl}`}
                    alt="QR Code"
                    style={{ width: "100%", height: "auto", maxWidth: "200px", margin: "0 auto", display: "block" }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Erro ao carregar QR Code:', badge.qrCodeUrl);
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<p style="text-align: center; color: #6B7280;">QR Code não disponível</p>';
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#6B7280" }}>
                    <p>QR Code não disponível</p>
                  </div>
                )}
                <p style={{ textAlign: "center", fontSize: "12px", marginTop: "12px", color: "#4B5563" }}>
                  Apresente este QR Code na entrada
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar PNG
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgeGenerator;
