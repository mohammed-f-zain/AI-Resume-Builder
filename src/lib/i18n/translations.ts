import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // Nav
    home: "Home",
    builder: "Resume Builder",
    analyzer: "ATS Analyzer",
    coverLetter: "Cover Letter",
    language: "Language",

    // Landing
    heroTitle: "Build Your Perfect Resume with AI",
    heroSubtitle:
      "Part of Bahath Jobz — create ATS-optimized resumes, analyze your CV score, and write cover letters in English or Arabic.",
    getStarted: "Get Started",
    tryAnalyzer: "Check ATS Score",
    featureBuilderTitle: "AI Resume Builder",
    featureBuilderDesc:
      "Answer smart AI questions and let us craft a professional, ATS-friendly resume from multiple templates.",
    featureAnalyzerTitle: "ATS Resume Analyzer",
    featureAnalyzerDesc:
      "Upload your PDF or Word resume and get an ATS score with actionable improvement suggestions.",
    featureCoverTitle: "Cover Letter Writer",
    featureCoverDesc:
      "Generate tailored cover letters matched to any job description with enhancement tips.",
    startBuilding: "Start Building",
    analyzeNow: "Analyze Now",
    writeCover: "Write Cover Letter",

    // Builder
    builderTitle: "AI Resume Builder",
    builderSubtitle: "Tell us about yourself — AI will ask smart questions and write your ATS-optimized resume.",
    stepBasics: "Your Info",
    stepInterview: "AI Interview",
    stepTemplate: "Template",
    stepPreview: "Preview",
    careerBackground: "Career Background",
    careerBackgroundPlaceholder:
      "Briefly describe your work history, education, and goals — even in rough notes. AI will refine this.",
    getAIQuestions: "Continue — Get AI Questions",
    loadingQuestions: "Preparing your questions...",
    aiInterviewTitle: "AI Career Interview",
    aiInterviewSubtitle:
      "Answer these personalized questions so AI can write strong, achievement-focused resume content for you.",
    nextStep: "Next",
    previousStep: "Back",
    answerPlaceholder: "Type your answer here...",
    interviewProgress: "Answer at least {min} of {total} questions to continue",
    personalInfo: "Personal Information",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    location: "Location",
    linkedin: "LinkedIn URL",
    github: "GitHub URL (optional)",
    website: "Website (optional)",
    targetRole: "Target Role / Job Title",
    professionalSummary: "Professional Summary (optional)",
    workExperience: "Work Experience",
    experiencePlaceholder:
      "Describe your work history: job titles, companies, dates, and achievements...",
    education: "Education",
    educationPlaceholder: "Degrees, institutions, graduation dates...",
    skills: "Skills",
    skillsPlaceholder: "List your technical and soft skills...",
    certifications: "Certifications & Courses (optional)",
    languages: "Languages (optional)",
    additionalInfo: "Additional Information (optional)",
    chooseTemplate: "Choose Template",
    generateResume: "Generate Resume with AI",
    generating: "Generating...",
    preview: "Preview",
    downloadHint: "Use browser print (Ctrl/Cmd+P) to save as PDF",
    regenerate: "Regenerate",
    changeTemplate: "Change Template Design",
    dataAutoSaved: "Your progress is saved automatically",
    myResumes: "My Resumes",
    startNewResume: "New Resume",
    startNewTitle: "Start a new resume?",
    startNewDesc: "You can save your current work and start fresh, or discard it.",
    saveAndStartNew: "Save & start new",
    discardAndStartNew: "Discard & start new",
    cancel: "Cancel",
    deleteDraft: "Delete",
    deleteDraftConfirm: "Delete this saved resume?",
    noSavedResumes: "No other saved resumes",
    switchResume: "Switch resume",

    // Templates
    templateClassic: "Classic",
    templateModern: "Modern",
    templateMinimal: "Minimal",
    templateExecutive: "Executive",
    templateCreative: "Creative",

    // Analyzer
    analyzerTitle: "ATS Resume Analyzer",
    analyzerSubtitle: "Upload your resume (PDF or Word) to get an ATS compatibility score and suggestions.",
    uploadResume: "Upload Resume",
    dragDrop: "Drag & drop your resume here, or click to browse",
    supportedFormats: "Supported: PDF, DOCX",
    analyzing: "Analyzing...",
    analyzeResume: "Analyze Resume",
    atsScore: "ATS Score",
    scoreBreakdown: "Score Breakdown",
    formatting: "Formatting",
    keywords: "Keywords",
    structure: "Structure",
    content: "Content",
    readability: "Readability",
    suggestions: "Improvement Suggestions",
    strengths: "Strengths",
    extractedPreview: "Extracted Text Preview",

    // Cover Letter
    coverTitle: "AI Cover Letter Generator",
    coverSubtitle: "Paste the job details and your CV to get a tailored cover letter.",
    position: "Position / Job Title",
    jobDescription: "Job Description",
    jobDescriptionPlaceholder: "Paste the full job description here...",
    yourCV: "Upload Your CV / Resume",
    cvPlaceholder: "Upload your resume as PDF or Word (.docx)",
    uploadCV: "Upload CV",
    cvUploaded: "CV uploaded successfully",
    generateCover: "Generate Cover Letter",
    coverLetterResult: "Your Cover Letter",
    enhancements: "Enhancement Suggestions",
    copyToClipboard: "Copy to Clipboard",
    copied: "Copied!",

    // Common
    error: "Something went wrong. Please try again.",
    required: "Required",
    optional: "Optional",
    back: "Back",
    print: "Print / Save PDF",
  },
  ar: {
    // Nav
    home: "الرئيسية",
    builder: "منشئ السيرة",
    analyzer: "محلل ATS",
    coverLetter: "خطاب التقديم",
    language: "اللغة",

    // Landing
    heroTitle: "أنشئ سيرتك الذاتية المثالية بالذكاء الاصطناعي",
    heroSubtitle:
      "جزء من بهاث جوبز — أنشئ سيراً متوافقة مع ATS، حلّل درجة سيرتك، واكتب خطابات تقديم بالعربية أو الإنجليزية.",
    getStarted: "ابدأ الآن",
    tryAnalyzer: "تحقق من درجة ATS",
    featureBuilderTitle: "منشئ السيرة بالذكاء الاصطناعي",
    featureBuilderDesc:
      "أجب على أسئلة ذكية من الذكاء الاصطناعي ودعنا نصنع سيرة احترافية متوافقة مع ATS من قوالب متعددة.",
    featureAnalyzerTitle: "محلل السيرة ATS",
    featureAnalyzerDesc:
      "ارفع سيرتك بصيغة PDF أو Word واحصل على درجة ATS مع اقتراحات تحسين عملية.",
    featureCoverTitle: "كاتب خطاب التقديم",
    featureCoverDesc:
      "أنشئ خطابات تقديم مخصصة لأي وصف وظيفة مع نصائح للتحسين.",
    startBuilding: "ابدأ الإنشاء",
    analyzeNow: "حلّل الآن",
    writeCover: "اكتب خطاب التقديم",

    // Builder
    builderTitle: "منشئ السيرة بالذكاء الاصطناعي",
    builderSubtitle: "أخبرنا عن نفسك — سيطرح الذكاء الاصطناعي أسئلة ذكية ويكتب سيرتك المتوافقة مع ATS.",
    stepBasics: "معلوماتك",
    stepInterview: "مقابلة AI",
    stepTemplate: "القالب",
    stepPreview: "معاينة",
    careerBackground: "الخلفية المهنية",
    careerBackgroundPlaceholder:
      "صف بإيجاز تاريخ عملك وتعليمك وأهدافك — حتى لو بملاحظات عشوائية. الذكاء الاصطناعي سيحسّنها.",
    getAIQuestions: "متابعة — احصل على أسئلة AI",
    loadingQuestions: "جاري تحضير أسئلتك...",
    aiInterviewTitle: "مقابلة مهنية بالذكاء الاصطناعي",
    aiInterviewSubtitle:
      "أجب على هذه الأسئلة المخصصة ليكتب الذكاء الاصطناعي محتوى سيرة قوياً يركز على الإنجازات.",
    nextStep: "التالي",
    previousStep: "رجوع",
    answerPlaceholder: "اكتب إجابتك هنا...",
    interviewProgress: "أجب على {min} من {total} أسئلة على الأقل للمتابعة",
    personalInfo: "المعلومات الشخصية",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    location: "الموقع",
    linkedin: "رابط LinkedIn",
    github: "رابط GitHub (اختياري)",
    website: "الموقع الإلكتروني (اختياري)",
    targetRole: "الوظيفة المستهدفة",
    professionalSummary: "الملخص المهني (اختياري)",
    workExperience: "الخبرة العملية",
    experiencePlaceholder:
      "صف تاريخ عملك: المسميات الوظيفية، الشركات، التواريخ، والإنجازات...",
    education: "التعليم",
    educationPlaceholder: "الشهادات، المؤسسات التعليمية، تواريخ التخرج...",
    skills: "المهارات",
    skillsPlaceholder: "اذكر مهاراتك التقنية والشخصية...",
    certifications: "الشهادات والدورات (اختياري)",
    languages: "اللغات (اختياري)",
    additionalInfo: "معلومات إضافية (اختياري)",
    chooseTemplate: "اختر القالب",
    generateResume: "إنشاء السيرة بالذكاء الاصطناعي",
    generating: "جاري الإنشاء...",
    preview: "معاينة",
    downloadHint: "استخدم طباعة المتصفح (Ctrl/Cmd+P) لحفظ PDF",
    regenerate: "إعادة الإنشاء",
    changeTemplate: "تغيير تصميم القالب",
    dataAutoSaved: "يتم حفظ تقدمك تلقائياً",
    myResumes: "سيري المحفوظة",
    startNewResume: "سيرة جديدة",
    startNewTitle: "بدء سيرة جديدة؟",
    startNewDesc: "يمكنك حفظ عملك الحالي والبدء من جديد، أو تجاهله.",
    saveAndStartNew: "حفظ وبدء جديد",
    discardAndStartNew: "تجاهل وبدء جديد",
    cancel: "إلغاء",
    deleteDraft: "حذف",
    deleteDraftConfirm: "حذف هذه السيرة المحفوظة؟",
    noSavedResumes: "لا توجد سير محفوظة أخرى",
    switchResume: "التبديل بين السير",

    // Templates
    templateClassic: "كلاسيكي",
    templateModern: "عصري",
    templateMinimal: "بسيط",
    templateExecutive: "تنفيذي",
    templateCreative: "إبداعي",

    // Analyzer
    analyzerTitle: "محلل السيرة ATS",
    analyzerSubtitle: "ارفع سيرتك (PDF أو Word) للحصول على درجة توافق ATS واقتراحات.",
    uploadResume: "رفع السيرة الذاتية",
    dragDrop: "اسحب وأفلت سيرتك هنا، أو انقر للتصفح",
    supportedFormats: "المدعوم: PDF, DOCX",
    analyzing: "جاري التحليل...",
    analyzeResume: "تحليل السيرة",
    atsScore: "درجة ATS",
    scoreBreakdown: "تفصيل الدرجة",
    formatting: "التنسيق",
    keywords: "الكلمات المفتاحية",
    structure: "الهيكل",
    content: "المحتوى",
    readability: "القابلية للقراءة",
    suggestions: "اقتراحات التحسين",
    strengths: "نقاط القوة",
    extractedPreview: "معاينة النص المستخرج",

    // Cover Letter
    coverTitle: "مولّد خطاب التقديم بالذكاء الاصطناعي",
    coverSubtitle: "الصق تفاصيل الوظيفة وسيرتك للحصول على خطاب تقديم مخصص.",
    position: "المسمى الوظيفي",
    jobDescription: "وصف الوظيفة",
    jobDescriptionPlaceholder: "الصق وصف الوظيفة الكامل هنا...",
    yourCV: "ارفع سيرتك الذاتية",
    cvPlaceholder: "ارفع سيرتك بصيغة PDF أو Word (.docx)",
    uploadCV: "رفع السيرة",
    cvUploaded: "تم رفع السيرة بنجاح",
    generateCover: "إنشاء خطاب التقديم",
    coverLetterResult: "خطاب التقديم",
    enhancements: "اقتراحات التحسين",
    copyToClipboard: "نسخ إلى الحافظة",
    copied: "تم النسخ!",

    // Common
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    required: "مطلوب",
    optional: "اختياري",
    back: "رجوع",
    print: "طباعة / حفظ PDF",
  },
} as const;

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
