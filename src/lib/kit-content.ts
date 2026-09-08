import { categories, messages, type KitCategory, type KitMessage } from "@/content/kit-incassa";
import { categoriesEn, messagesEn } from "@/content/kit-incassa.en";
import type { Locale } from "@/lib/locale";

export function getKitCategories(locale: Locale): KitCategory[] {
  return locale === "en" ? categoriesEn : categories;
}

export function getKitMessages(locale: Locale): KitMessage[] {
  return locale === "en" ? messagesEn : messages;
}
