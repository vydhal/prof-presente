import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  Sheet,
  SheetContent,
  SheetDescription, // NOVO
  SheetHeader, // NOVO
  SheetTitle, // NOVO
  SheetTrigger,
} from "./ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // NOVO
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Hop as Home,
  Calendar,
  Download,
  ChartBar as BarChart3,
  Menu,
  LogOut,
  User,
  CreditCard,
  FileText,
  QrCode,
  Star,
  Shield,
  Trophy,
  MessageSquare,
} from "lucide-react";
import Logo from "../assets/logo-prof-presente.svg"; // Importe o seu logo
import { getAssetUrl } from "../lib/utils"; // NOVO: Importa a função auxiliar
import AppTour from "./AppTour";
import BottomNavbar from "./BottomNavbar";

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isOrg } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // NOVO: Estados para controlar o prompt de instalação do PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // NOVO: useEffect para ouvir o evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Previne que o mini-infobar do Chrome apareça
      e.preventDefault();
      // Guarda o evento para que ele possa ser acionado mais tarde.
      setDeferredPrompt(e);
      // Mostra nosso botão de instalação customizado
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // NOVO: Função para acionar o prompt de instalação
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    // Espera o usuário responder ao prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Limpamos o prompt, pois ele só pode ser usado uma vez.
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      id: "nav-link-dashboard",
    },
    {
      name: "Eventos",
      href: "/events",
      icon: Calendar,
      id: "nav-link-eventos",
    },
    {
      name: "Interações em Tempo Real",
      href: "/interactions",
      icon: MessageSquare, // Need to import this
      id: "nav-link-interactions",
    },
    {
      name: "Minhas Inscrições",
      href: "/my-enrollments",
      icon: FileText,
      id: "nav-link-minhas-inscrições",
    },
    {
      name: "Meu Perfil",
      href: "/profile",
      icon: CreditCard,
      id: "nav-link-meu-perfil",
    },
    { name: "Avaliações", href: "/evaluations", icon: Star },
    ...(isAdmin || user?.role === "CHECKIN_COORDINATOR" || isOrg
      ? [{ name: "Check-in", href: "/check-in", icon: QrCode }]
      : []),
    { name: "Ranking de Checkins", href: "/ranking", icon: Trophy },
    ...(isAdmin || user?.role === "GESTOR_ESCOLA" || isOrg
      ? [{ name: "Administração", href: "/admin", icon: Shield }]
      : []),
  ];

  const handleLogout = () => {
    logout();
  };

  const isActive = (href) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b">
        <div className="flex items-center space-x-2">
          <img src={Logo} alt="Logo" className="h-10" />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              id={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={getAssetUrl(user?.photoUrl)} alt={user?.name} />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r">
          <SidebarContent />
        </div>
      </div>

      {/* Sidebar móvel */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          {/* Adicionamos um título e descrição escondidos para acessibilidade */}
          <VisuallyHidden asChild>
            <SheetHeader>
              <SheetTitle>Menu Principal</SheetTitle>
              <SheetDescription>Navegação principal do site.</SheetDescription>
            </SheetHeader>
          </VisuallyHidden>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-card border-b px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Esta é a segunda sidebar, que também precisa da correção */}
              <Sheet>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  id="mobile-menu-trigger"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <SheetContent side="left" className="p-0 w-64">
                  {/* Adicionamos um título e descrição escondidos para acessibilidade */}
                  <VisuallyHidden asChild>
                    <SheetHeader>
                      <SheetTitle>Menu Principal</SheetTitle>
                      <SheetDescription>
                        Navegação principal do site.
                      </SheetDescription>
                    </SheetHeader>
                  </VisuallyHidden>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-semibold">
                {navigation.find((item) => isActive(item.href))?.name ||
                  "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {showInstallButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInstallClick}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Instalar App
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id="user-avatar-button"
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getAssetUrl(user?.photoUrl)}
                        alt={user?.name}
                      />
                      <AvatarFallback>
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        {user && <AppTour user={user} setSidebarOpen={setSidebarOpen} />}

        {/* Global Bottom Nav */}
        <BottomNavbar />
      </div>
    </div>
  );
};

export default Layout;
