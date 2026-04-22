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

export function useViaCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = async (cep: string): Promise<ViaCepData | null> => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setError("CEP inválido.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepData = await response.json();

      if (data.erro) {
        setError("CEP não encontrado.");
        return null;
      }

      return data;
    } catch (err) {
      setError("Erro ao buscar CEP.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchAddress, loading, error };
}
