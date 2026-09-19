const fs = require('fs');
let content = fs.readFileSync('src/components/ExpedientesView.tsx', 'utf8');

const targetDetail = `    return (
      <div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">
        <PageHeader`;
const replacementDetail = `    return (
      <div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">
        <div className="w-full max-w-7xl mx-auto">
        <PageHeader`;

const targetDetailEnd = `        </div>
      </div>
    );
  }`;
const replacementDetailEnd = `        </div>
        </div>
      </div>
    );
  }`;
  
const targetDash = `  // Dashboard de Tarjetas de Expedientes
  return (
    <div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">
      <PageHeader`;
const replacementDash = `  // Dashboard de Tarjetas de Expedientes
  return (
    <div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">
      <div className="w-full max-w-7xl mx-auto">
      <PageHeader`;

const targetDashEnd = `      )}
    </div>
  );
};`;
const replacementDashEnd = `      )}
      </div>
    </div>
  );
};`;

content = content.replace(targetDetail, replacementDetail);
content = content.replace(targetDetailEnd, replacementDetailEnd);
content = content.replace(targetDash, replacementDash);
content = content.replace(targetDashEnd, replacementDashEnd);

fs.writeFileSync('src/components/ExpedientesView.tsx', content);
