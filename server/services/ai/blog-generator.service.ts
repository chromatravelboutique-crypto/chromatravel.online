import { callClaude } from "./claude";

export interface BlogGenerateInput {
  topic: string;
  keywords: string[];
  brandName: string;
  brandCode: string;
  whatsappNumber?: string;
  domain?: string;
  targetLength?: number;
}

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  tags: string[];
  excerpt: string;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function generateBlogPost(input: BlogGenerateInput): Promise<GeneratedBlogPost | null> {
  const tone =
    input.brandCode === "fenix"
      ? "premium, sofisticado y aspiracional"
      : "cálido, inclusivo y celebratorio (sin lenguaje binario, usa 'les/les/todxs' cuando aplique)";

  const waLink = input.whatsappNumber
    ? `https://wa.me/${input.whatsappNumber.replace(/\D/g, "")}`
    : "https://wa.me/524434044104";

  const domain = input.domain || "chromatravel.online";
  const wordTarget = input.targetLength || 1100;

  const system = `Eres un redactor SEO experto en turismo mexicano. Escribe artículos de blog en español para ${input.brandName}. Tono: ${tone}.
El artículo debe:
- Tener mínimo ${wordTarget} palabras
- Usar estructura H1/H2/H3 en markdown
- Incluir las keywords naturalmente sin saturar
- Terminar con un CTA claro invitando a contactar por WhatsApp: ${waLink}
- No incluir explicaciones, solo el artículo en markdown

Responde SOLO con el contenido markdown del artículo, comenzando directamente con el H1.`;

  const userMsg = `Escribe un artículo de blog sobre: "${input.topic}"
Keywords a incluir: ${input.keywords.join(", ")}
Sitio web: https://www.${domain}`;

  const content = await callClaude({
    system,
    messages: [{ role: "user", content: userMsg }],
    maxTokens: 3500,
    temperature: 0.7,
  });

  if (!content) return null;

  // Extract title from first H1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || input.topic;

  // Generate meta description (first meaningful paragraph after H1)
  const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const firstPara = lines[0]?.replace(/[*_`]/g, "").slice(0, 160) || `${input.topic} — ${input.brandName}`;

  const slug = toSlug(title);

  return {
    title,
    slug,
    content,
    metaDescription: firstPara,
    tags: input.keywords.slice(0, 5),
    excerpt: firstPara.slice(0, 200),
  };
}
