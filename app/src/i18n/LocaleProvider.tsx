"use client"

import { NextIntlClientProvider } from "next-intl"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import en from "./locales/en.json"
import ja from "./locales/ja.json"

export type AppLocale = "en" | "ja"

type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)
const messages = { en, ja }
const storageKey = "shiftly_locale"

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en")

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(storageKey)
    if (storedLocale !== "ja") return

    const timer = window.setTimeout(() => setLocaleState("ja"), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(storageKey, locale)
  }, [locale])

  const setLocale = (nextLocale: AppLocale) => setLocaleState(nextLocale)

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}

export function useLocalePreference() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error("useLocalePreference must be used within LocaleProvider")
  return context
}
