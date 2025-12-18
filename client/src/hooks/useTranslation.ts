import { useQuery } from "@tanstack/react-query";
import { translations, type Language, type TranslationKey } from "@/lib/translations";
import type { User } from "@shared/schema";

export function useTranslation() {
    const { data: user } = useQuery<User>({
        queryKey: ["/api/auth/user"],
    });

    const language = (user?.interfaceLanguage || "english") as Language;
    const t = translations[language] || translations.english;

    return { t, language };
}
