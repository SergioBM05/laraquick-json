
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