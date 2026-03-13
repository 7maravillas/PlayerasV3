import { PrismaClient, JerseyStyle, Audience, Sleeve } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const SIZES = ['S', 'M', 'L', 'XL'];

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Categoría General (Vital para el funcionamiento base)
  const catGeneral = await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: { name: 'General', slug: 'general' },
  });

  // 2. Ligas Europeas
  const laLiga = await prisma.league.upsert({
    where: { slug: 'laliga' },
    update: {},
    create: { name: 'La Liga', country: 'España', slug: 'laliga' },
  });

  const premier = await prisma.league.upsert({
    where: { slug: 'premier-league' },
    update: {},
    create: { name: 'Premier League', country: 'Inglaterra', slug: 'premier-league' },
  });

  // 3. Clubes
  const clubsData = [
    { name: 'Real Madrid', leagueId: laLiga.id },
    { name: 'FC Barcelona', leagueId: laLiga.id },
    { name: 'Manchester City', leagueId: premier.id },
    { name: 'Manchester United', leagueId: premier.id },
  ];

  const createdClubs = [];
  for (const c of clubsData) {
    const club = await prisma.club.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { name: c.name, slug: slugify(c.name), leagueId: c.leagueId },
    });
    createdClubs.push(club);
  }

  // 4. Temporada
  const season = await prisma.season.upsert({
    where: { code: '24/25' },
    update: {},
    create: { code: '24/25', startYear: 2024, endYear: 2025 },
  });

  // 5. Productos de Ejemplo (Para que no esté vacía la tienda)
  const productDefs = [
    { style: JerseyStyle.HOME, nameSuffix: 'Home 24/25' },
    { style: JerseyStyle.AWAY, nameSuffix: 'Away 24/25' },
  ];

  for (const club of createdClubs) {
    for (const def of productDefs) {
      const baseName = `${club.name} ${def.nameSuffix}`;
      const slug = slugify(baseName);

      // Definir marca según el equipo (solo para dar realismo)
      let brand = 'Nike';
      if (club.name.includes('Madrid') || club.name.includes('United')) brand = 'Adidas';
      if (club.name.includes('City')) brand = 'Puma';

      // Upsert Producto
      const product = await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name: baseName,
          slug,
          description: `Jersey oficial del ${club.name} para la temporada 24/25. Tecnología de secado rápido y corte atlético.`,
          brand: brand,
          jerseyStyle: def.style,
          authentic: false,
          clubId: club.id,
          seasonId: season.id,
          categoryId: catGeneral.id, // Asignamos la categoría general por defecto
          images: {
            create: [
              {
                // Usamos un placeholder random para que se vea algo
                url: `https://picsum.photos/seed/${slug}/900/1200`,
                width: 900,
                height: 1200,
                sortOrder: 0,
              },
            ],
          },
        },
      });

      // Creación de Variantes (Tallas S, M, L, XL)
      for (const size of SIZES) {
        const sku = `FB-${slug}-${size}-${Math.floor(Math.random() * 1000)}`;
        
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            size,
            audience: Audience.HOMBRE,
            sleeve: Sleeve.SHORT,
            priceCents: 189900, // $1,899.00
            costCents: 120000,
            stock: 20,
            currency: 'MXN'
          }
        });
      }
    }
  }

  // 6. Tags
  const tags = ['Retro', 'Edición Especial', 'Manga Larga'];
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { slug: slugify(t) },
      update: {},
      create: { name: t, slug: slugify(t) },
    });
  }

  console.log('✅ Seed completado con éxito. Equipos y productos cargados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });