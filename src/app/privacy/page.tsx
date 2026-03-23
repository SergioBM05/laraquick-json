import Link from 'next/link';

export default function Privacy() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-20 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline mb-8 inline-block">
          &larr; Volver a la herramienta
        </Link>

        <article className="bg-white p-10 md:p-16 rounded-3xl border border-slate-200 shadow-sm prose prose-slate max-w-none">
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Política de Privacidad</h1>
          
          <p className="text-lg text-slate-600 leading-relaxed">
            En <strong>LaraQuick JSON</strong>, la seguridad de tus datos es nuestra prioridad absoluta. 
            Esta política explica cómo manejamos la información en nuestro sitio.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-10">1. Procesamiento Local</h2>
          <p className="text-slate-600">
            A diferencia de otras herramientas, LaraQuick procesa todo el código JSON directamente en tu navegador. 
            <strong> No enviamos tu JSON a nuestros servidores</strong> ni almacenamos el contenido de tus estructuras de datos.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8">2. Google AdSense y Cookies</h2>
          <p className="text-slate-600">
            Utilizamos Google AdSense para mostrar anuncios. Google puede utilizar cookies para publicar anuncios 
            basados en las visitas anteriores de un usuario a este sitio web o a otros sitios web. Los usuarios pueden 
            inhabilitar la publicidad personalizada visitando la Configuración de anuncios de Google.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8">3. Seguridad</h2>
          <p className="text-slate-600">
            Al ser una herramienta que funciona del lado del cliente (Client-side), eliminamos cualquier riesgo 
            de interceptación de datos en el servidor. Tu código es tuyo y solo tuyo.
          </p>

          <footer className="mt-12 pt-8 border-t border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-widest">
            Última actualización: Marzo 2026
          </footer>
        </article>
      </div>
    </main>
  );
} 