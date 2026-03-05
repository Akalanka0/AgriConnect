const fs = require('fs');

const files = [
  'src/features/admin/components/UserDetailsDrawer.jsx',
  'src/features/admin/components/DataTable.jsx',
  'src/features/admin/components/AdminMessageCenter.jsx',
  'src/features/admin/components/AdminMessageCenterUn.jsx',
  'src/features/admin/pages/AdminHome.jsx',
  'src/features/admin/pages/Engagement.jsx',
  'src/features/admin/pages/Reports.jsx',
  'src/features/admin/pages/Settings.jsx',
  'src/features/admin/pages/UserIdManagement.jsx',
  'src/features/admin/pages/UserManagement.jsx',
  'src/features/farmer/components/FarmerMessageCenter.jsx',
  'src/features/farmer/components/MessageModal.jsx',
  'src/features/farmer/components/modals/FarmerStatusModal.jsx',
  'src/features/farmer/components/modals/SimpleInstructorModal.jsx',
  'src/features/farmer/pages/Activities.jsx',
  'src/features/farmer/pages/Calendar.jsx',
  'src/features/farmer/pages/CropPlans.jsx',
  'src/features/farmer/pages/FarmerHome.jsx',
  'src/features/farmer/pages/Harvest.jsx',
  'src/features/farmer/pages/PestManagement.jsx',
  'src/features/farmer/pages/Settings.jsx',
  'src/features/farmer/pages/Weather.jsx',
  'src/features/instructor/components/modals/AddFarmerModal.jsx',
  'src/features/instructor/components/modals/FarmerDetailModal.jsx',
  'src/features/instructor/components/modals/InstructorMessageModal.jsx',
  'src/features/instructor/components/modals/InstructorMessageModalUn.jsx',
  'src/features/instructor/components/modals/RatingsModal.jsx',
  'src/features/instructor/pages/CropPlanReview.jsx',
  'src/features/instructor/pages/FarmerManagement.jsx',
  'src/features/instructor/pages/InstructorHome.jsx',
  'src/features/instructor/pages/InstructorReports.jsx',
  'src/features/instructor/pages/InstructorSchedule.jsx',
  'src/features/instructor/pages/InstructorSettings.jsx',
  'src/features/instructor/pages/PestReports.jsx',
];

const base = 'd:/Test/SDP/Agri/frontend/';

// > SomeText < pattern for JSX text nodes
const jsxTextRegex = />\s*([A-Z][a-zA-Z0-9 \-\/&:,.'()!?#]{3,})\s*</g;
// hardcoded string attributes
const attrStringRegex = /(?:placeholder|title|alt|aria-label)=["']([A-Za-z][a-zA-Z0-9 \-\/&:,.'()!?#]{3,})["']/g;
// strong/label/span with text
const strongTextRegex = /<(?:strong|label|span|h[1-6]|p|div|td|th|li)[^>]*>\s*([A-Z][a-zA-Z0-9 \-\/&:,.'()!?#]{3,})\s*</g;

for (const f of files) {
  const fullPath = base + f;
  if (!fs.existsSync(fullPath)) { console.log('MISSING: ' + f); continue; }
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
  const hits = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // Skip: comments, import lines, lines already using t(), pure JS logic lines
    if (trimmed.startsWith('//')) return;
    if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (trimmed.startsWith('import ')) return;
    if (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ')) return;
    if (line.includes("t('") || line.includes('t("')) return;
    if (trimmed.startsWith('showToast(') || trimmed.startsWith('console.')) return;

    // Check JSX text nodes
    jsxTextRegex.lastIndex = 0;
    let m;
    while ((m = jsxTextRegex.exec(line)) !== null) {
      const txt = m[1].trim();
      if (txt.length < 4) continue;
      if (/^\d+[\s%]?$/.test(txt)) continue;
      if (txt.includes('{') || txt.includes('}')) continue;
      if (txt.startsWith('fas ') || txt.startsWith('fa-')) continue;
      if (txt.match(/^[A-Z][\w]*$/)) continue; // single PascalCase word - likely component name
      hits.push('  L' + (i + 1) + ': [TEXT] ' + txt.substring(0, 90));
    }

    // Check hardcoded attribute strings
    attrStringRegex.lastIndex = 0;
    while ((m = attrStringRegex.exec(line)) !== null) {
      const txt = m[1].trim();
      if (txt.length < 4) continue;
      if (/^\d+$/.test(txt)) continue;
      hits.push('  L' + (i + 1) + ': [ATTR] ' + txt.substring(0, 90));
    }
  });

  if (hits.length) {
    console.log('\n=== ' + f + ' (' + hits.length + ' hits) ===');
    hits.forEach(h => console.log(h));
  } else {
    console.log('[OK] ' + f);
  }
}
console.log('\n--- SCAN COMPLETE ---');
