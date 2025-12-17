import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  studyLevel: string;
  field: string;
  language: string;
  interfaceLanguage: string;
  targetDate: string;
  thesisTitle: string;
  topic: string;
  researchQuestions: string[];
  objectives: string[];
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [data, setData] = useState<OnboardingData>({
    studyLevel: "",
    field: "",
    language: "english",
    interfaceLanguage: "english",
    targetDate: "",
    thesisTitle: "",
    topic: "",
    researchQuestions: [""],
    objectives: [""],
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/onboarding/complete", data);
    },
    onSuccess: () => {
      navigate("/dashboard");
      toast({ title: "Welcome!", description: "Your thesis has been set up successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete setup. Please try again.", variant: "destructive" });
    },
  });

  const addResearchQuestion = () => {
    setData({ ...data, researchQuestions: [...data.researchQuestions, ""] });
  };

  const updateResearchQuestion = (index: number, value: string) => {
    const updated = [...data.researchQuestions];
    updated[index] = value;
    setData({ ...data, researchQuestions: updated });
  };

  const addObjective = () => {
    setData({ ...data, objectives: [...data.objectives, ""] });
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...data.objectives];
    updated[index] = value;
    setData({ ...data, objectives: updated });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.interfaceLanguage;
      case 2:
        return data.studyLevel && data.field;
      case 3:
        return data.thesisTitle.trim().length > 0;
      case 4:
        return data.researchQuestions.some((q) => q.trim().length > 0);
      case 5:
        return data.objectives.some((o) => o.trim().length > 0);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const translations: Record<string, any> = {
    english: {
      selectLanguage: "Select Language",
      aboutYou: "Tell us about yourself",
      defineThesis: "Define your thesis",
      researchQuestions: "Research questions",
      objectives: "Set your objectives",
      descLanguage: "Choose your preferred interface language",
      descAbout: "Help us personalize your experience",
      descThesis: "What will your thesis be about?",
      descQuestions: "What questions will your research answer?",
      descObjectives: "What do you aim to achieve?",
      labelInterface: "Interface Language",
      labelLevel: "Study Level",
      labelDate: "Target Completion Date",
      labelField: "Field of Study",
      labelThesisLang: "Thesis Language",
      labelTitle: "Thesis Title",
      labelTopic: "Topic Description",
      placeholderLevel: "Select your level",
      placeholderField: "Select your field",
      placeholderLang: "Select language",
      placeholderTitle: "Enter your thesis title",
      placeholderTopic: "Briefly describe your thesis topic...",
      placeholderQ: "Enter a research question...",
      placeholderObj: "Enter an objective...",
      helperQ: "Add the main questions your research will address.",
      helperObj: "Define the objectives you aim to achieve with your thesis.",
      btnAddQ: "Add Another Question",
      btnAddObj: "Add Another Objective",
      btnBack: "Back",
      btnNext: "Continue",
      btnComplete: "Complete Setup",
      btnSettingUp: "Setting up...",
      step: "Step",
      of: "of",
      complete: "complete",
      // Options
      levelBachelor: "Bachelor's Degree",
      levelMaster: "Master's Degree",
      levelPhD: "PhD / Doctorate",
      fieldScience: "Natural Sciences",
      fieldEng: "Engineering",
      fieldMed: "Medicine & Health",
      fieldSocial: "Social Sciences",
      fieldHum: "Humanities",
      fieldBus: "Business & Economics",
      fieldArts: "Arts & Design",
      fieldEdu: "Education",
      fieldLaw: "Law",
      fieldOther: "Other",
    },
    french: {
      selectLanguage: "Choisir la langue",
      aboutYou: "Parlez-nous de vous",
      defineThesis: "Définissez votre thèse",
      researchQuestions: "Questions de recherche",
      objectives: "Objectifs",
      descLanguage: "Choisissez votre langue d'interface préférée",
      descAbout: "Aidez-nous à personnaliser votre expérience",
      descThesis: "De quoi parlera votre thèse ?",
      descQuestions: "Quelles questions votre recherche abordera-t-elle ?",
      descObjectives: "Que visez-vous à atteindre ?",
      labelInterface: "Langue de l'interface",
      labelLevel: "Niveau d'études",
      labelDate: "Date de fin prévue",
      labelField: "Domaine d'études",
      labelThesisLang: "Langue de la thèse",
      labelTitle: "Titre de la thèse",
      labelTopic: "Description du sujet",
      placeholderLevel: "Sélectionnez votre niveau",
      placeholderField: "Sélectionnez votre domaine",
      placeholderLang: "Sélectionnez la langue",
      placeholderTitle: "Entrez le titre de votre thèse",
      placeholderTopic: "Décrivez brièvement votre sujet...",
      placeholderQ: "Entrez une question de recherche...",
      placeholderObj: "Entrez un objectif...",
      helperQ: "Ajoutez les principales questions que votre recherche abordera.",
      helperObj: "Définissez les objectifs que vous visez.",
      btnAddQ: "Ajouter une autre question",
      btnAddObj: "Ajouter un autre objectif",
      btnBack: "Retour",
      btnNext: "Continuer",
      btnComplete: "Terminer la configuration",
      btnSettingUp: "Configuration en cours...",
      step: "Étape",
      of: "sur",
      complete: "complété",
      // Options
      levelBachelor: "Licence",
      levelMaster: "Master",
      levelPhD: "Doctorat / PhD",
      fieldScience: "Sciences Naturelles",
      fieldEng: "Ingénierie",
      fieldMed: "Médecine et Santé",
      fieldSocial: "Sciences Sociales",
      fieldHum: "Sciences Humaines",
      fieldBus: "Commerce et Économie",
      fieldArts: "Arts et Design",
      fieldEdu: "Éducation",
      fieldLaw: "Droit",
      fieldOther: "Autre",
    },
    arabic: {
      selectLanguage: "اختر اللغة",
      aboutYou: "أخبرنا عن نفسك",
      defineThesis: "حدد أطروحتك",
      researchQuestions: "أسئلة البحث",
      objectives: "الأهداف",
      descLanguage: "اختر لغة الواجهة المفضلة لديك",
      descAbout: "ساعدنا في تخصيص تجربتك",
      descThesis: "حول ماذا ستكون أطروحتك؟",
      descQuestions: "ما الأسئلة التي سيتناولها بحثك؟",
      descObjectives: "ما الذي تهدف إلى تحقيقه؟",
      labelInterface: "لغة الواجهة",
      labelLevel: "مستوى الدراسة",
      labelDate: "تاريخ الانتهاء المستهدف",
      labelField: "مجال الدراسة",
      labelThesisLang: "لغة الأطروحة",
      labelTitle: "عنوان الأطروحة",
      labelTopic: "وصف الموضوع",
      placeholderLevel: "اختر مستواك",
      placeholderField: "اختر مجالك",
      placeholderLang: "اختر اللغة",
      placeholderTitle: "أدخل عنوان أطروحتك",
      placeholderTopic: "صف موضوع أطروحتك باختصار...",
      placeholderQ: "أدخل سؤال بحث...",
      placeholderObj: "أدخل هدفاً...",
      helperQ: "أضف الأسئلة الرئيسية التي سيتناولها بحثك.",
      helperObj: "حدد الأهداف التي تهدف إلى تحقيقها.",
      btnAddQ: "إضافة سؤال آخر",
      btnAddObj: "إضافة هدف آخر",
      btnBack: "رجوع",
      btnNext: "متابعة",
      btnComplete: "إتمام الإعداد",
      btnSettingUp: "جارٍ الإعداد...",
      step: "خطوة",
      of: "من",
      complete: "مكتمل",
      // Options
      levelBachelor: "بكالوريوس",
      levelMaster: "ماجستير",
      levelPhD: "دكتوراه",
      fieldScience: "العلوم الطبيعية",
      fieldEng: "الهندسة",
      fieldMed: "الطب والصحة",
      fieldSocial: "العلوم الاجتماعية",
      fieldHum: "العلوم الإنسانية",
      fieldBus: "الأعمال والاقتصاد",
      fieldArts: "الفنون والتصميم",
      fieldEdu: "التعليم",
      fieldLaw: "القانون",
      fieldOther: "أخرى",
    },
    spanish: {
      selectLanguage: "Seleccionar idioma",
      aboutYou: "Cuéntanos sobre ti",
      defineThesis: "Define tu tesis",
      researchQuestions: "Preguntas de investigación",
      objectives: "Objetivos",
      descLanguage: "Elige tu idioma de interfaz preferido",
      descAbout: "Ayúdanos a personalizar tu experiencia",
      descThesis: "¿De qué tratará tu tesis?",
      descQuestions: "¿Qué preguntas abordará tu investigación?",
      descObjectives: "¿Qué pretendes lograr?",
      labelInterface: "Idioma de la interfaz",
      labelLevel: "Nivel de estudio",
      labelDate: "Fecha de finalización prevista",
      labelField: "Campo de estudio",
      labelThesisLang: "Idioma de la tesis",
      labelTitle: "Título de la tesis",
      labelTopic: "Descripción del tema",
      placeholderLevel: "Selecciona tu nivel",
      placeholderField: "Selecciona tu campo",
      placeholderLang: "Selecciona el idioma",
      placeholderTitle: "Ingresa el título de tu tesis",
      placeholderTopic: "Describe brevemente tu tema...",
      placeholderQ: "Ingresa una pregunta de investigación...",
      placeholderObj: "Ingresa un objetivo...",
      helperQ: "Agrega las preguntas principales que abordará tu investigación.",
      helperObj: "Define los objetivos que pretendes lograr.",
      btnAddQ: "Agregar otra pregunta",
      btnAddObj: "Agregar otro objetivo",
      btnBack: "Atrás",
      btnNext: "Continuar",
      btnComplete: "Completar configuración",
      btnSettingUp: "Configurando...",
      step: "Paso",
      of: "de",
      complete: "completado",
      levelBachelor: "Licenciatura",
      levelMaster: "Maestría",
      levelPhD: "Doctorado",
      fieldScience: "Ciencias Naturales",
      fieldEng: "Ingeniería",
      fieldMed: "Medicina y Salud",
      fieldSocial: "Ciencias Sociales",
      fieldHum: "Humanidades",
      fieldBus: "Negocios y Economía",
      fieldArts: "Artes y Diseño",
      fieldEdu: "Educación",
      fieldLaw: "Derecho",
      fieldOther: "Otro",
    },
    chinese: {
      selectLanguage: "选择语言",
      aboutYou: "关于你自己",
      defineThesis: "定义你的论文",
      researchQuestions: "研究问题",
      objectives: "设定目标",
      descLanguage: "选择你的界面语言",
      descAbout: "帮助我们个性化你的体验",
      descThesis: "你的论文是关于什么的？",
      descQuestions: "你的研究将解决什么问题？",
      descObjectives: "你希望通过论文实现什么？",
      labelInterface: "界面语言",
      labelLevel: "学位",
      labelDate: "预计完成日期",
      labelField: "研究领域",
      labelThesisLang: "论文语言",
      labelTitle: "论文题目",
      labelTopic: "题目描述",
      placeholderLevel: "选择你的学位",
      placeholderField: "选择你的领域",
      placeholderLang: "选择语言",
      placeholderTitle: "输入你的论文题目",
      placeholderTopic: "简要描述你的论文题目...",
      placeholderQ: "输入一个研究问题...",
      placeholderObj: "输入一个目标...",
      helperQ: "添加你的研究将解决的主要问题。",
      helperObj: "定义你希望通过论文实现的目标。",
      btnAddQ: "添加另一个问题",
      btnAddObj: "添加另一个目标",
      btnBack: "返回",
      btnNext: "继续",
      btnComplete: "完成设置",
      btnSettingUp: "设置中...",
      step: "步骤",
      of: "共",
      complete: "完成",
      levelBachelor: "学士学位",
      levelMaster: "硕士学位",
      levelPhD: "博士学位",
      fieldScience: "自然科学",
      fieldEng: "工程学",
      fieldMed: "医学与健康",
      fieldSocial: "社会科学",
      fieldHum: "人文科学",
      fieldBus: "商业与经济",
      fieldArts: "艺术与设计",
      fieldEdu: "教育学",
      fieldLaw: "法学",
      fieldOther: "其他",
    }
  };

  const t = translations[data.interfaceLanguage] || translations.english;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-semibold">Thesard by Amal Mouaki</span>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t.step} {step} {t.of} {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% {t.complete}</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && t.selectLanguage}
              {step === 2 && t.aboutYou}
              {step === 3 && t.defineThesis}
              {step === 4 && t.researchQuestions}
              {step === 5 && t.objectives}
            </CardTitle>
            <CardDescription>
              {step === 1 && t.descLanguage}
              {step === 2 && t.descAbout}
              {step === 3 && t.descThesis}
              {step === 4 && t.descQuestions}
              {step === 5 && t.descObjectives}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="interfaceLanguage">Interface Language</Label>
                <Select
                  value={data.interfaceLanguage}
                  onValueChange={(value) => {
                    setData({ ...data, interfaceLanguage: value });
                    // Instant transition to next step
                    setTimeout(() => setStep(2), 300);
                  }}
                >
                  <SelectTrigger data-testid="select-interface-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="french">Français (French)</SelectItem>
                    <SelectItem value="arabic">العربية (Arabic)</SelectItem>
                    <SelectItem value="spanish">Español (Spanish)</SelectItem>
                    <SelectItem value="chinese">中文 (Chinese)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studyLevel">Study Level</Label>
                  <Select
                    value={data.studyLevel}
                    onValueChange={(value) => setData({ ...data, studyLevel: value })}
                  >
                    <SelectTrigger data-testid="select-study-level">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD / Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Completion Date</Label>
                  <Input
                    type="date"
                    id="targetDate"
                    value={data.targetDate}
                    onChange={(e) => setData({ ...data, targetDate: e.target.value })}
                    data-testid="input-target-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Select
                    value={data.field}
                    onValueChange={(value) => setData({ ...data, field: value })}
                  >
                    <SelectTrigger data-testid="select-field">
                      <SelectValue placeholder="Select your field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sciences">Natural Sciences</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="medicine">Medicine & Health</SelectItem>
                      <SelectItem value="social">Social Sciences</SelectItem>
                      <SelectItem value="humanities">Humanities</SelectItem>
                      <SelectItem value="business">Business & Economics</SelectItem>
                      <SelectItem value="arts">Arts & Design</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="law">Law</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Thesis Language</Label>
                  <Select
                    value={data.language}
                    onValueChange={(value) => setData({ ...data, language: value })}
                  >
                    <SelectTrigger data-testid="select-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="portuguese">Portuguese</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="thesisTitle">Thesis Title</Label>
                  <Input
                    id="thesisTitle"
                    placeholder="Enter your thesis title"
                    value={data.thesisTitle}
                    onChange={(e) => setData({ ...data, thesisTitle: e.target.value })}
                    data-testid="input-thesis-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic Description</Label>
                  <Textarea
                    id="topic"
                    placeholder="Briefly describe your thesis topic..."
                    value={data.topic}
                    onChange={(e) => setData({ ...data, topic: e.target.value })}
                    rows={4}
                    data-testid="textarea-topic"
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add the main questions your research will address.
                </p>
                {data.researchQuestions.map((question, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-muted-foreground mt-2 text-sm">{index + 1}.</span>
                    <Textarea
                      placeholder="Enter a research question..."
                      value={question}
                      onChange={(e) => updateResearchQuestion(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid={`textarea-research-question-${index}`}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addResearchQuestion}
                  className="w-full"
                  data-testid="button-add-question"
                >
                  Add Another Question
                </Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define the objectives you aim to achieve with your thesis.
                </p>
                {data.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <CheckCircle className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                    <Textarea
                      placeholder="Enter an objective..."
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid={`textarea-objective-${index}`}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addObjective}
                  className="w-full"
                  data-testid="button-add-objective"
                >
                  Add Another Objective
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || completeMutation.isPending}
            data-testid="button-next"
          >
            {completeMutation.isPending ? "Setting up..." : step === totalSteps ? "Complete Setup" : "Continue"}
            {!completeMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
