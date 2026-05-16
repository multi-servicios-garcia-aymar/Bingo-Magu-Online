import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Match buttons that have transition-all but no closure before a component
content = content.replace(/transition-all hover:bg-slate-50 text-blue-600"\s*\n\s*<Chevron/g, 'transition-all hover:bg-slate-50 text-blue-600">\n<Chevron');
content = content.replace(/className="flex-1"\s*\n\s*<Bingo/g, 'className="flex-1">\n<Bingo');

fs.writeFileSync('src/App.tsx', content);
