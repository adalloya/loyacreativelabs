import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Consultor IA | Asistente Inteligente 24/7',
    description: 'Interactúa con nuestro experto en Inteligencia Artificial. Resuelve dudas, agenda reuniones y descubre cómo transformar tu negocio con Loya Creative Lab.',
    openGraph: {
        title: 'Habla con nuestra IA | Loya Creative Lab',
        description: 'Tu asistente digital personal. Haz preguntas sobre desarrollo web, branding y tecnología.',
    }
};

export default function ConsultantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
