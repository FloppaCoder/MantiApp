import React from 'react';
import { View } from 'react-native';
import { PageHeading } from '../components/page-heading';
import { Empty, styles } from '../components/ui';

export default function ToolsScreen({ onBack }: { onBack: () => void }) {
  return <>
    <PageHeading title="Herramientas asignadas" onBack={onBack} />
    <View style={styles.content}><Empty title="Herramientas asignadas" icon="construct-outline" message="El registro de herramientas aún no está disponible en el sistema." /></View>
  </>;
}
