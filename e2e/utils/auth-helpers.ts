/**
 * E2E Auth Helpers for Foto Segundo
 */

export const REAL_TEST_EMAILS = [
  'contatofotosegundo@gmail.com',
  'entrelenteselugares@gmail.com',
  'info@tlmmakers.com',
  'matheuskurio@gmail.com',
  'moraesrenata.br@gmail.com',
  'recomendonacidade@gmail.com',
  'tlmagenciadigital@gmail.com'
];

export const DEFAULT_TEST_PASSWORD = '123456';

export const generateTestEmail = (index: number = 0) => {
  const baseEmail = REAL_TEST_EMAILS[index % REAL_TEST_EMAILS.length];
  const [user, domain] = baseEmail.split('@');
  return `${user}+test_${Date.now()}@${domain}`;
};

/**
 * Common user data for professional registration
 */
export const getProfessionalMockData = () => {
  const email = generateTestEmail();
  return {
    nome: `Test Professional ${Date.now()}`,
    email,
    whatsapp: '(11) 99999-9999',
    senha: DEFAULT_TEST_PASSWORD,
  };
};
