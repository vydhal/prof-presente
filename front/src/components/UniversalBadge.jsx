import React, { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import Logo from "../assets/logo-prof-presente-white.svg";
import { getAssetUrl } from "../lib/utils";
import api from "@/lib/api";
import { useBranding } from "../contexts/BrandingContext";

const LogoPlaceholder = ({ logoUrl }) => (
  <img
    src={logoUrl ? getAssetUrl(logoUrl) : Logo}
    className="h-7 object-contain max-w-[150px]"
    alt="Logo do Sistema"
  />
);

const UniversalBadge = ({ user, badge, awards = [] }) => {
  const { logoUrl } = useBranding();
  const badgeRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadServer = async () => {
    setIsDownloading(true);
    toast.info("Gerando seu crachá...");

    try {
      // Use sua instância 'api' (do Axios ou fetch) que já inclui o token
      const response = await api.get("/badges/download", {
        responseType: "blob", // MUITO IMPORTANTE: Tratar a resposta como um arquivo
      });

      // Cria um link <a> na memória para iniciar o download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `cracha_universal_${user.name.replace(/\s/g, "_")}.png`
      );
      document.body.appendChild(link);
      link.click();

      // Limpa
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download do crachá iniciado!");
    } catch (error) {
      console.error("Erro ao baixar o crachá:", error);
      toast.error("Ocorreu um erro ao baixar o crachá.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user || !badge) {
    return <p>Carregando dados do crachá...</p>;
  }

  const latestAwards = Array.isArray(awards) ? awards.slice(0, 5) : [];

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={badgeRef}
        className="relative w-[320px] h-[560px] rounded-2xl shadow-lg overflow-hidden text-white bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6" // AJUSTE 1: Removemos as classes de gradiente e cor do Tailwind
      >
        <div className="relative z-10 flex flex-col items-center justify-between h-full">
          <div className="flex items-center justify-between w-full">
            <LogoPlaceholder logoUrl={logoUrl} />
            {latestAwards.length > 0 && (
              <div className="flex justify-center gap-2">
                {latestAwards.map(({ award }) => (
                  <img
                    key={award.id}
                    src={getAssetUrl(award.imageUrl)}
                    alt={award.name}
                    title={award.name}
                    className="h-7 w-7 rounded-full border-1 border-white/50"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center text-center mt-2">
            <Avatar className="w-24 h-24 border-2 border-white/80 mb-1 shadow-lg">
              <AvatarImage src={getAssetUrl(user.photoUrl)} alt={user.name} />
              <AvatarFallback className="text-3xl bg-gray-700">
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold tracking-tight leading-tight mb-1">
              {user.name}
            </h2>
          </div>
          <div className="flex flex-col items-center text-center bg-white/95 p-4 rounded-xl backdrop-blur-sm w-[100%]">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={JSON.stringify({
                userId: user.id,
                badgeCode: badge.badgeCode,
                badgeType: "user",
              })}
              viewBox={`0 0 256 256`}
            />
            <p className="mt-2 font-mono text-sm font-bold tracking-wider text-gray-800">
              {badge.badgeCode}
            </p>
          </div>
        </div>
      </div>

      <Button
        id="download-badge-button"
        onClick={handleDownloadServer}
        className="w-full max-w-sm"
        disabled={isDownloading}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? "Gerando..." : "Salvar Crachá como PNG"}
      </Button>
    </div>
  );
};

export default UniversalBadge;
