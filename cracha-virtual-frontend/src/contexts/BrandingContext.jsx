import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsAPI } from "../lib/api";
import { getAssetUrl } from "../lib/utils";

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
    const { data: settings, refetch } = useQuery({
        queryKey: ["system-settings"],
        queryFn: async () => {
            const response = await settingsAPI.get();
            return response.data;
        },
        staleTime: Infinity, // Settings usually don't change often
    });

    const [platformName, setPlatformName] = useState("SEDUC Eventos");
    const [logoUrl, setLogoUrl] = useState(null);
    const [faviconUrl, setFaviconUrl] = useState(null);

    useEffect(() => {
        if (settings) {
            const name = settings.platformName || "SEDUC Eventos";
            setPlatformName(name);
            setLogoUrl(settings.logoUrl ? getAssetUrl(settings.logoUrl) : null);
            setFaviconUrl(settings.faviconUrl ? getAssetUrl(settings.faviconUrl) : null);

            // Update document title
            document.title = name;

            // Update favicon
            if (settings.faviconUrl) {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement("link");
                    link.rel = "icon";
                    document.getElementsByTagName("head")[0].appendChild(link);
                }
                link.href = getAssetUrl(settings.faviconUrl);
            }
        }
    }, [settings]);

    // Listen for branding updates
    useEffect(() => {
        const handleUpdate = () => {
            refetch();
        };

        window.addEventListener("branding:updated", handleUpdate);
        return () => window.removeEventListener("branding:updated", handleUpdate);
    }, [refetch]);

    return (
        <BrandingContext.Provider value={{ platformName, logoUrl, faviconUrl }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error("useBranding must be used within a BrandingProvider");
    }
    return context;
};
