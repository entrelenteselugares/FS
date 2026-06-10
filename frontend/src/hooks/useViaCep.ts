import { useState } from "react";

interface ViaCepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export async function fetchCepData(cep: string): Promise<ViaCepData | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data: ViaCepData = await response.json();

    if (data.erro || !data.localidade) {
      // Fallback para AwesomeAPI
      const fallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
      if (fallback.ok) {
        const fData = await fallback.json();
        return {
          cep: fData.cep || cleanCep,
          logradouro: fData.address || "",
          bairro: fData.district || "",
          localidade: fData.city || "",
          uf: fData.state || "",
          complemento: "",
          ibge: fData.city_ibge || "",
          gia: "",
          ddd: fData.ddd || "",
          siafi: "",
        } as ViaCepData;
      }
      return null;
    }

    return data;
  } catch {
    try {
      const fallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
      if (fallback.ok) {
        const fData = await fallback.json();
        return {
          cep: fData.cep || cleanCep,
          logradouro: fData.address || "",
          bairro: fData.district || "",
          localidade: fData.city || "",
          uf: fData.state || "",
          complemento: "",
          ibge: fData.city_ibge || "",
          gia: "",
          ddd: fData.ddd || "",
          siafi: "",
        } as ViaCepData;
      }
    } catch (e2) {
      // ignora
    }
    return null;
  }
}

export function useViaCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = async (cep: string): Promise<ViaCepData | null> => {
    setLoading(true);
    setError(null);

    const data = await fetchCepData(cep);
    if (!data) {
      setError("CEP não encontrado.");
    }
    
    setLoading(false);
    return data;
  };

  return { fetchAddress, loading, error };
}
