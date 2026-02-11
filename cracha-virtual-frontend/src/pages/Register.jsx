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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workplaces, setWorkplaces] = useState([]);

  const [selectedWorkplaces, setSelectedWorkplaces] = useState([]);
  const [openWorkplacePopover, setOpenWorkplacePopover] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [openShiftPopover, setOpenShiftPopover] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [openSegmentPopover, setOpenSegmentPopover] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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
    if (!formData.name.trim()) return "Nome completo é obrigatório";
    if (!formData.email.trim()) return "Email é obrigatório";
    if (formData.password.length < 6) return "A senha deve ter pelo menos 6 caracteres";
    if (formData.password !== formData.confirmPassword) return "As senhas não coincidem";

    // Validando campos que agora são obrigatórios
    if (!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) return "CPF inválido (11 dígitos obrigatórios)";
    if (!formData.birthDate) return "Data de Nascimento é obrigatória";
    if (!formData.phone) return "Telefone é obrigatório";
    if (!formData.address) return "Endereço é obrigatório";
    if (!formData.neighborhood) return "Bairro é obrigatório";
    if (!formData.professionName) return "Profissão é obrigatória";

    // Validando campos de seleção múltipla/única
    if (!formData.contractType) return "Tipo de vínculo é obrigatório";
    if (formData.workShifts.length === 0) return "Selecione pelo menos um turno de trabalho";
    if (formData.teachingSegments.length === 0) return "Selecione pelo menos um segmento de ensino";
    // Unidade educacional não era estritamente obrigatória no backend original, mas vamos pedir
    if (formData.workplaceIds.length === 0) return "Selecione pelo menos uma unidade educacional";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      // Rola para o topo para ver o erro
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const submissionData = { ...formData };
    delete submissionData.confirmPassword;

    const result = await register(submissionData);

    if (result.success) {
      // Auto-login successful in hook, navigate directly
      navigate("/dashboard");
    } else {
      setError(result.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setLoading(false);
  };

  /** Helper para renderizar wrapper de campo com label */
  const FieldWrapper = ({ label, children, required = true }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <img
          src={logoUrl || LogoDefault}
          alt={platformName}
          className="mx-auto h-16 w-auto mb-4"
        />
        <h2 className="text-3xl font-extrabold text-gray-900">
          {platformName}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Crie sua conta no {platformName} para acessar o sistema.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <Card className="bg-white shadow-xl rounded-lg border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                  <FieldWrapper label="Nome Completo">
                    <Input
                      id="name"
                      name="name"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Data de Nascimento">
                    <DatePicker
                      value={formData.birthDate ? toZonedTime(formData.birthDate, "UTC") : null}
                      onSelect={(date) => handleSelectChange("birthDate", date ? fromZonedTime(date, "UTC") : "")}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="CPF">
                    <Input
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleChange}
                      maxLength={14}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Telefone / WhatsApp">
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
                  <FieldWrapper label="Endereço (Rua e Nº)">
                    <Input
                      name="address"
                      placeholder="Rua Exemplo, 123"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Bairro">
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
                  <FieldWrapper label="Email">
                    <Input
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper label="Senha">
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

                    <FieldWrapper label="Confirmar Senha">
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


              {/* SEÇÃO 3: DADOS PROFISSIONAIS */}
              <section>
                <div className="flex items-center gap-2 mb-4 mt-8 text-primary">
                  <Briefcase className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Dados Profissionais</h3>
                </div>
                <Separator className="mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldWrapper label="Profissão / Cargo">
                    <Input
                      name="professionName"
                      placeholder="Ex: Professor, Coordenador"
                      value={formData.professionName}
                      onChange={handleChange}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Vínculo Empregatício">
                    <Select
                      value={formData.contractType}
                      onValueChange={(value) => handleSelectChange("contractType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EFETIVO">Efetivo</SelectItem>
                        <SelectItem value="PRESTADOR">Prestador</SelectItem>
                        <SelectItem value="ESTUDANTE">Estudante</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FieldWrapper label="Turno(s) de Trabalho" required>
                    <Popover open={openShiftPopover} onOpenChange={setOpenShiftPopover}>
                      <PopoverTrigger asChild>
                        <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
                          <div className="flex flex-wrap gap-1">
                            {selectedShifts.length > 0 ? (
                              selectedShifts.map((shift) => (
                                <Badge key={shift.value} variant="secondary" className="mr-1">
                                  {shift.label}
                                  <span onClick={(e) => { e.stopPropagation(); handleShiftRemove(shift); }} className="ml-1 cursor-pointer hover:text-red-500"><X className="h-3 w-3" /></span>
                                </Badge>
                              ))
                            ) : <span className="text-muted-foreground">Selecione...</span>}
                          </div>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {workShiftOptions.map((opt) => (
                                <CommandItem key={opt.value} onSelect={() => handleShiftSelect(opt)}>
                                  {opt.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FieldWrapper>

                  <FieldWrapper label="Segmento(s) de Atuação" required>
                    <Popover open={openSegmentPopover} onOpenChange={setOpenSegmentPopover}>
                      <PopoverTrigger asChild>
                        <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
                          <div className="flex flex-wrap gap-1">
                            {selectedSegments.length > 0 ? (
                              selectedSegments.map((seg) => (
                                <Badge key={seg.value} variant="secondary" className="mr-1">
                                  {seg.label}
                                  <span onClick={(e) => { e.stopPropagation(); handleSegmentRemove(seg); }} className="ml-1 cursor-pointer hover:text-red-500"><X className="h-3 w-3" /></span>
                                </Badge>
                              ))
                            ) : <span className="text-muted-foreground">Selecione...</span>}
                          </div>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {teachingSegmentOptions.map((opt) => (
                                <CommandItem key={opt.value} onSelect={() => handleSegmentSelect(opt)}>
                                  {opt.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FieldWrapper>
                </div>

                <div className="mt-6">
                  <FieldWrapper label="Unidade(s) Educacional(is)" required>
                    <Popover open={openWorkplacePopover} onOpenChange={setOpenWorkplacePopover}>
                      <PopoverTrigger asChild>
                        <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
                          <div className="flex flex-wrap gap-1">
                            {selectedWorkplaces.length > 0 ? (
                              selectedWorkplaces.map((w) => (
                                <Badge key={w.id} variant="secondary" className="mr-1">
                                  {w.name}
                                  <span onClick={(e) => { e.stopPropagation(); handleWorkplaceRemove(w); }} className="ml-1 cursor-pointer hover:text-red-500"><X className="h-3 w-3" /></span>
                                </Badge>
                              ))
                            ) : <span className="text-muted-foreground">Pesquisar unidade...</span>}
                          </div>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar unidade..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                            <CommandGroup>
                              {workplaces.filter(w => !selectedWorkplaces.some(s => s.id === w.id)).map((w) => (
                                <CommandItem key={w.id} onSelect={() => handleWorkplaceSelect(w)}>
                                  {w.name} - {w.city}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FieldWrapper>
                </div>
              </section>

              <div className="pt-6">
                <Button type="submit" className="w-full text-lg h-12" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Finalizar Cadastro e Entrar"}
                </Button>
              </div>

            </form>

            <div className="mt-8 text-center border-t pt-6">
              <p className="text-sm text-gray-600">
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
