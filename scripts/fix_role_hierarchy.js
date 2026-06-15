const fs = require('fs');

const filesToFix = [
  'c:/foto-segundo/frontend/src/pages/VaultsPage.tsx',
  'c:/foto-segundo/frontend/src/pages/franchise/FranchiseDashboard.tsx',
  'c:/foto-segundo/frontend/src/pages/ClienteArea.tsx'
];

filesToFix.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  content = content.replace(
    /const isProOrFranchise = \(user\?\.role === "PROFISSIONAL" \|\| user\?\.role === "FRANCHISEE" \|\| !!user\?\.franchiseProfile\) && user\?\.role !== "UNIDADE" && user\?\.role !== "CARTORIO";/g,
    'const isProOrFranchise = (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE");'
  );

  content = content.replace(
    /const isVerified = \(user\?\.verificationStatus === "APPROVED" \|\| user\?\.isVerified \|\| !!user\?\.franchiseProfile\) && user\?\.role !== "UNIDADE" && user\?\.role !== "CARTORIO";/g,
    'const isVerified = (user?.verificationStatus === "APPROVED" || user?.isVerified || !!user?.franchiseProfile);'
  );

  // In ClienteArea.tsx, isVerified doesn't have `user?.isVerified ||`, it is `(user?.verificationStatus === "APPROVED" || !!user?.franchiseProfile)`
  content = content.replace(
    /const isVerified = \(user\?\.verificationStatus === "APPROVED" \|\| !!user\?\.franchiseProfile\) && user\?\.role !== "UNIDADE" && user\?\.role !== "CARTORIO";/g,
    'const isVerified = (user?.verificationStatus === "APPROVED" || !!user?.franchiseProfile);'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
});
