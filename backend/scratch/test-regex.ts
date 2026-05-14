
function testRegex(filename: string) {
  const idMatch = filename.match(/(\d{3,10})/);
  const extractedId = idMatch ? idMatch[1] : null;
  console.log(`Filename: ${filename} -> Extracted ID: ${extractedId}`);
}

const samples = [
  "12345.jpg",
  "ALUNO_12345.jpg",
  "BIB_500.png",
  "IMG_1234.jpg",
  "sem_numero.jpg",
  "12.jpg", // too short
  "123.jpg", // ok
  "1234567890.jpg", // ok
  "12345678901.jpg", // too long (takes 10)
  "aluno12345_678.jpg"
];

samples.forEach(testRegex);
