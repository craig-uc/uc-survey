"use client";

import { useEffect } from "react";
import {useGlobalState} from "@/app/context/GlobalStateContext";


export default function LangInitializer({ lang }: { lang: string }) {
  const { setLang } = useGlobalState();

  useEffect(() => {
    setLang(lang);
    document.documentElement.lang = lang;
  }, [lang, setLang]);

  return null;
}
