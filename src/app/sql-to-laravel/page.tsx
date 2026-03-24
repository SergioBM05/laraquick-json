// src/app/sql-to-laravel/page.tsx
export const metadata = {
  title: 'SQL to Laravel Migration Converter | Online Tool',
  description: 'Convert your SQL CREATE TABLE statements into Laravel Migrations instantly. The best tool for legacy database migration to Laravel 11.',
};

export default function SqlToLaravel() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-20">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            SQL to Laravel <span className="text-indigo-600">Migration</span>
          </h1>
          <p className="text-lg text-slate-600 mt-4">
            Paste your <code>CREATE TABLE</code> SQL code and get a production-ready Laravel migration file.
          </p>
        </header>

        {/* Aquí iría el componente del editor similar al de JSON */}
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 min-h-[400px]">
           {/* Lógica del convertidor SQL */}
           <p className="text-center text-slate-400 mt-20 italic underline decoration-indigo-500/30">
             [Editor de SQL a Migración próximamente...]
           </p>
        </div>

        {/* BLOQUE DE TEXTO PARA GOOGLE */}
        <section className="mt-20 prose prose-indigo max-w-none border-t pt-10">
          <h2 className="text-3xl font-bold">Why Convert SQL to Laravel Migrations?</h2>
          <p>
            When migrating a <strong>legacy database</strong> to a modern PHP framework, 
            converting raw SQL schemas into <strong>Laravel Migrations</strong> is the first step. 
            This allows you to take advantage of version control for your database and 
            use Laravel's powerful schema builder.
          </p>
          <p>
            Our tool parses standard SQL syntax and translates it into:
            <ul>
              <li><code>$table-$gt id()</code> for primary keys.</li>
              <li><code>$table-$gt string()</code> for VARCHAR columns.</li>
              <li><code>$table-$gt foreignId()</code> for relational constraints.</li>
            </ul>
          </p>
        </section>
      </div>
    </main>
  );
}