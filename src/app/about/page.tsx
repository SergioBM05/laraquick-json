// app/about/page.tsx
export default function About() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-20">
      <article className="max-w-3xl mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-sm prose prose-slate">
        <h1 className="text-4xl font-black text-slate-900 mb-6">Sobre LaraQuick JSON</h1>
        
        <p className="text-lg text-slate-600">
          LaraQuick JSON nació de una necesidad común entre desarrolladores: <strong>el tiempo es oro</strong>. 
          Configurar manualmente migraciones, modelos y fábricas en Laravel a partir de una respuesta de API puede ser 
          un proceso repetitivo y propenso a errores.
        </p>

        <h2 className="text-2xl font-bold mt-10">Nuestra Misión</h2>
        <p>
          Queremos simplificar el flujo de trabajo de los desarrolladores PHP y Laravel. 
          Nuestra herramienta permite transformar estructuras JSON complejas en código Eloquent limpio, 
          siguiendo las mejores prácticas de las versiones más recientes de Laravel (10 y 11).
        </p>

        <div className="bg-indigo-50 p-6 rounded-2xl my-8 border-l-4 border-indigo-600">
          <h3 className="text-indigo-900 font-bold m-0">Compromiso con la privacidad</h3>
          <p className="text-indigo-800 text-sm mb-0">
            A diferencia de otros convertidores online, LaraQuick procesa tu información 
            directamente en tu navegador. Tu código nunca viaja a un servidor externo, 
            garantizando que tus estructuras de datos permanezcan privadas.
          </p>
        </div>

        <h2 className="text-2xl font-bold mt-10">¿Quién está detrás?</h2>
        <p>
          Somos un equipo apasionado por el ecosistema de Laravel y el desarrollo web moderno con React y Next.js. 
          Creemos en las herramientas simples que resuelven problemas específicos de forma elegante.
        </p>

        <footer className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
            Gracias por usar LaraQuick JSON • Happy Coding!
          </p>
        </footer>
      </article>
    </main>
  );
}