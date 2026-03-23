export const jsonToLaravelMigration = (json: string, tableName: string = 'posts'): string => {
    try {
        const data = JSON.parse(json);
        const obj = Array.isArray(data) ? data[0] : data;

        let fields = "";
        Object.keys(obj).forEach((key) => {
            const value = obj[key];
            let type = "string";

            if (typeof value == "number") type = Number.isInteger(value) ? "integer" : "decimal";
            if (typeof value == "boolean") type = "boolean";
            if (Array.isArray(value)) type = "json";

            fields += `$table->${type}('${key}')->nullable();\n`;
        });
        return `Schema::create('${tableName}', function (Blueprint $table) {$table->id();${fields}$table->timestamps();});`;

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
      definition += `            '${key}' => fake()->word(),\n`;
    });

    return `namespace Database\\Factories;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\Factory;\n\nclass ${className}Factory extends Factory\n{\n    public function definition(): array\n    {\n        return [\n${definition}        ];\n    }\n}`;
  } catch (e) { return "// JSON Inválido"; }
};