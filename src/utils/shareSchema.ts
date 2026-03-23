const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const shareSchema = async (tableName: string, jsonContent: string) => {
  const response = await fetch(`${API_URL}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      table_name: tableName,
      json_content: jsonContent,
    }),
  });

  if (!response.ok) throw new Error('Error al conectar con Laravel');
  return await response.json(); // Retornará el { slug: '...' }
};