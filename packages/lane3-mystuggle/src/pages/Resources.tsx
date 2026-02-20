import { PageContainer, Card, CardContent, Badge } from '@nfp/shared';
import { MapPin, Phone, Clock } from 'lucide-react';

const categories = [
  { label: 'Shelters', icon: '\u{1F3E0}', count: 0 },
  { label: 'Food', icon: '\u{1F37D}\uFE0F', count: 0 },
  { label: 'Medical', icon: '\u{1F3E5}', count: 0 },
  { label: 'Mental Health', icon: '\u{1F9E0}', count: 0 },
  { label: 'Legal Aid', icon: '\u2696\uFE0F', count: 0 },
  { label: 'Employment', icon: '\u{1F4BC}', count: 0 },
  { label: 'Transportation', icon: '\u{1F68C}', count: 0 },
  { label: 'Showers', icon: '\u{1F6BF}', count: 0 },
];

export default function Resources() {
  return (
    <PageContainer title="Resources" subtitle="Find help near you in Phoenix">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <Card key={cat.label} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">{cat.icon}</span>
              <h3 className="font-medium text-stone-800 mt-1 text-sm">{cat.label}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
