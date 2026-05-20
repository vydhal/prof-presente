import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Eye, EyeOff, Loader2, ChevronsUpDown, X, User, Briefcase, MapPin } from "lucide-react";
import LogoDefaultWhite from "../assets/logo-prof-presente-white.svg";
import LogoDefault from "../assets/logo-prof-presente.svg";
import { useBranding } from "../contexts/BrandingContext";
import api from "../lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import { Badge } from "../components/ui/badge.jsx";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { DatePicker } from "../components/ui/date-picker";
import { Separator } from "../components/ui/separator";

const workShiftOptions = [
  { value: "MANHA", label: "Manhã" },
  { value: "TARDE", label: "Tarde" },
  { value: "NOITE", label: "Noite" },
  { value: "INTEGRAL", label: "Integral" },
];

const teachingSegmentOptions = [
  { value: "SUPERIOR", label: "Superior" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "INFANTIL", label: "Ed. Infantil" },
  { value: "FUNDAMENTAL1", label: "Fundamental I" },
  { value: "FUNDAMENTAL2", label: "Fundamental II" },
  { value: "EJA", label: "EJA" },
];

const professionOptions = [
  { value: "gestor", label: "Gestor" },
  { value: "gestor adjunto", label: "Gestor Adjunto" },
  { value: "secretário", label: "Secretário" },
  { value: "educador social voluntário", label: "Educador Social Voluntário" },
  { value: "supervisor", label: "Supervisor" },
  { value: "suporte pedagógico", label: "Suporte Pedagógico" },
  { value: "orientador(a) educacional", label: "Orientador(a) Educacional" },
  { value: "coordenador(a) pedagógico(a)", label: "Coordenador(a) Pedagógico(a)" },
  { value: "professor", label: "Professor" },
  { value: "merendeiro", label: "Merendeiro" },
  { value: "apoio", label: "Apoio" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "psicólogo", label: "Psicólogo" },
  { value: "assistente social", label: "Assistente Social" },
  { value: "organizador", label: "Organizador" },
  { value: "vigia", label: "Vigia" },
];

const serieOptions = [
  { value: "bercário I", label: "Bercário I" },
  { value: "bercário II", label: "Bercário II" },
  { value: "maternal I", label: "Maternal I" },
  { value: "maternal II", label: "Maternal II" },
  { value: "pré I", label: "Pré I" },
  { value: "pré II", label: "Pré II" },
  { value: "1º ao 5º", label: "1º ao 5º" },
  { value: "6º ao 9º", label: "6º ao 9º" },
];

const subjectOptions = [
  { value: "Polivalente", label: "Polivalente" },
  { value: "Português", label: "Português" },
  { value: "Matemática", label: "Matemática" },
  { value: "História", label: "História" },
  { value: "Geografia", label: "Geografia" },
  { value: "Ciências", label: "Ciências" },
  { value: "Inglês", label: "Inglês" },
  { value: "Artes", label: "Artes" },
  { value: "Educação Física", label: "Educação Física" },
  { value: "Ensino Religioso", label: "Ensino Religioso" },
  { value: "Educação Especial", label: "Educação Especial" },
  { value: "Outros", label: "Outros" },
];

/** Helper para renderizar wrapper de campo com label */
const FieldWrapper = ({ label, children, required = true, error, id }) => (
  <div className="space-y-1.5 flex flex-col" id={id}>
    <Label className="text-sm font-medium text-foreground">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
    {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
  </div>
);

const Register = () => {
  const { platformName, logoUrl } = useBranding();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    birthDate: "",
    phone: "",
    address: "",
    neighborhood: "",
    professionName: "",
    workplaceIds: [],
    workShifts: [],
    contractType: "",
    teachingSegments: [],
    serie: "",
    subject: "",
    workload: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [workplaces, setWorkplaces] = useState([]);

  const [selectedWorkplaces, setSelectedWorkplaces] = useState([]);
  const [openWorkplacePopover, setOpenWorkplacePopover] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [openShiftPopover, setOpenShiftPopover] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [openSegmentPopover, setOpenSegmentPopover] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID não configurado. O botão do Google não será exibido.");
      return;
    }

    const handleGoogleResponse = async (response) => {
      setLoading(true);
      setErrors({});
      try {
        const result = await loginWithGoogle(response.credential);
        if (result.success) {
          if (result.isNewUser || result.user?.hasCompletedOnboarding === false) {
            navigate("/profile", { state: { fromGoogleLogin: true } });
          } else {
            navigate("/dashboard");
          }
        } else {
          setErrors({ form: result.error });
        }
      } catch (err) {
        setErrors({ form: "Ocorreu um erro ao registrar com o Google." });
      } finally {
        setLoading(false);
      }
    };

    const id = "google-jssdk";
    let script = document.getElementById(id);

    const initializeGoogle = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-btn"),
          {
            theme: "dark",
            size: "large",
            width: "350",
            text: "signup_with",
            shape: "pill",
          }
        );
      } catch (err) {
        console.error("Erro ao inicializar o Google Button no registro:", err);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else if (window.google) {
      initializeGoogle();
    }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await api.get("/workplaces?limit=500");
        setWorkplaces(response.data.workplaces || []);
      } catch (err) {
        console.error("Erro ao carregar localidades:", err);
      }
    };
    fetchWorkplaces();
  }, []);

  const handleChange = (e) => {
    let value = e.target.value;

    if (e.target.name === "cpf") {
      value = value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (e.target.name === "phone") {
      value = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleWorkplaceSelect = (workplace) => {
    if (!selectedWorkplaces.some((w) => w.id === workplace.id)) {
      const newSelection = [...selectedWorkplaces, workplace];
      setSelectedWorkplaces(newSelection);
      setFormData({ ...formData, workplaceIds: newSelection.map((w) => w.id) });
    }
    setOpenWorkplacePopover(false);
  };

  const handleWorkplaceRemove = (workplaceToRemove) => {
    const newSelection = selectedWorkplaces.filter(
      (w) => w.id !== workplaceToRemove.id
    );
    setSelectedWorkplaces(newSelection);
    setFormData({ ...formData, workplaceIds: newSelection.map((w) => w.id) });
  };

  const handleShiftSelect = (shift) => {
    if (!selectedShifts.some((s) => s.value === shift.value)) {
      const newSelection = [...selectedShifts, shift];
      setSelectedShifts(newSelection);
      setFormData({ ...formData, workShifts: newSelection.map((s) => s.value) });
    }
  };

  const handleShiftRemove = (shiftToRemove) => {
    const newSelection = selectedShifts.filter(
      (s) => s.value !== shiftToRemove.value
    );
    setSelectedShifts(newSelection);
    setFormData({ ...formData, workShifts: newSelection.map((s) => s.value) });
  };

  const handleSegmentSelect = (segment) => {
    if (!selectedSegments.some((s) => s.value === segment.value)) {
      const newSelection = [...selectedSegments, segment];
      setSelectedSegments(newSelection);
      setFormData({
        ...formData,
        teachingSegments: newSelection.map((s) => s.value),
      });
    }
  };

  const handleSegmentRemove = (segmentToRemove) => {
    const newSelection = selectedSegments.filter(
      (s) => s.value !== segmentToRemove.value
    );
    setSelectedSegments(newSelection);
    setFormData({
      ...formData,
      teachingSegments: newSelection.map((s) => s.value),
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nome completo é obrigatório";
    if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
    if (formData.password?.length < 6) newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "As senhas não coincidem";

    if (!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) newErrors.cpf = "CPF inválido (11 dígitos obrigatórios)";
    if (!formData.birthDate) newErrors.birthDate = "Data de Nascimento é obrigatória";
    if (!formData.phone) newErrors.phone = "Telefone é obrigatório";
    if (!formData.address) newErrors.address = "Endereço é obrigatório";
    if (!formData.neighborhood) newErrors.neighborhood = "Bairro é obrigatório";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);

      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.getElementById(`field-wrapper-${firstErrorKey}`) ||
        document.querySelector(`[name="${firstErrorKey}"]`) ||
        document.getElementById(firstErrorKey);

      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const submissionData = { ...formData };
    delete submissionData.confirmPassword;

    // Remover campos vazios da requisição para não falhar na validação opcional do backend
    Object.keys(submissionData).forEach(key => {
      if (submissionData[key] === "" || (Array.isArray(submissionData[key]) && submissionData[key].length === 0)) {
        delete submissionData[key];
      }
    });

    const result = await register(submissionData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setErrors({ form: result.error });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setLoading(false);
  };

  return (
    <div className="auth-container min-h-screen overflow-y-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <img
          src={logoUrl || LogoDefaultWhite}
          alt={platformName}
          className="mx-auto h-16 w-auto mb-4"
        />
        <h2 className="text-3xl font-extrabold text-foreground">
          {platformName}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie sua conta no {platformName} para acessar o sistema.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl rounded-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {errors.form && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              )}

              {/* SEÇÃO 1: DADOS PESSOAIS */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-primary">
                  <User className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                </div>
                <Separator className="mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldWrapper id="field-wrapper-name" error={errors.name} label="Nome Completo">
                    <Input
                      id="name"
                      name="name"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <FieldWrapper id="field-wrapper-birthDate" error={errors.birthDate} label="Data de Nascimento">
                    <DatePicker
                      value={formData.birthDate ? toZonedTime(formData.birthDate, "America/Sao_Paulo") : null}
                      onSelect={(date) => handleSelectChange("birthDate", date ? fromZonedTime(date, "America/Sao_Paulo") : "")}
                    />
                  </FieldWrapper>

                  <FieldWrapper id="field-wrapper-cpf" error={errors.cpf} label="CPF">
                    <Input
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleChange}
                      maxLength={14}
                    />
                  </FieldWrapper>

                  <FieldWrapper id="field-wrapper-phone" error={errors.phone} label="Telefone / WhatsApp">
                    <Input
                      name="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={15}
                    />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FieldWrapper id="field-wrapper-address" error={errors.address} label="Endereço (Rua e Nº)">
                    <Input
                      name="address"
                      placeholder="Rua Exemplo, 123"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <FieldWrapper id="field-wrapper-neighborhood" error={errors.neighborhood} label="Bairro">
                    <Input
                      name="neighborhood"
                      placeholder="Seu bairro"
                      value={formData.neighborhood}
                      onChange={handleChange}
                    />
                  </FieldWrapper>
                </div>
              </section>

              {/* SEÇÃO 2: DADOS DE ACESSO */}
              <section>
                <div className="flex items-center gap-2 mb-4 mt-8 text-primary">
                  <div className="h-5 w-5 flex items-center justify-center font-bold">@</div>
                  <h3 className="text-lg font-semibold">Dados de Acesso</h3>
                </div>
                <Separator className="mb-6" />

                <div className="space-y-6">
                  <FieldWrapper id="field-wrapper-email" error={errors.email} label="Email">
                    <Input
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper id="field-wrapper-password" error={errors.password} label="Senha">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Mínimo 6 caracteres"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FieldWrapper>

                    <FieldWrapper id="field-wrapper-confirmPassword" error={errors.confirmPassword} label="Confirmar Senha">
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirme sua senha"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FieldWrapper>
                  </div>
                </div>
              </section>


              <div className="pt-6">
                <Button type="submit" className="w-full text-lg h-12" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Finalizar Cadastro e Entrar"}
                </Button>
              </div>

            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com</span>
                  </div>
                </div>

                <div className="w-full flex justify-center">
                  <div id="google-signup-btn" className="w-full flex justify-center" style={{ minHeight: "40px" }} />
                </div>
              </>
            )}

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Já possui uma conta?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Fazer Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
