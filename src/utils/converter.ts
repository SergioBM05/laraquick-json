export const jsonToLaravelMigration = (json: string, tableName: string = 'posts'): string => {
    try {
        const data = JSON.parse(json);
        const obj = Array.isArray(data) ? data[0] : data;

        let fields = "";
        Object.keys(obj).forEach((key) => {
            const value = obj[key];
            const k = key.toLowerCase();

            // 1. Relaciones (Prioridad máxima)
            if (k.endsWith('_id')) {
                fields += `            $table->foreignId('${key}')->constrained()->cascadeOnDelete();\n`;
                return;
            }

            // 2. Lógica Smart para tipos de datos
            if (['image', 'photo', 'avatar', 'cover', 'url', 'link'].some(s => k.includes(s))) {
                fields += `            $table->string('${key}')->nullable();\n`;
            } else if (['description', 'content', 'bio', 'body', 'notes', 'summary'].some(s => k.includes(s))) {
                fields += `            $table->text('${key}')->nullable();\n`;
            } else if (['price', 'amount', 'total', 'tax', 'cost', 'balance'].some(s => k.includes(s))) {
                fields += `            $table->decimal('${key}', 10, 2)->default(0.00);\n`;
            } else if (k.startsWith('is_') || k.startsWith('has_') || typeof value === "boolean") {
                fields += `            $table->boolean('${key}')->default(false);\n`;
            } else if (k.endsWith('_at') || ['date', 'event_time'].some(s => k.includes(s))) {
                fields += `            $table->timestamp('${key}')->nullable();\n`;
            } else {
                // Tipos por defecto basados en el valor
                let type = "string";
                if (typeof value == "number") type = Number.isInteger(value) ? "integer" : "float";
                if (Array.isArray(value)) type = "json";

                fields += `            $table->${type}('${key}')->nullable();\n`;
            }
        });

        return `Schema::create('${tableName}', function (Blueprint $table) {\n            $table->id();\n${fields}            $table->timestamps();\n        });`;

    } catch (e) {
        return "// JSON Inválido. Por favor, revisa el formato.";
    }
};

export const jsonToLaravelModel = (json: string, className: string = 'Example'): string => {
    try {
        const data = JSON.parse(json);
        const obj = Array.isArray(data) ? data[0] : data;
        const fields = Object.keys(obj).map(key => `'${key}'`).join(', ');

        return `namespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\n\nclass ${className} extends Model\n{\n    protected $fillable = [${fields}];\n}`;
    } catch (e) { return "// JSON Inválido"; }
};

export const jsonToLaravelFactory = (json: string, className: string = 'Example'): string => {
    try {
        const data = JSON.parse(json);
        const obj = Array.isArray(data) ? data[0] : data;
        let definition = "";

        Object.keys(obj).forEach((key) => {
            const k = key.toLowerCase();
            let fakeMethod = "fake()->word()";

            // Smart Fake Data
            if (k.includes('email')) fakeMethod = "fake()->unique()->safeEmail()";
            else if (k.includes('name')) fakeMethod = "fake()->name()";
            else if (k.includes('title')) fakeMethod = "fake()->sentence()";
            else if (k.includes('price') || k.includes('amount')) fakeMethod = "fake()->randomFloat(2, 10, 1000)";
            else if (k.startsWith('is_') || k.startsWith('has_')) fakeMethod = "fake()->boolean()";
            else if (k.includes('description') || k.includes('bio')) fakeMethod = "fake()->paragraph()";
            else if (k.endsWith('_id')) fakeMethod = "1"; // Valor por defecto para FK

            definition += `            '${key}' => ${fakeMethod},\n`;
        });

        return `namespace Database\\Factories;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\Factory;\n\nclass ${className}Factory extends Factory\n{\n    public function definition(): array\n    {\n        return [\n${definition}        ];\n    }\n}`;
    } catch (e) { return "// JSON Inválido"; }
};

export const jsonToLaravelRequest = (json: string, className: string = 'Example'): string => {
    try {
        const data = JSON.parse(json);
        const obj = Array.isArray(data) ? data[0] : data;
        let rules = "";

        Object.keys(obj).forEach((key) => {
            const k = key.toLowerCase();
            const value = obj[key];
            let r = ["'required'"];

            // Lógica Smart para Reglas de Validación
            if (k.includes('email')) r.push("'email'");
            if (k.includes('password')) r.push("'string'", "'min:8'");
            if (k.includes('url') || k.includes('link')) r.push("'url'");
            if (k.includes('image') || k.includes('photo')) r.push("'string'"); // O 'image' si es upload
            if (k.includes('price') || k.includes('amount')) r.push("'numeric'", "'min:0'");
            if (k.startsWith('is_') || typeof value === "boolean") r.push("'boolean'");
            if (k.endsWith('_at') || k.includes('date')) r.push("'date'");
            if (k.endsWith('_id')) r.push("'integer'", "'exists:" + k.replace('_id', 's') + ",id'");

            // Por defecto si es número pero no ha entrado en las anteriores
            if (typeof value === "number" && !k.includes('price')) r.push("'integer'");

            rules += `            '${key}' => [${r.join(', ')}],\n`;
        });

        return `namespace App\\Http\\Requests;\n\nuse Illuminate\\Foundation\\Http\\FormRequest;\n\nclass Store${className}Request extends FormRequest\n{\n    public function authorize(): bool\n    {\n        return true;\n    }\n\n    public function rules(): array\n    {\n        return [\n${rules}        ];\n    }\n}`;
    } catch (e) { return "// JSON Inválido"; }
};

export const jsonToLaravelController = (className: string = 'Example'): string => {
    const modelVar = className.toLowerCase();

    return `namespace App\\Http\\Controllers;\n\nuse App\\Models\\${className};\nuse App\\Http\\Requests\\Store${className}Request;\nuse Illuminate\\Http\\Request;\n\nclass ${className}Controller extends Controller\n{\n    public function index()\n    {\n        return ${className}::paginate();\n    }\n\n    public function store(Store${className}Request $request)\n    {\n        $${modelVar} = ${className}::create($request->validated());\n        return response()->json($${modelVar}, 201);\n    }\n\n    public function show(${className} $${modelVar})\n    {\n        return $${modelVar};\n    }\n\n    public function update(Request $request, ${className} $${modelVar})\n    {\n        $${modelVar}->update($request->all());\n        return $${modelVar};\n    }\n\n    public function destroy(${className} $${modelVar})\n    {\n        $${modelVar}->delete();\n        return response()->noContent();\n    }\n}`;
};

